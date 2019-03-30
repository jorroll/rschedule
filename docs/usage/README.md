This library has five main classes:

- [Schedule](usage/schedule-class)
- [Calendar](usage/calendar-class)
- [Rule](usage/rule-class)
- [Dates](usage/dates-class)
- [RScheduleConfig](#rscheduleconfig)

It also has makes use of an [`IDateAdapter`](../date-adapter) interface which allows rSchedule to be used with the date library of your choosing. Be sure to look at the [`IDateAdapter` interface section](../date-adapter) as you must provide a date adapter for each `Schedule`, `Calendar`, `Rule`, or `Dates` object you create.

I'll also call out here that all of the objects are generic and receive a `DateAdapterConstructor` type object. Type inference will often take care of this for you, but when it doesn't, remember that the type you need to pass is for the constructor.

i.e.

```typescript
// good
new Schedule<typeof MomentTZDateAdapter>();

// bad
new Schedule<MomentTZDateAdapter>();
```

Finally, it has an assortment of [Occurrence stream operators](./operators) which allow combining multiple occurrence streams from different objects into a single occurrence stream. Usage of the occurrence stream operators is heavily inspired by rxjs pipe operators. Internally, the iteration logic of both `Schedule` and `Calendar` is implemented using occurrence stream operators.

## RScheduleConfig

The `RScheduleConfig` object is a class with just one static property: `defaultDateAdapter`. It is a convenience property which allows you to define a global default `DateAdapter` constructor object which all rSchedule classes should use. See the [`IDateAdapter`](../date-adapter) section for more info.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.defaultDateAdapter = MomentTZDateAdapter;
```

## Shared Interfaces

Schedule, Calendar, Rule, and Dates objects each implement the `IHasOccurrences` interface. Note, in the code below, `DateProp<T>` refers to the date object that a given DateAdapter is wrapping (e.g. the `MomentDateAdapter` wraps a `Moment` date object). `DateAdapter<T>` refers to an instance of a date adapter.

For example, when providing the start date for `occurrences()`, you could pass in either `new MomentTZDateAdapter()` or `moment()`.

### IHasOccurrences

See the inline comments for more info. Also note that the `occurrences()` method yields date adapter instances. To get the underlying date object, call `.date` on the date adapter. You can see the [`IDateAdapter` interface](../date-adapter) for all the methods/properties available on date adapters, but `.date` and `.generators` are probably the only two properties you'll care about (if it wasn't for the need to return the list of `generators`, I'd almost certainly just yield the underlying date objects instead of date adapter objects).

````typescript
interface IHasOccurrences<T extends DateAdapterConstructor> {
  /**
   * Returns an `OccurrenceIterator` object which can be used to iterate
   * over the object's occurrences.
   *
   * Options object:
   * - `start` the date to begin iteration on
   * - `end` the date to end iteration on
   * - `take` the max number of dates to take before ending iteration
   * - `reverse` whether to iterate in reverse or not
   *
   * Examples:
   *
   * ```
   * const iterator = schedule.occurrences()
   *
   * for (const date of iterator) {
   *   // do stuff
   * }
   *
   * iterator.toArray()
   * iterator.next().value
   * ```
   *
   * @param arg `OccurrencesArgs` options object
   */
  occurrences(args?: {
    start?: DateProp<T> | DateAdapter<T>;
    end?: DateProp<T> | DateAdapter<T>;
    take?: number;
    reverse?: boolean;
  }): OccurrenceIterator<T>;

  occursBetween(
    start: DateProp<T> | DateAdapter<T>,
    end: DateProp<T> | DateAdapter<T>,
    options: { excludeEnds?: boolean },
  ): boolean;

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  occursOn(args: { date: DateProp<T> | DateAdapter<T> }): boolean;

  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  occursOn(args: {
    weekday: DateTime.Weekday;
    after?: DateProp<T> | DateAdapter<T>;
    before?: DateProp<T> | DateAdapter<T>;
    excludeEnds?: boolean;
  }): boolean;

  occursAfter(date: DateProp<T> | DateAdapter<T>, options: { excludeStart?: boolean }): boolean;

  occursBefore(date: DateProp<T> | DateAdapter<T>, options: { excludeStart?: boolean }): boolean;

  setTimezone(timezone: string | undefined, options?: { keepLocalTime?: boolean }): this;

  clone(): IHasOccurrences<T>;

  // A convenience property for storying arbitrary data
  data: any;
}

// Note that an occurrence iterator returns date adapter instances.
// To get the underlying date object, call `.date` on the result.
class OccurrenceIterator<T extends DateAdapterConstructor> {
  public [Symbol.iterator]: () => IterableIterator<InstanceType<T>>;

  public next(): IterableResult<InstanceType<T>>;

  // If the occurrence stream is infinite, and you didn't limit it with
  // arguments when calling `#occurrences()`, then `toArray()` will return
  // `undefined`, else it will return an array of all of the occurrences.
  public toArray(): InstanceType<T>[] | undefined;
}
````

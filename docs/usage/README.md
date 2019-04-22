# Using rSchedule

This library has four main occurrence generating classes which each implement `OccurrenceGenerator`:

- [Schedule](./schedule-class)
- [Calendar](./calendar-class)
- [Rule](./rule-class)
- [Dates](./dates-class)

If you plan on using rSchedule with the iCalendar spec, it also has a fifth `VEvent` object which replaces the `Schedule` object. [See the `@rschedule/ical-tools` docs for more info.](../serialization/ical)

Additionally, this library makes use of an [`IDateAdapter`](../date-adapter) interface which allows rSchedule to be used with the date library of your choosing. You must provide a date adapter for each `OccurrenceGenerator` object you create, usually as a `dateAdapter` argument.

All of the `OccurrenceGenerator<T extends typeof DateAdapter>` objects are _generic_ and receive a `typeof DateAdapter` type argument. Type inference will often take care of typing these objects for you but, when it doesn't, **remember that the type you need to pass is for the constructor** (i.e. `Schedule<typeof StandardDateAdapter>`).

For convenience, an [RScheduleConfig](./rschedule-config) object exists which allows you to set a global `defaultDateAdapter`, removing the need to provide a date adapter when creating `OccurrenceGenerator` objects. Making use of the `defaultDateAdapter`, however, will mean that typescript will not be able to infer the proper type and you'll need to specify it yourself.

Example of manually specifying types:

```typescript
// good
new Schedule<typeof MomentTZDateAdapter>();

// error!
new Schedule<MomentTZDateAdapter>();
```

Finally, this library has an assortment of [occurrence stream operators](./operators) which allow combining multiple occurrence generators into a single occurrence generator. Usage of the occurrence stream operators is heavily inspired by rxjs pipe operators. See [`occurrence stream operators`](./operators) for more information.

There is also an optional `@rschedule/rule-tools` library which contains utility functions for manipulating rSchedule `Rule` and `IScheduleLike` objects and working with common recurrence rule patterns. Even if you don't use it, it can provide a useful example of how to manipulate and build up rSchedule objects. [See the `rule-tools` docs for more information.](./rule-tools)

### IOccurrenceGenerator Interface

Schedule, Calendar, Rule, Dates, and OccurrenceStream objects each implement the `IOccurrenceGenerator` interface. Note, in the code below, `DateInput<T>` type accepts either the date object that a given DateAdapter is wrapping (e.g. the `MomentDateAdapter` wraps a `Moment` date object), or a date adapter itself.

````typescript
interface IOccurrenceGenerator<T extends DateAdapterConstructor> {
  readonly dateAdapter: T;
  readonly timezone: string | null;

  /**
   * Processes the object's rules/dates and returns an iterable for the occurrences.
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
   * const iterator = schedule.occurrences({ start: new Date(), take: 5 })
   *
   * for (const date of iterator) {
   *   // do stuff
   * }
   *
   * iterator.toArray() // returns Date array
   * iterator.next().value // returns next Date
   * ```
   *
   */
  occurrences(args: IOccurrencesArgs<T>): OccurrenceIterator<T>;

  /**
   * Iterates over the object's occurrences and bundles them into collections
   * with a specified granularity (default is `"INSTANTANIOUS"`). Make sure to
   * read about each option & combination of options below.
   *
   * Options object:
   *   - start?: DateAdapter
   *   - end?: DateAdapter
   *   - take?: number
   *   - reverse?: NOT SUPPORTED
   *   - granularity?: CollectionsGranularity
   *   - weekStart?: IDateAdapter.Weekday
   *   - incrementLinearly?: boolean
   *
   * Returned `Collection` object:
   *
   *   - `dates` property containing an array of DateAdapter objects.
   *   - `granularity` property containing the granularity.
   *     - `CollectionsGranularity` type extends `RuleOptions.Frequency` type by adding
   *       `"INSTANTANIOUS"`.
   *   - `periodStart` property containing a DateAdapter equal to the period's
   *     start time.
   *   - `periodEnd` property containing a DateAdapter equal to the period's
   *     end time.
   *
   * #### Details:
   *
   * `collections()` always returns full periods. This means that the `start` argument is
   * transformed to be the start of whatever period the `start` argument is in, and the
   * `end` argument is transformed to be the end of whatever period the `end` argument is
   * in.
   *
   * - Example: with granularity `"YEARLY"`, the `start` argument will be transformed to be the
   *   start of the year passed in the `start` argument, and the `end` argument will be transformed
   *   to be the end of the year passed in the `end` argument.
   *
   * By default, the `periodStart` value of `Collection` objects produced by this method does not
   * necessarily increment linearly. A collection will *always* contain at least one date,
   * so the `periodStart` from one collection to the next can "jump". This can be changed by
   * passing the `incrementLinearly: true` option. With this argument, `collections()` will
   * return `Collection` objects for each period in linear succession, even if a collection object
   * has no dates associated with it, so long as the object generating occurrences still has upcoming occurrences.
   *
   * - Example 1: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({granularity: 'DAILY', start: new Date(2019,0,1)})`
   *   (so starting on January 1st), the first Collection produced will have a `periodStart` in February.
   *
   * - Example 2: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({incrementLinearly: true, granularity: 'DAILY', start: new Date(2019,0,1)})`
   *   (so starting on January 1st), the first collection produced will have a `Collection#periodStart`
   *   of January 1st and have `Collection#dates === []`. Similarly, the next 30 collections produced
   *   (Jan 2nd - 31st) will all contain an empty array for the `dates` property. Then the February 1st
   *   `Collection` will contain dates.
   *
   * When giving a `take` argument to `collections()`, you are specifying
   * the number of `Collection` objects to return (rather than occurrences).
   *
   * When choosing a granularity of `"WEEKLY"`, the `weekStart` option is required.
   *
   * When choosing a granularity of `"MONTHLY"`:
   *
   * - If the `weekStart` option *is not* present, will generate collections with
   *   the `periodStart` and `periodEnd` at the beginning and end of each month.
   *
   * - If the `weekStart` option *is* present, will generate collections with the
   *   `periodStart` equal to the start of the first week of the month, and the
   *   `periodEnd` equal to the end of the last week of the month. This behavior could be
   *   desired when rendering opportunities in a calendar view, where the calendar renders
   *   full weeks (which may result in the calendar displaying dates in the
   *   previous or next months).
   *
   */
  collections(args: ICollectionsArgs<T>): CollectionIterator<T>;

  occursBetween(
    start: DateInput<T>,
    end: DateInput<T>,
    options: { excludeEnds?: boolean },
  ): boolean;

  occursOn(args: { date: DateInput<T> }): boolean;
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * **If there are infinite occurrences, you must include a `before` argument with
   * the `weekday` argument.**
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  occursOn(args: {
    weekday: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean;

  occursAfter(date: DateInput<T>, options: { excludeStart?: boolean }): boolean;

  occursBefore(date: DateInput<T>, options: { excludeStart?: boolean }): boolean;

  pipe(...operators: unknown[]): IOccurrenceGenerator<T>;

  /**
   * Allows setting the timezone associated with this `IOccurrenceGenerator`.
   * If `keepLocalTime === true`, then any `Rule` objects associated
   * with this occurrence generator will be changed so that their `start` time
   * is in this timezone while retaining the same local time. This fundamentally changes
   * the rule. Similarly, any `Dates` objects associated with this occurrence generator
   * will have their underlying dates updated so that they are in this timezone while
   * retaining the same local time (fundamentally changing the dates).
   */
  set(
    prop: 'timezone',
    value: string | null,
    options?: { keepLocalTime?: boolean },
  ): IOccurrenceGenerator<T>;
}
````

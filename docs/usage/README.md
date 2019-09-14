# Using rSchedule

This library has four main occurrence generating classes which each implement `OccurrenceGenerator`:

- [Schedule](./schedule)
- [Calendar](./calendar)
- [Rule](./rule)
- [Dates](./dates)

If you plan on using rSchedule with the iCalendar spec, it also has a fifth `VEvent` object which replaces the `Schedule` object. [See the `@rschedule/ical-tools` docs for more info.](../serialization/ical)

- [VEvent](../serialization/ical)

Finally, this library has an assortment of [occurrence stream operators](./operators) which allow combining multiple occurrence generators into a single occurrence generator. Usage of the occurrence stream operators is heavily inspired by rxjs pipe operators. See [`occurrence stream operators`](./operators) for more information.

There is also an optional `@rschedule/rule-tools` library which contains utility functions for manipulating rSchedule `Rule` and `IScheduleLike` objects and working with common recurrence rule patterns. Even if you don't use it, it can provide a useful example of how to manipulate and build up immutable rSchedule objects. [See the `rule-tools` docs for more information.](./rule-tools)

### Setup

rSchedule supports multiple date libraries though a [`DateAdapter`](../date-adapter) interface. To get started, you need to import the date adapter for your chosen date library. You only need to do this once, to set up the module.

For example:

```ts
import '@rschedule/moment-date-adapter/setup';
```

### CR**UD** with rSchedule objects

All of rSchedule's objects are immutable (the major exception is the `data` property that many of the occurrence generators have). This decision _greatly_ reduces the number of bugs and helps to optimize the performance of rSchedule objects for reading. The downside is that this can make updating the objects a bit strange and clumsy compared to typical mutable javascript APIs. While each rSchedule object is different, this section provides a brief introduction on how to change rSchedule objects.

As a reminder, you can check out the optional [`rule-tools` package](./rule-tools) that aims to provide convenient helper functions that simplify common tasks (feel free to contribute anything you feel is missing from this package).

#### Example: adding an rrule to a schedule

```ts
import '@rschedule/standard-date-adapter/setup';

let schedule = new Schedule({
  rrules: [
    {
      frequency: 'YEARLY',
      byMonthOfYear: [2, 6],
      byDayOfWeek: ['SU', ['MO', 3]],
      start: new Date(2010, 1, 7),
    },
  ],
});

schedule = schedule.add(
  'rrule',
  new Rule({
    frequency: 'DAILY',
    byDayOfWeek: ['TU'],
    start: new Date(2012, 1, 7),
  }),
);
```

#### Example: removing an rrule from a schedule

```ts
let schedule = new Schedule({
  rrules: [
    {
      frequency: 'YEARLY',
      byMonthOfYear: [2, 6],
      byDayOfWeek: ['SU', ['MO', 3]],
      start: new Date(2010, 1, 7),
    },
    {
      frequency: 'DAILY',
      byDayOfWeek: ['TU'],
      start: new Date(2012, 1, 7),
    },
  ],
});

schedule = schedule.remove('rrule', schedule.rrules[1]);
```

#### Example: changing a rule associated with a schedule

```ts
let schedule = new Schedule({
  rrules: [
    {
      frequency: 'YEARLY',
      byMonthOfYear: [2, 6],
      byDayOfWeek: ['SU', ['MO', 3]],
      start: new Date(2010, 1, 7),
    },
  ],
});

const updatedRule = schedule.rrules[0].set('byMonthOfYear', [2, 7]);

schedule = schedule.remove('rrule', schedule.rrules[0]).add('rrule', updatedRule);
```

#### Example: adding an rdate to a schedule

```ts
let schedule = new Schedule();

schedule = schedule.add('rdate', new Date());
```

### OccurrenceGenerator Interface

Schedule, Calendar, Rule, Dates, and OccurrenceStream objects each implement the `IOccurrenceGenerator` interface. Note, in the code below, `DateInput<T>` type accepts either the date object that a given DateAdapter is wrapping (e.g. the `MomentDateAdapter` wraps a `Moment` date object), or a date adapter itself.

````typescript
abstract class OccurrenceGenerator {
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

  /**
   * Returns true if an occurrence starts on or between the provided start/end
   * datetimes. If the `excludeEnds` option is provided, then occurrences
   * equal to the start/end times are ignored.
   *
   * If the occurrence generator has a duration, and `excludeEnds !== true`,
   * then any occurrence that's time overlaps with the start/end times
   * return true.
   */
  occursBetween(
    start: DateInput<T>,
    end: DateInput<T>,
    options: { excludeEnds?: boolean; maxDuration?: number },
  ): boolean;

  /**
   * Checks to see if an occurrence exists which equals the given date.
   *
   * If this occurrence generator has a duration, then `occursOn()` will check
   * to see if an occurrence is happening during the given datetime.
   *
   * Additionally, if this occurrence generator has a duration, then a maxDuration
   * argument must be provided. This argument should be the max number of milliseconds
   * that an occurrence's duration can be. When you create an occurrence
   * generator, you can specify the maxDuration at that time.
   */
  occursOn(args: { date: DateInput<T>; maxDuration?: number }): boolean;
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

  /**
   * Returns true if an occurrence starts after the provided datetime.
   * If the `excludeStart` option is provided, then occurrences
   * equal to the provided datetime are ignored.
   *
   * If the occurrence generator has a duration, and `excludeStart !== true`,
   * then any occurrence that's end time is after/equal to the provided
   * datetime return true.
   */
  occursAfter(
    date: DateInput<T>,
    options: { excludeStart?: boolean; maxDuration?: number },
  ): boolean;

  /**
   * Returns true if an occurrence starts before the provided datetime.
   * If the `excludeStart` option is provided, then occurrences
   * equal to the provided datetime are ignored.
   *
   * If the occurrence generator has a duration, and `excludeStart` is
   * also provided, then this will only return true if an occurrence
   * both starts and ends before the provided datetime.
   */
  occursBefore(
    date: DateInput<T>,
    options: { excludeStart?: boolean; maxDuration?: number },
  ): boolean;

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

# Using rSchedule

**_This assumes you have followed the [setup instructions](../#setup)_**

This library has four main occurrence generating classes which each extend `OccurrenceGenerator`:

- [Schedule](./schedule)
- [Calendar](./calendar)
- [Rule](./rule)
- [Dates](./dates)

If you plan on using rSchedule with the iCalendar spec, it also has a fifth `VEvent` object which replaces the `Schedule` object. [See the `@rschedule/ical-tools` docs for more info.](../serialization/ical)

- [VEvent](../serialization/ical)

Finally, this library has an assortment of [occurrence stream operators](./operators) which allow combining multiple occurrence generators in various ways. Usage of the occurrence stream operators is heavily inspired by rxjs pipe operators. See [`occurrence stream operators`](./operators) for more information.

There is also an optional `@rschedule/rule-tools` library which contains utility functions for manipulating rSchedule `Rule` and `Schedule` objects and working with common recurrence rule patterns. Even if you don't use it, it can provide a useful example of how to manipulate and build up immutable rSchedule objects. [See the `rule-tools` docs for more information.](./rule-tools)

### Overview

If you're not serializing to iCalendar, your primary tool will be the friendly [`Schedule`](./schedule) object. It can be used to build an occurrence schedule from an arbitrary number of inclusion rules, exclusion rules, inclusion dates, and exclusion dates.

Example usage:

```typescript
const schedule = new Schedule({
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
  exdates: [new Date(2010, 3, 2)],
});

schedule.occurrences().toArray();
```

Each [`Schedule`](./schedule) object is intended to contain all the recurrence information to iterate through a single event, while following an API inspired by the ICAL spec. As such, duplicate occurrences are filtered out.

To iterate over a collection of schedules, e.g. for displaying on a calendar, you can use the [`Calendar`](./calendar) object. The Calendar object combines a collection of occurrence generators into a single iterable object (i.e. it displays the `union` of all the given occurrence generators).

Example usage:

```typescript
const scheduleOne = new Schedule();
const scheduleTwo = new Schedule();

const calendar = new Calendar({
  schedules: [scheduleOne, scheduleTwo],
});

for (const { date } of calendar.occurrences({ start: new Date() })) {
  // do stuff
}
```

Additionally, the [`Dates`](./dates) object provides an `OccurrenceGenerator` wrapper over a collection of arbitrary dates.

Example usage:

```typescript
const dates = new Dates({
  dates: [new Date(2000), new Date(2001), new Date(2002)],
});

dates.occursOn({ date: new Date(2000) }); // true

for (const { date } of dates.occurrences({ start: new Date(2000, 5) })) {
  // do stuff
}
```

For more complex scenerios, rSchedule offers a set of [occurrence stream operator](./operators) functions which allow combining and manipulating a stream of occurrences. Usage is inspired the rxjs pipe operators.

Example usage:

```typescript
import { add, subtract, unique } from './rschedule';

const scheduleOne = new Schedule();
const scheduleTwo = new Schedule();
const scheduleThree = new Schedule();
const scheduleFour = new Schedule();

new Calendar().pipe(
  add(scheduleOne),
  subtract(scheduleTwo),
  add(scheduleThree),
  subtract(scheduleFour),
  unique(),
);
```

Internally, some rSchedule objects rely on occurrence stream operators to handle their recurrence logic (e.g. `Schedule`).

Finally, there are [`Rule` objects](./rule) which process recurrence rules. You probably won't need to use `Rule` object's directy though, instead making use of `Schedule` objects.

### CRUD with rSchedule objects

All of rSchedule's objects are immutable (the major exception is the `data` property that many of the occurrence generators have). This decision _greatly_ simplifies the implementation (reducing the number of bugs) and helps to optimize the performance of rSchedule objects for reading. The downside is that this can make updating the objects a bit strange and clumsy compared to typical mutable javascript APIs. While each rSchedule object is different, this section provides a brief introduction on how to change rSchedule objects.

As a reminder, you can check out the optional [`rule-tools` package](./rule-tools) that aims to provide convenient helper functions that simplify common tasks.

#### Example: adding an rrule to a schedule

```ts
import { Schedule, Rule } from './rschedule';

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

Schedule, Calendar, Rule, and Dates objects each extend the `OccurrenceGenerator` class. Note, in the code below, the `DateInput` type accepts either the date object that a given DateAdapter is wrapping (e.g. the `MomentDateAdapter` wraps a `Moment` date object), or a date adapter itself.

````typescript
abstract class OccurrenceGenerator {
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  /**
   * The maximum duration of this generators occurrences. Necessary
   * as part of the logic processing. By default it is 0.
   */
  readonly maxDuration: number;
  readonly timezone: string | null;

  /** Returns the first occurrence or, if there are no occurrences, null. */
  readonly firstDate: DateAdapter | null;

  /** If generator is infinite, returns `null`. Otherwise returns the end date */
  readonly lastDate: DateAdapter | null;

  constructor(args?: { timezone?: string | null; maxDuration?: number }): OccurrenceGenerator;

  pipe(...operators: OperatorFnOutput[]): OccurrenceGenerator;

  set(
    prop: 'timezone',
    value: string | null,
    options?: { keepLocalTime?: boolean },
  ): OccurrenceGenerator;

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
   * const iterator = schedule.occurrences({ start: new Date(), take: 5 });
   
   * for (const date of iterator) {
   *   // do stuff
   * }

   * iterator.toArray() // returns Date array
   * iterator.next().value // returns next Date
   * ```
   * 
   */
  occurrences(args?: IOccurrencesArgs): OccurrenceIterator;

  /**
   * Iterates over the object's occurrences and bundles them into collections
   * with a specified granularity (default is `"YEARLY"`). Make sure to
   * read about each option & combination of options below.
   *
   * Options object:
   *   - start?: DateAdapter
   *   - end?: DateAdapter
   *   - take?: number
   *   - reverse?: NOT SUPPORTED
   *   - granularity?: CollectionsGranularity
   *   - weekStart?: DateAdapter.Weekday
   *   - skipEmptyPeriods?: boolean
   *
   * Returned `Collection` object:
   *
   *   - `dates` property containing an array of DateAdapter objects.
   *   - `granularity` property containing the granularity.
   *     - `CollectionsGranularity` === `RuleOptions.Frequency`.
   *     - default is `"YEARLY"`
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
   * By default, the `periodStart` value of `Collection` objects produced by this method increments linearly.
   * This means the returned `Collection#dates` property may have length 0. This can be changed by
   * passing the `skipEmptyPeriods: true` option, in which case the `periodStart` from one collection to the
   * next can "jump".
   *
   * - Example 1: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({skipEmptyPeriods: true, granularity: 'DAILY', start: new Date(2019,0,1)})`
   *   (so starting on January 1st), the first Collection produced will have a `periodStart` in February.
   *
   * - Example 2: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({granularity: 'DAILY', start: new Date(2019,0,1)})`
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
  collections(args?: ICollectionsArgs): CollectionIterator;

  /**
   * Returns true if an occurrence starts on or between the provided start/end
   * datetimes. If the `excludeEnds` option is provided, then occurrences
   * equal to the start/end times are ignored.
   *
   * If the occurrence generator has a duration, and `excludeEnds !== true`,
   * and a `maxDuration` argument is supplied (either in the constructor or
   * here), then any occurrence that's time overlaps with the start/end times
   * return true.
   */
  occursBetween(
    startInput: DateInput,
    endInput: DateInput,
    options?: { excludeEnds?: boolean; maxDuration?: number },
  ): boolean;

  /**
   * Checks to see if an occurrence exists which equals the given date.
   *
   * If this occurrence generator has a duration, and a `maxDuration`
   * argument is supplied (either in the constructor or here),
   * then `occursOn()` will check to see if an occurrence is happening
   * during the given datetime.
   *
   * Additionally, if this occurrence generator has a duration, then a maxDuration
   * argument must be provided. This argument should be the max number of milliseconds
   * that an occurrence's duration can be. When you create an occurrence
   * generator, you can specify the maxDuration at that time.
   */
  occursOn(args: { date: DateInput; maxDuration?: number }): boolean;
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * **If there are infinite occurrences, you must include a `before` argument with
   * the `weekday` argument.** Does not currently consider occurrence duration.
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  occursOn(args: {
    weekday: DateAdapter.Weekday;
    after?: DateInput;
    before?: DateInput;
    excludeEnds?: boolean;
  }): boolean;

  /**
   * Returns true if an occurrence starts after the provided datetime.
   * If the `excludeStart` option is provided, then occurrences
   * equal to the provided datetime are ignored.
   *
   * If the occurrence generator has a duration, and `excludeStart !== true`,
   * and a `maxDuration` argument is supplied (either in the constructor or
   * here), then any occurrence that's end time is after/equal to the provided
   * datetime return true.
   */
  occursAfter(date: DateInput, options?: { excludeStart?: boolean; maxDuration?: number }): boolean;

  /**
   * Returns true if an occurrence starts before the provided datetime.
   * If the `excludeStart` option is provided, then occurrences
   * equal to the provided datetime are ignored.
   *
   * If the occurrence generator has a duration, and `excludeStart` is
   * also provided, then this will only return true if an occurrence
   * both starts and ends before the provided datetime.
   */
  occursBefore(date: DateInput, options?: { excludeStart?: boolean }): boolean;
}
````

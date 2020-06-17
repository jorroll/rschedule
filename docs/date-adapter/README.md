# Date adapters

rSchedule is date library agnostic. It needs a `DateAdapter` constructor to process dates. A selection of DateAdapters already exist. Additionally, it should be pretty easy for you to create your own date adapter for whatever date library you wish. As with other rSchedule objects, date adapters are immutable.

- [StandardDateAdapter](./standard-date-adapter)
  - For use with the standard javascript `Date` object. Supports local and UTC timezones.
- [MomentDateAdapter](./moment-date-adapter)
  - For use with moment `Moment` objects. Supports local and UTC timezones.
- [MomentTZDateAdapter](./moment-tz-date-adapter)
  - For use with moment-timezone `Moment` objects. Has full timezone support.
- [LuxonDateAdapter](./luxon-date-adapter)
  - For use with luxon `DateTime` objects. Has full timezone support.
- [DayjsDateAdapter](./dayjs-date-adapter)
  - For use with dayjs `Dayjs` objects. Supports local and UTC timezones.
- [JodaDateAdapter](./joda-date-adapter)
  - For use with js-joda `ZonedDateTime` objects. Has full timezone support.

### Standard Setup

Before you can make use of rSchedule, you must set it up with a date adapter. Each of the provided date adapter packages has a `*/setup` entry point which will not only configure the date adapter for you, but also configure the rSchedule `Rule` object with all the recurrence rules.

Example usage:

```ts
import '@rschedule/moment-tz-date-adapter/setup';

// or

import '@rschedule/standard-date-adapter/setup';
```

If you import the provided `*/setup` file, then everything is configured for you.

### Custom Setup

If you wish to handle setup yourself (e.g. in order to customize which recurrence rules are used or because you have a custom DateAdapter), you need to do the following:

1. Configure `DateAdapterBase` with your chosen date adapter (i.e. `DateAdapterBase.adapter = StandardDateAdapter`).
2. If you plan on using the rSchedule provided `Rule` object, you must configure `Rule` with your chosen recurrence rules (i.e. `Rule.recurrenceRules = ICAL_RULES`). The order of the recurrence rules matters as some rules may depend on other rules running first.
   - Currently the rules API is not well documented. You can open an issue if you have trouble.
3. If using typescript, as a third step you need to update `DateAdapterType` and `DateAdapterCTorType` with your chosen date adapter using declaration merging.

   - ```ts
     declare module '@rschedule/core/DateAdapter' {
       interface DateAdapterType {
         standard: StandardDateAdapter;
       }

       interface DateAdapterCTorType {
         standard: typeof StandardDateAdapter;
       }
     }
     ```

### The `generators` property

Each DateAdapter has a `generators` property which contains an array of the rSchedule objects which are responsible for generating that particular date. For example, when iterating through a `Schedule` containing two `Rule` objects, each yielded DateAdapter will have a `generators` property with a length two array. The first element will be the `Rule` object which generated the date, the second element will be the `Schedule` object which generated the date. The `DateAdapter#generators` property pairs with the `data` property found on `Schedule`, `Calendar`, `Rule`, and `Dates` objects. This allows you to attach data to a `Rule` or `Schedule`, and access that data from the yielded dates.

Example:

```typescript
const schedule = new Schedule({
  rrules: [
    new Rule(
      {
        start: new Date(),
        frequency: 'DAILY',
        byDayOfWeek: ['MO'],
      },
      { data: 'Mondays Rule' },
    ),
    new Rule(
      {
        start: new Date(),
        frequency: 'DAILY',
        byDayOfWeek: ['WE'],
      },
      { data: 'Wednesdays Rule' },
    ),
  ],
  data: 'The schedule',
});

for (const adapter of schedule.occurrences()) {
  const rule = adapter.generators[0];
  const schedule = adapter.generators[1];

  rule.data; // either 'Mondays Rule' or 'Wednesdays Rule', depending

  schedule.data; // 'The schedule'
}
```

Note if you are using occurrence operators: occurrence operators are **not** added to DateAdapter#generators.

## Creating Your Own DateAdapter

This shouldn't be too difficult. Start by looking at either the `MomentDateAdapter` or `MomentTZDateAdapter` (depending on if you'll be supporting timezones) in `packages/moment-date-adapter` for an example.

Your custom date adapter will need to extend the abstract `DateAdapterBase` class.

If you choose to do so, `DateAdapter` related pull requests will be welcomed.

## DateAdapterBase

```typescript
export abstract class DateAdapterBase {
  static adapter: DateAdapterCTor;
  static readonly date: object;
  static readonly hasTimezoneSupport: boolean = false;

  static abstract isDate(_object: unknown): boolean;

  static abstract fromDate(
    _date: DateAdapter['date'],
    _options?: { duration?: number },
  ): DateAdapter;

  static abstract fromJSON(_json: DateAdapter.JSON): DateAdapter;

  static abstract fromDateTime(_datetime: DateTime): DateAdapter;

  abstract readonly date: object;
  abstract readonly timezone: string | null;
  /** A length of time in milliseconds */
  readonly duration: number;

  /**
   * Returns `undefined` if `this.duration` is falsey. Else returns
   * the `end` date.
   */
  abstract end: object | undefined;

  /**
   * An array of OccurrenceGenerator objects which produced this DateAdapter.
   *
   * #### Details
   *
   * When a Rule object creates a DateAdapter, that Rule object adds itself to
   * the DateAdapter's generators property before yielding the DateAdapter. If you are using a Rule
   * object directly, the process ends there and the DateAdapter is yielded to you (in this case,
   * generators will have the type `[Rule]`)
   *
   * If you are using another object, like a Schedule however, then each DateAdapter is generated
   * by either a Dates (rdates) or Rule (rrule) within the Schedule. After being originally
   * generated by a Dates/Rule, the DateAdapter is then filtered by any exdate/exrules and,
   * assuming it passes, then the DateAdapter "bubbles up" to the Schedule object itself. At this
   * point the Schedule adds itself to the generators array of the DateAdapter and yields the date
   * to you. So each DateAdapter produced by a Schedule has a generators property of type
   * `[Schedule, Rule | Dates]`.
   *
   * The generators property pairs well with the `data` property on many OccurrenceGenerators. You
   * can access the OccurrenceGenerators which produced a DateAdapter via `generators`, and then
   * access any arbitrary data via the `data` property.
   *
   * _Note: occurrence operators are never included in the generators array._
   *
   */
  // using `unknown[]` instead of `never[]` to support convenient generator typing in `Calendar`.
  // If `never[]` is used, then `Calendar#schedules` *must* be typed as a tuple in order to
  // access any values in `generators` beyond the first (Calendar) value (the rest of the values
  // get typed as `never`). This would prevent passing a variable to `Calendar#schedules`.
  readonly generators: ReadonlyArray<unknown> = [];

  protected constructor(_date: unknown, options?: { duration?: number });

  abstract set(prop: 'timezone', value: string | null): this;
  abstract set(prop: 'duration', value: number): this;

  abstract valueOf(): number;

  abstract toISOString(): string;

  toDateTime(): DateTime;

  abstract toJSON(): DateAdapter.JSON;

  abstract assertIsValid(): boolean;
}
```

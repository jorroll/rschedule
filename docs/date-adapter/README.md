# Date adapters

rSchedule is date library agnostic. It needs a `IDateAdapter` constructor to process dates. A selection of DateAdapters already exist. Additionally, it should be pretty easy for you to create your own date adapter for whatever date library you wish.

- [StandardDateAdapter](./standard-date-adapter)
  - For use with the standard javascript `Date` object. Supports local and UTC timezones.
- [MomentDateAdapter](./moment-date-adapter)
  - For use with moment `Moment` objects. Supports local and UTC timezones.
- [MomentTZDateAdapter](./moment-tz-date-adapter)
  - For use with moment-timezone `Moment` objects. Has full timezone support.
- [LuxonDateAdapter](./luxon-date-adapter)
  - For use with luxon `DateTime` objects. Has full timezone support.

Date adapters are provided to rSchedule occurrence generator objects, all of which have generic types and receive a `typeof DateAdapter` type object as an argument. There are two ways to provide this argument.

1. When creating the generator object, provide the date adapter constructor

   ```typescript
   new Schedule({ dateAdapter: LuxonDateAdapter });

   const providedRuleOptions = {
     start: moment(),
     frequency: 'DAILY',
   };

   new Rule(providedRuleOptions, { dateAdapter: MomentTZDateAdapter });
   ```

2. Set the default date adapter for all rSchedule classes using [`RScheduleConfig.defaultDateAdapter`](../usage/rschedule-config/#defaultDateAdapter).

   ```typescript
   RScheduleConfig.defaultDateAdapter = MomentTZDateAdapter;

   new Schedule<typeof MomentTZDateAdapter>();

   const providedRuleOptions = {
     start: moment(),
     frequency: 'DAILY',
   };

   new Rule<typeof MomentTZDateAdapter>(providedRuleOptions);
   ```

When providing a date adapter constructor as a constructor argument (option 1, above), type inference will often take care of properly typing your generic objects for you. In cases where type inference is unavailable, you will need to manually provide the property type arguments. In these cases, remember that the type argument you need to provide is for the date adapter **_constructor_** (not a date adapter _instance_). In Typescript, you get a constructor type using the `typeof` keyword.

- ```typescript
  // good
  new Schedule<typeof MomentTZDateAdapter>();

  // bad
  new Schedule<MomentTZDateAdapter>();
  ```

Each DateAdapter has a `generators` property which contains an array of the rSchedule objects which are responsible for generating that particular date. For example, when iterating through a `Schedule` containing two `Rule` objects, each yielded DateAdapter will have a `generators` property with a length two array. The first element will be the `Rule` object which generated the date, the second element will be the `Schedule` object which generated the date. The `IDateAdapter#generators` property pairs with the `data` property found on `Schedule`, `Calendar`, `Rule`, and `Dates` objects. This allows you to attach data to a `Rule` or `Schedule`, and access that data from the yielded dates.

Example:

```typescript
const schedule = new Schedule({
  dateAdapter: StandardDateAdapter,
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

Your custom date adapter will need to extend the abstract `DateAdapter` class.

If you choose to do so, `IDateAdapter` related pull requests will be welcomed.

## IDateAdapter Interface

```typescript
export interface IDateAdapter<D = unknown> {
  /** Returns the date object this DateAdapter is wrapping */
  readonly date: D;
  readonly timezone: string | null;
  readonly duration: number | undefined;

  /**
   * This property contains an ordered array of the generator objects
   * responsible for creating this IDateAdapter.
   *
   * Examples:
   *
   * - If this IDateAdapter was produced by a `Rule` object, this array
   *   will just contain the `Rule` object.
   *
   * - If this IDateAdapter was produced by a `Schedule` object, this
   *   array will contain the `Schedule` object as well as the `Rule`
   *   or `Dates` object which generated it.
   */
  readonly generators: unknown[];

  valueOf(): number;

  toISOString(): string;

  toDateTime(): DateTime;

  toJSON(): IDateAdapter.JSON;

  assertIsValid(): boolean;
}
```

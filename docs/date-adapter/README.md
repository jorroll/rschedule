rSchedule is date library agnostic. It needs a `IDateAdapter` constructor to process dates. A selection of DateAdapters already exist. Additionally, it should be really easy for you to create your own date adapter for whatever date library you wish.

Most all of the rSchedule objects are generic and receive a `DateAdapterConstructor` type object as an argument. There are three ways to do this.

1. When creating the object, provide the date adapter constructor

   - ```typescript
     new Schedule({ dateAdapter: MomentTZDateAdapter });

     const providedRuleOptions = {
       start: moment(),
       frequency: 'DAILY',
     };

     new RRule(providedRuleOptions, { dateAdapter: MomentTZDateAdapter });
     ```

2) Set the default date adapter on a particular rSchedule class constructor.

   - ```typescript
     Schedule.defaultDateAdapter = MomentTZDateAdapter;

     new Schedule();

     const providedRuleOptions = {
       start: moment(),
       frequency: 'DAILY',
     };

     new RRule(providedRuleOptions, { dateAdapter: MomentTZDateAdapter });
     ```

3) Set the default date adapter for all rSchedule classes using `RScheduleConfig`.

   - ```typescript
     RScheduleConfig.defaultDateAdapter = MomentTZDateAdapter;

     new Schedule();

     const providedRuleOptions = {
       start: moment(),
       frequency: 'DAILY',
     };

     new RRule(providedRuleOptions);
     ```

When providing a date adapter constructor as a constructor argument (option 1, above), type inference will often take care of properly typing your generic objects for you. In cases where type inference is unavailable, you will need to manually provide the property type arguments. In these cases, remember that the type argument you need to provide is for the date adapter **_constructor_** (not a date adapter _instance_). In Typescript, you get a constructor type using the `typeof` keyword.

- ```typescript
  // good
  new Schedule<typeof MomentTZDateAdapter>();

  // bad
  new Schedule<MomentTZDateAdapter>();
  ```

Note, when using default date adapters (options 2 or 3, above), type inference is unavailable so you will need to specify object types.

- ```typescript
  RScheduleConfig.defaultDateAdapter = MomentTZDateAdapter;

  // typescript doesn't know that this has type Schedule<typeof MomentTZDateAdapter>
  new Schedule();

  // typescript doesn't know that this has type RRule<typeof MomentTZDateAdapter>
  new RRule();

  // A work around
  new Schedule<typeof MomentTZDateAdapter>();

  new RRule<typeof MomentTZDateAdapter>();
  ```

#### Other Important Tidbits:

`RRule` & `EXRule` objects use the defaultDateAdapter set on `Rule.defaultDateAdapter`. `RDates` & `EXDates` objects use the defaultDateAdapter set on `Dates.defaultDateAdapter`.
Each of these classes extends from the base class without reimplementing the constructor, so they will ignore the `defaultDateAdapter` for their class (i.e. `RRule.defaultDateAdapter` does nothing).

### Existing Date Adapters

- [StandardDateAdapter](./standard-date-adapter)
  - For use with the standard javascript `Date` object. Supports local and UTC timezones.
- [MomentDateAdapter](./moment-date-adapter)
  - For use with moment `Moment` objects. Supports local and UTC timezones.
- [MomentTZDateAdapter](./moment-tz-date-adapter)
  - For use with moment-timezone `Moment` objects. Has full timezone support.
- [LuxonDateAdapter](./luxon-date-adapter)
  - For use with luxon `DateTime` objects. Has full timezone support.

Each DateAdapter has a `generators` property which contains an array if the rSchedule objects which are responsible for creating that particular DateAdapter. For example, when iterating through a `Schedule` containing two `RRule` objects, each yielded DateAdapter will have a `generators` property with a length two array. The first element will be the `RRule` object which generated the date, the second element will be the `Schedule` object which generated the date. At this point, I'll call out the fact that each `IOccurrenceGenerator` object has a `data` property for holding arbitrary data. This allows you to attach data to each rule / schedule, and access that data from the yielded dates.

Example:

```typescript
const schedule = new Schedule({
  dateAdapter: StandardDateAdapter,
  rrules: [
    [
      {
        start: new Date(),
        frequency: 'DAILY',
        byDayOfWeek: ['MO'],
      },
      { data: 'Mondays Rule' },
    ],
    [
      {
        start: new Date(),
        frequency: 'DAILY',
        byDayOfWeek: ['WE'],
      },
      { data: 'Wednesdays Rule' },
    ],
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

Note, if you've build a custom Calendar using occurrence operators: occurrence operators are **not** added to DateAdapter#generators.

## Creating Your Own DateAdapter

This shouldn't be too difficult. Start by looking at either the MomentDateAdapter or MomentTZDateAdapter (depending on if you'll be supporting timezones) in `packages/moment-date-adapter` for an example.

If you choose to do so, `IDateAdapter` related pull requests will be welcomed.

You need to create a new class which extends `DateAdapterBase`, and you need to implement the following in that class:

```typescript
import { DateAdapterBase } from '@rschedule/rschedule';

class MyNewDateAdapter extends DateAdapterBase<TheDateObjectYouAreWrapping> {
  // This static property is only used for type inference purposes.
  // You must include it, but it can be empty (though typed as non-null !).
  static date: TheDateObjectYouAreWrapping;

  static fromTimeObject(args: {
    datetimes: ParsedDatetime[];
    timezone: string | undefined;
  }): MyNewDateAdapter[];

  static isInstance(object?: any): object is MyNewDateAdapter;

  // Holds the date object you're wrapping
  public date: TheDateObjectYouAreWrapping;

  // Note: at the moment, the `args?: {timezone?: string}` optional argument
  // is only used by the StandardDateAdapter. Other date libraries save the timezone
  // state on the date object, makeing the date object the source of truth for the
  // timezone (and they can ignore the timezone optional argument).
  constructor(date?: TheDateObjectYouAreWrapping, args?: { timezone?: string });

  clone(): MyNewDateAdapter;

  get(unit: IDateAdapter.Unit | 'yearday'): number;
  get(unit: 'weekday'): IDateAdapter.Weekday;
  get(unit: 'timezone'): string | undefined;

  set(unit: IDateAdapter.Unit, value: number): this;
  set(unit: 'timezone', value: string | undefined, options?: { keepLocalTime?: boolean }): this;

  valueOf(): number; // the date's ordinal: equivalent to new Date().valueOf()

  assertIsValid(): boolean; // if false, throws `IDateAdapter.InvalidDateError` error
}
```

Some of the types referenced above:

```typescript
type ParsedDatetime =
  // year, month, day, hour, minute, second, millisecond
  | [number, number, number, number, number, number, number]
  | [number, number, number, number, number, number]
  | [number, number, number, number, number]
  | [number, number, number, number]
  | [number, number, number];

namespace IDateAdapter {
  type Unit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

  type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';
}
```

Check out the other DateAdapter implementations, as there potentially utility methods within rSchedule that you can import and repurpose.

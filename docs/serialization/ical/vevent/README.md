# VEvent class

**VEvent extends [OccurrenceGenerator](../../../usage/#occurrencegenerator-interface)**

`VEvent` objects allow iterating a occurrence schedule made up of RRULEs and/or EXRULEs as well as RDATEs and EXDATEs. `VEvent` objects are similar to `Schedule` objects, but `VEvent` objects follow the iCalendar `VEVENT` spec. As part of this support, `VEvent` objects make use of a special variation of `Rule` objects: `RRule` (i.e. `import { RRule } from '@rschedule/ical-tools'`). As with other rSchedule objects, `VEvent` is immutable.

**Important:** If you are _only_ interested in ICAL support, consider using [rrulejs](https://github.com/jakubroztocil/rrule) instead of rSchedule as it currently has greater support for ICAL recurrence rules.

Some rSchedule limitations:

- Not all iCal rules are currently supported.
  - `BYWEEKNO`, `BYYEARDAY`, `BYSETPOS` are unsupported
- Not all VEVENT properies of the ICAL spec are supported. The supported properties are `RRULE`, `EXRULE`, `RDATE`, `EXDATE`, `DTSTART`, `DTEND` and `DURATION`. Other properties are not supported.

Example usage:

```typescript
const vEvent = new VEvent({
  start: new Date(2012, 5, 24),
  rrules: [
    {
      frequency: 'WEEKLY',
      end: new Date(2012, 11, 31),
    },
  ],
  data: 'Holds anything I want',
});

vEvent
  .occurrences({ take: 10 })
  .toArray()
  .map(date => date.toISOString());
```

### Constructor

`VEvent` has the following constructor.

```typescript
class VEvent<D = any> {
  data!: D;
  readonly start: DateAdapter;
  readonly isInfinite: boolean;
  readonly duration?: number | DateAdapter;
  readonly hasDuration: boolean;
  readonly maxDuration?: number;
  readonly timezone: string | null;

  readonly rrules: ReadonlyArray<RRule> = [];
  readonly exrules: ReadonlyArray<RRule> = [];
  readonly rdates: Dates<T>;
  readonly exdates: Dates<T>;

  constructor(args: {
    start: DateInput;
    // accepts either the number of milliseconds of the duration or the end
    // datetime of the first occurrence (which will be used to calculate the
    // duration in milliseconds)
    duration?: number | DateInput;
    // The data property holds arbitrary data associated with the `VEvent`.
    // The data property is mutable.
    //
    // When iterating through a VEvent, you can access a list of the generator objects (i.e. Rules / Dates)
    // which generated any yielded date by accessing the `DateAdapter#generators` property.
    // In this way, for a given, yielded date, you can access the objects which generated
    // the date as well as the arbitrary data associated with those objects.
    // The data property is ignored when serializing to iCal.
    data?: D;
    rrules?: ReadonlyArray<IVEventRuleOptions | RRule>;
    exrules?: ReadonlyArray<IVEventRuleOptions | RRule>;
    rdates?: ReadonlyArray<DateInput> | Dates;
    exdates?: ReadonlyArray<DateInput> | Dates;
    maxDuration?: number;
  });

  add(prop: 'rrule' | 'exrule', value: RRule): VEvent<D>;
  add(prop: 'rdate' | 'exdate', value: DateInput): VEvent<D>;

  remove(prop: 'rrule' | 'exrule', value: RRule): VEvent<D>;
  remove(prop: 'rdate' | 'exdate', value: DateInput): VEvent<D>;

  set(prop: 'timezone', value: string | null, options?: { keepLocalTime?: boolean }): VEvent<D>;
  set(prop: 'start', value: DateInput): VEvent<D>;
  set(prop: 'rrules' | 'exrules', value: RRule[]): VEvent<D>;
  set(prop: 'rdates' | 'exdates', value: Dates<unknown>): VEvent<D>;
}
```

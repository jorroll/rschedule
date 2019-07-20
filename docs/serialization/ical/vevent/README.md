# VEvent class

**VEvent implements [IOccurrenceGenerator](../../../usage/#ioccurrencegenerator-interface), IScheduleLike;**

`VEvent` objects allow iterating a occurrence schedule made up of an RRULE and/or EXRULE as well as RDATEs and EXDATEs. Each `VEvent` object follows the iCalendar `VEVENT` spec. As such, duplicate occurrences are filtered out. As with other rSchedule objects, `VEvent` is immutable.

Some limitations:

- Not all iCal rules are currently supported. See the [`Rule` object section](../../../usage/rule) for more info.
- Not all VEVENT properies of the ICAL spec are supported. The supported properties are `RRULE`, `EXRULE`, `RDATE`, `EXDATE`, `DTSTART`, `DTEND` and `DURATION`. Other properties are not supported.

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

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
class VEvent<T extends typeof DateAdapter, D = any> {
  static isVEvent(object: unknown): object is VEvent<any>;

  data!: D;
  readonly start: InstanceType<T>;
  readonly isInfinite: boolean;
  readonly duration?: number | InstanceType<T>;
  readonly hasDuration: boolean;
  readonly maxDuration?: number;
  readonly timezone: string | null;

  readonly rrules: ReadonlyArray<Rule<T>> = [];
  readonly exrules: ReadonlyArray<Rule<T>> = [];
  readonly rdates: Dates<T>;
  readonly exdates: Dates<T>;

  constructor(args: {
    start: DateInput<T>;
    // accepts either the number of milliseconds of the duration or the end
    // datetime of the first occurrence (which will be used to calculate the
    // duration in milliseconds)
    duration?: number | DateInput<T>;
    dateAdapter?: T;
    // The data property holds arbitrary data associated with the `VEvent`.
    // The data property is also the one exception to rSchedule's immutability:
    // the data property is mutable.
    //
    // When iterating through a VEvent, you can access a list of the generator objects (i.e. Rules / Dates)
    // which generated any yielded date by accessing the `IDateAdapter#generators` property.
    // In this way, for a given, yielded date, you can access the objects which generated
    // the date as well as the arbitrary data associated with those objects.
    // The data property is ignored when serializing to iCal.
    data?: D;
    rrules?: ReadonlyArray<IVEventRuleOptions<T> | Rule<T>>;
    exrules?: ReadonlyArray<IVEventRuleOptions<T> | Rule<T>>;
    rdates?: ReadonlyArray<DateInput<T>> | Dates<T>;
    exdates?: ReadonlyArray<DateInput<T>> | Dates<T>;
  });

  add(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): VEvent<T, D>;
  add(prop: 'rdate' | 'exdate', value: DateInput<T>): VEvent<T, D>;

  remove(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): VEvent<T, D>;
  remove(prop: 'rdate' | 'exdate', value: DateInput<T>): VEvent<T, D>;

  set(prop: 'timezone', value: string | null, options?: { keepLocalTime?: boolean }): VEvent<T, D>;
  set(prop: 'start', value: DateInput<T>): VEvent<T, D>;
  set(prop: 'rrules' | 'exrules', value: Rule<T, unknown>[]): VEvent<T, D>;
  set(prop: 'rdates' | 'exdates', value: Dates<T, unknown>): VEvent<T, D>;
}
```

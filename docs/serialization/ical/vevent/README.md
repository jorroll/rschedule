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
}
```

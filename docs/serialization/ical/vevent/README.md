_implements [IOccurrenceGenerator](../../../usage/#IOccurrenceGenerator-Interface)_

`VEvent` objects allow iterating a occurrence schedule made up of an RRULE and/or EXRULE as well as RDATEs and EXDATEs. Each `VEvent` object follows the iCalendar `VEVENT` spec. As such, duplicate occurrences are filtered out.

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter

const vEvent = new VEvent({
  start: new Date(2012, 5, 24),
  rrule: {
    frequency: 'WEEKLY',
    end: new Date(2012, 11, 31)
  },
  data: 'Holds anything I want',
})

vEvent.occurrences({take: 10}).toArray().map(date => date.toISOString())
```

Not all iCal rules are currently supported. See the [`Rule` object section](../../../usage/rule) for more info.

### Constructor

`VEvent` has the following constructor.

```typescript
class VEvent<T extends typeof DateAdapter, D = any> {
  constructor(args: {
    start: DateInput<T>;
    dateAdapter?: T;
    // The data property holds arbitrary data associated with the `VEvent`.
    // When iterating through an occurrence generator, you can access a list of the objects
    // which generated any given date by accessing the `IDateAdapter#generators` property.
    // In this way, for a given, generated date, you can access the object which generated
    // the date as well as the arbitrary data associated with that object.
    data?: D;
    rrule?: IVEventRuleOptions<T>;
    exrule?: IVEventRuleOptions<T>;
    rdates?: DateInput<T>[];
    exdates?: DateInput<T>[];
  });
}
```

# Calendar class

[**`Calendar implements IOccurrenceGenerator`**](../#ioccurrencegenerator-interface)

While [`Schedule`](../schedule) objects are intended to represent the schedule of a single event, `Calendar` objects are intended to represent a group (calendar) of events. `Calendar` objects support iterating through _the union_ of a group of [`IOccurrenceGenerator`](../#ioccurrencegenerator-interface) objects. As with other rSchedule objects, `Calendar` is immutable.

Unlike `Schedule` or `Rule` objects, Calendar objects allow multiple occurrences happening at the same time (each associated with a different occurrence generator). Because `Calendar` objects are constructed from objects which implement the [`IOccurrenceGenerator` interface](../#shared-interfaces), you can construct calendars out of other `Calendars`, out of `Schedules`, `Rules`, etc.

Example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const calendar = new Calendar({
  schedules: [new Schedule(), new Calendar()],
  data: 'Holds anything I want',
});

// See the `IOccurrenceGenerator` interface for info on `IOccurrenceGenerator#collections()`
for (const collection of calendar.collections({ grandularity: 'MONTHLY' })) {
  for (const date of collection.dates) {
    const calendar = date.generators[0]; // see `IDateAdapter#generators`

    const data = calendar.data; // see data property description, below.

    if (data === 'Holds anything I want') return true;

    // do stuff
  }
}
```

### Constructor

`Calendar` has the following constructor.

```typescript
class Calendar<T extends typeof DateAdapter, D = any> {
  constructor(args: {
    schedules?: IOccurrenceGenerator<T>[] | IOccurrenceGenerator<T>;
    // The data property holds arbitrary data associated with the `Calendar`.
    // The data property is also the one exception to rSchedule's immutability:
    // the data property is mutable.
    //
    // When iterating through a Calendar, you can access a list of the generator objects
    // (i.e. Schedules, Rules, Dates, etc) which generated any yielded date by accessing
    // the `IDateAdapter#generators` property. In this way, for a given, yielded date,
    // you can access the objects which generated the date as well as the arbitrary data
    // associated with those objects.
    data?: D;
    dateAdapter?: T;
    timezone?: string | null;
  });
}
```

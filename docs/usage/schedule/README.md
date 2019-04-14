_implements [IOccurrenceGenerator](../#IOccurrenceGenerator-Interface)_

`Schedule` objects allow iterating a occurrence schedule made up of RRULE, EXRULE, RDATE, and EXDATE components. Each `Schedule` object is intended to contain all the recurrence information to iterate through a single event, while following an API inspired by the ICAL spec. As such, duplicate occurrences are filtered out.

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter

const schedule = new Schedule({
  rrules: [
    {
      frequency: 'WEEKLY',
      start: new Date(2012, 5, 24),
      end: new Date(2012, 11, 31)
    },
    {
      frequency: 'DAILY',
      start: new Date(2011, 9, 2)
    }
  ],
  data: 'Holds anything I want',
})

schedule.occurrences({take: 10}).toArray()!.map(date => date.toISOString())

const scheduleIterator = schedule.occurrences({end: new Date()})

scheduleIterator.next().value // date

const occurrences = [];

for (const occurrence of scheduleIterator) {
  if (occurrence.date.getMonth() > new Date().getMonth()) {
    occurrences.push(occurrence)
  }
}

if (schedule.occursOn({date: new Date(2013,5,17)})) {
  // do stuff
}
else if (schedule.occursOn({weekday: 'MO'})) {
  // do other stuff
}
else if (schedule.occursBefore(new Date(2012,2,12)))) {
  // do different stuff
}
```

### Constructor

`Schedule` has the following constructor.

```typescript
class Schedule<T extends typeof DateAdapter, D = any> {
  constructor(args: {
    dateAdapter?: T;
    timezone?: string | null;
    // The data property holds arbitrary data associated with the `Schedule`.
    // When iterating through an occurrence generator, you can access a list of the objects
    // which generated any given date by accessing the `IDateAdapter#generators` property.
    // In this way, for a given, generated date, you can access the object which generated
    // the date as well as the arbitrary data associated with that object.
    data?: D;
    rrules?: Array<IProvidedRuleOptions<T> | Rule<T>>;
    exrules?: Array<IProvidedRuleOptions<T> | Rule<T>>;
    rdates?: Array<DateInput<T>> | Dates<T>;
    exdates?: Array<DateInput<T>> | Dates<T>;
  });
}
```

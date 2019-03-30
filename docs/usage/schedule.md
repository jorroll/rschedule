_implements [IHasOccurrences](./README.md#shared-interfaces)_

Schedule objects allow iterating a occurrence schedule made up of RRULE, EXRULE, RDATE, and EXDATE components. Each `Schedule` object is intended to contain all the recurrence information to iterate through a single event of arbitrary complexity, while following an API inspired by the ICAL spec. As such, duplicate occurrences are filtered out.

Schedule objects can be serialized to/from ICAL format using `Schedule.fromICal()` and `Schedule#toICal()`. More info in the [ICal Serialization section](../serialization/ical.md).

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter

const schedule = new Schedule({
  rrules: [
    {
      frequency: 'WEEKLY',
      start: new Date(2012, 5, 24),
      until: new Date(2012, 11, 31)
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

`Schedule` has the following constructor, where `DateProp<T>` is the date object a date adaptor wraps (e.g. `Date`) and `DateAdapter<T>` is a date adapter instance.

```typescript
class Schedule {
  constructor(args: {
    dateAdapter?: T;
    data?: D;
    rrules?: (ScheduleRuleArgs<T> | Options.ProvidedOptions<T> | RRule<T>)[];
    exrules?: (ScheduleRuleArgs<T> | Options.ProvidedOptions<T> | EXRule<T>)[];
    rdates?: (DateProp<T> | DateAdapter<T>)[] | RDates<T>;
    exdates?: (DateProp<T> | DateAdapter<T>)[] | EXDates<T>;
  });
}
```

For both rrules and exrules, you can provide an array containing a mix of the following

1. Already constructed Rule objects
2. Options to create a new rule
3. An array, the first element of which is options to create a new rule, the second element of which is the optional argument of the Rule constructor (e.g. `{data: any}`).

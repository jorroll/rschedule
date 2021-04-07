# Schedule class

**Schedule extends [OccurrenceGenerator](../#occurrencegenerator-interface);**

`Schedule` objects allow iterating an occurrence schedule made up of RRULE, EXRULE, RDATE, and EXDATE components. Each `Schedule` object is intended to contain all the recurrence information to iterate through a single event, while following an API inspired by the ICAL spec. As such, duplicate occurrences are filtered out. As with other rSchedule objects, `Schedule` is immutable.

Example usage:

```typescript
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

for (const { date } of scheduleIterator) {
  if (date.getMonth() > new Date().getMonth()) {
    occurrences.push(date)
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

There is also an optional `@rschedule/rule-tools` library which contains utility functions for manipulating rSchedule `Rule` and `Schedule` objects and working with common recurrence rule patterns. Even if you don't use it, it can provide a useful example of how to manipulate and build up rSchedule objects. [See the `rule-tools` docs for more information.](../rule-tools)

### Constructor

`Schedule` has the following constructor.

```typescript
class Schedule<D = any> {
  data: D;
  readonly rrules: ReadonlyArray<Rule>;
  readonly exrules: ReadonlyArray<Rule>;
  readonly rdates: Dates;
  readonly exdates: Dates;
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  readonly maxDuration: number;

  constructor(args: {
    // The timezone that yielded occurrences should be *displayed* in. Note,
    // this one affects the *displayed* timezone of yielded occurrences.
    // For rules, occurrences are first found using the unmodified rule
    // config (including whatever timezone the `start` datetime is defined
    // in), and then converted to the timezone specified here before being
    // yielded. By default, the timezone is *local* time (`null`). So if you don't
    // want your rules to be displayed in local time, you must supply a
    // timezone argument.
    timezone?: string | null;
    rrules?: ReadonlyArray<IRuleOptions | Rule>;
    exrules?: ReadonlyArray<IRuleOptions | Rule>;
    rdates?: ReadonlyArray<DateInput> | Dates;
    exdates?: ReadonlyArray<DateInput> | Dates;
    maxDuration?: number; // see the OccurrenceGenerator interface for info

    // The data property holds arbitrary data associated with the `Schedule`.
    // The data property is also the one exception to rSchedule's immutability:
    // the data property is mutable.
    //
    // When iterating through a Schedule, you can access a list of the generator objects (i.e. Rules / Dates)
    // which generated any yielded date by accessing the `DateAdapter#generators` property.
    // In this way, for a given, yielded date, you can access the objects which generated
    // the date as well as the arbitrary data associated with those objects.
    data?: D;
  });

  add(prop: 'rrule' | 'exrule', value: Rule): Schedule<D>;
  add(prop: 'rdate' | 'exdate', value: DateInput): Schedule<D>;

  remove(prop: 'rrule' | 'exrule', value: Rule): Schedule<D>;
  remove(prop: 'rdate' | 'exdate', value: DateInput): Schedule<D>;

  set(prop: 'timezone', value: string | null, options?: { keepLocalTime?: boolean }): Schedule<D>;
  set(prop: 'rrules' | 'exrules', value: Rule[]): Schedule<D>;
  set(prop: 'rdates' | 'exdates', value: Dates): Schedule<D>;
}
```

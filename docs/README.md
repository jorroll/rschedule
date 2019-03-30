# rSchedule

**Still pre-1.0 release**

A javascript library, written in typescript, for working with recurring dates. Rules can be imported / exported in [ICAL](https://tools.ietf.org/html/rfc5545) spec format, and Rule objects themselves adhere to the javascript iterator protocol.

At this point, the library's core functionality is feature complete and _fairly_ stable, though I'm still tweaking it in places ahead of a 1.0 release as I dog food it in my own app. If you're looking for something more mature, check out [rrulejs](https://github.com/jakubroztocil/rrule).

Example usage:

```typescript
const rule = new RRule(
  {
    frequency: 'YEARLY',
    byMonthOfYear: [2, 6],
    byDayOfWeek: ['SU', ['MO', 3]],
    start: new Date(2010, 1, 7),
  },
  {
    dateAdapter: StandardDateAdapter,
  },
);

let index = 0;
for (const date of rule.occurrences()) {
  date.toISOString();
  index++;

  if (index > 10) break;
}

rule
  .occurrences({
    start: new Date(2010, 5, 7),
    take: 5,
  })
  .toArray()
  .map(date => date.toISOString());
```

rSchedule makes use of a fairly simple [`IDateAdapter`](./date-adapter) wrapper object which abstracts away from individual date library implementations, making this package date library agnostic.

[`StandardDateAdapter`](./date-adapter/standard-date-adapter), [`LuxonDateAdapter`](./date-adapter/luxon-date-adapter), [`MomentDateAdapter`](./date-adapter/moment-date-adapter), and [`MomentTZDateAdapter`](./date-adapter/moment-tz-date-adapter) packages currently exists which provide a [`IDateAdapter`](./date-adapter) complient wrapper for a variety of date libraries (and the standard javascript `Date` object). Additionally, it should be pretty easy for you to create your own `DateAdapter` for your preferred library. See the [DateAdapter section](./date-adapter) for more info.

The `MomentTZDateAdapter` and `LuxonDateAdapter` support different timezones. All `DateAdapter` packages support `local` and `UTC` timezones. As noted above, installing a specific `DateAdapter` package is a seperate step, so, if you wanted to use rSchedule with standard javascript `Date` objects, you might install with

### Installation

```bash
# To install both the main package and the `StandardDateAdapter` for standard javascript dates */

yarn add @rschedule/rschedule @rschedule/standard-date-adapter

# or

npm install @rschedule/rschedule @rschedule/standard-date-adapter

# Current DateAdapter packages

@rschedule/standard-date-adapter
@rschedule/moment-date-adapter
@rschedule/moment-tz-date-adapter
@rschedule/luxon-date-adapter
```

## Brief Overview

While [`RRule` objects](./usage/rule) contain the main recurrence logic, you probably won't use them directly. Instead, the friendly [`Schedule` object](./usage/schedule) exist which builds an occurrence schedule based off of an arbirary number of RRules, EXRules, RDates, and EXDates.

Example usage:

```typescript
const schedule = new Schedule({
  dateAdapter: StandardDateAdapter,
  rrules: [
    {
      frequency: 'YEARLY',
      byMonthOfYear: [2, 6],
      byDayOfWeek: ['SU', ['MO', 3]],
      start: new Date(2010, 1, 7),
    },
    {
      frequency: 'DAILY',
      byDayOfWeek: ['TU'],
      start: new Date(2012, 1, 7),
    },
  ],
});

schedule.occurrences().toArray();
```

Each `Schedule` object is intended to contain all the recurrence information to iterate through a single event of arbitrary complexity, while following an API inspired by the ICAL spec. As such, duplicate occurrences are filtered out.

To iterate over a collection of Schedule objects, e.g. for displaying on a calendar, you can use the [`Calendar` object](./usage/calendar). The Calendar object combines a collection of occurrence streams into a single iterable object (i.e. it displays the `union` of all the given occurrence streams).

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdatper;

const scheduleOne = new Schedule();
const scheduleTwo = new Schedule();

const calendar = new Calendar({
  schedules: [scheduleOne, scheduleTwo],
});

for (const occurrence of calendar.occurrences({ start: new Date() })) {
  // do stuff
}
```

Additionally, for iterating over an arbitrary collection of dates, you can make use of the [`Dates` object](./usage/dates) (or its subclasses `RDates` and `EXDates`, which are used by `Schedule`).

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdatper;

const dates = new Dates({
  dates: [new Date(2000), new Date(2001), new Date(2002)],
});

for (const date of dates.occurrences({ start: new Date(2000, 5) })) {
  // do stuff
}
```

For more complex scenerios, rSchedule offers a set of [occurrence stream operator](./usage/operators) functions which allow combining and manipulating a stream of occurrences. Usage is inspired the rxjs pipe operators.

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdatper;

const scheduleOne = new Schedule();
const scheduleTwo = new Schedule();
const scheduleThree = new Schedule();
const scheduleFour = new Schedule();

new Calendar({
  schedule: occurrenceStream(
    add(scheduleOne),
    subtract(scheduleTwo),
    add(scheduleThree),
    subtract(scheduleFour),
    unique(),
  ),
});
```

## [Usage Overview](./usage)

See [Usage Overview](./usage) for more info.

## Other javascript recurring date libraries I'm aware of

- [rrulejs](https://github.com/jakubroztocil/rrule)
  - Supports time zones via luxon and supports iCal. This library is older and more mature than rSchedule and I used it before making rSchedule. For most projects, rrulejs will probably do everything you need and you may feel more comfortable using something older and with a larger install base. Other than rSchedule's date adapter support, it's [ical serialization](./serialization/ical) and [occurrence stream operators](./usage/operators) are probably the main reasons why you'd choose rSchedule over rrulejs (I also think rSchedule has a nicer API, but, if everything else was equal, rrulejs's maturity would probably beat out rSchedule's API improvements).
- [laterjs](https://github.com/bunkat/later) (currently unmaintained)
  - Simpler API. Not ICAL compatible, but has support for chron jobs.
- [dayspan](https://github.com/ClickerMonkey/dayspan)
  - Appears to be a pretty full featured recurring dates library (like rSchedule or rrulejs), but I don't know much about it. Interestingly, while rrulejs and rSchedule have somewhat similar APIs (borrowing heavily from the ICAL spec), dayspan's API seems to be very different and somewhat unique in places.

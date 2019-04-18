# rSchedule

## Version 0.11 Docs

A javascript library, written in typescript, for working with recurring dates. Rules can be imported / exported in [ICAL](https://tools.ietf.org/html/rfc5545) spec format, and Rule objects themselves adhere to the javascript iterator protocol.

At this point, the library's core functionality is feature complete and the tests are passing. This being said, I'm still adjusting the library ahead of a 1.0 release as I dog food it in my own app. If you're looking for something more mature, check out [rrulejs](https://github.com/jakubroztocil/rrule).

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

rSchedule makes use of a fairly simple [`IDateAdapter`](./date-adapter) wrapper object which abstracts away from individual date library implementations, making this package date library agnostic.

[`StandardDateAdapter`](./date-adapter/standard-date-adapter), [`LuxonDateAdapter`](./date-adapter/luxon-date-adapter), [`MomentDateAdapter`](./date-adapter/moment-date-adapter), and [`MomentTZDateAdapter`](./date-adapter/moment-tz-date-adapter) packages currently exists which provide an [`IDateAdapter`](./date-adapter) complient wrapper for a variety of date libraries (and the standard javascript `Date` object). If your chosen date adapter supports time zones, rSchedule supports time zones. Additionally, it should be pretty easy for you to create your own DateAdapter for your preferred library. See the [DateAdapter section](./date-adapter) for more info.

If you plan to use rSchedule with iCalendar support, you'll need to add the optional [`@rschedule/ical-tools`](./serialization/ical) package. In addition to `serializeToICal()` and `parseICal()` functions, the ical-tools package contains a [`VEvent` object](./serialization/ical/vevent) which adhears to the [iCalendar `VEVENT` component specifications](https://tools.ietf.org/html/rfc5545#section-3.6.1). Jump to the [`ical serialization`](./serialization/ical) section to learn more.

If you don't need iCalendar support, you can serialize your objects using the optional [`@rschedule/json-tools` package](./serialization/json) (which is much smaller than `@rschedule/ical-tools`).

If you're not serializing to iCalendar, your primary tool will be the friendly [`Schedule` object](./usage/schedule) (which is not iCal spec complient--its better). It can be used to build an occurrence schedule from an arbitrary number of inclusion rules, exclusion rules, inclusion dates, and exclusion dates.

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const schedule = new Schedule({
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
  exdates: [new Date(2010, 3, 2)],
});

schedule.occurrences().toArray();
```

Each [`Schedule` object](./usage/schedule) is intended to contain all the recurrence information to iterate through a single event, while following an API inspired by the ICAL spec. As such, duplicate occurrences are filtered out.

To iterate over a collection of schedules, e.g. for displaying on a calendar, you can use the [`Calendar` object](./usage/calendar). The Calendar object combines a collection of occurrence generators into a single iterable object (i.e. it displays the `union` of all the given occurrence generators).

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

Additionally, the [`Dates` object](./usage/dates) provides an `OccurrenceGenerator` wrapper over a collection of arbitrary dates.

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdatper;

const dates = new Dates({
  dates: [new Date(2000), new Date(2001), new Date(2002)],
});

dates.occursOn({ date: new Date(2000) }); // true

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

new Calendar().pipe(
  add(scheduleOne),
  subtract(scheduleTwo),
  add(scheduleThree),
  subtract(scheduleFour),
  unique(),
);
```

Internally, some rSchedule objects rely on occurrence stream operators to handle their recurrence logic (e.g. `Schedule`).

Finally, there are [`Rule` objects](./usage/rule) which process recurrence rules. You probably won't need to use `Rule` object's direction though, instead using making use of `Schedule` objects.

## [Usage Overview](./usage)

See [Usage Overview](./usage) for more info.

## Other javascript recurring date libraries I'm aware of

- [rrulejs](https://github.com/jakubroztocil/rrule)
  - Supports time zones via luxon and supports iCal. This library is older and more mature than rSchedule and I used it before making rSchedule. For most projects, rrulejs will probably do everything you need and you may feel more comfortable using something older and with a larger install base. Other than rSchedule's [date adapter support](./date-adapter), it's [ical serialization](./serialization/ical) and [occurrence stream operators](./usage/operators) are probably the main reasons why you'd choose rSchedule over rrulejs (I also think rSchedule has a nicer API, but, if everything else was equal, rrulejs's maturity would probably beat out rSchedule's API improvements). Also, rrule has some natural language processing functionality which rSchedule does not have.
- [laterjs](https://github.com/bunkat/later) (currently unmaintained)
  - Simpler API. Not ICAL compatible, but has support for chron jobs.
- [dayspan](https://github.com/ClickerMonkey/dayspan)
  - Appears to be a pretty full featured recurring dates library (like rSchedule or rrulejs), but I don't know much about it. Interestingly, while rrulejs and rSchedule have somewhat similar APIs (borrowing heavily from the ICAL spec), dayspan's API seems to be very different and somewhat unique in places.

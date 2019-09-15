# rSchedule

## Version 0.12 Docs

A javascript library, written in typescript, for working with recurring dates. The library is "date agnostic" and usable with `Date`, [Moment](https://momentjs.com), [luxon](https://moment.github.io/luxon/), or [js-joda](https://github.com/js-joda/js-joda) objects. Timezone support is dependent on the date library you are using. All objects in rSchedule are immutable. rSchedule supports creating schedules with durations. rSchedule is modular, tree-shakable, and extensible. It supports JSON and [ICAL](https://tools.ietf.org/html/rfc5545) serialization as well as custom recurrence rules.

### Installation

```bash
# To install both the main package and the `StandardDateAdapter` for standard javascript dates */

yarn add @rschedule/core @rschedule/standard-date-adapter

# or

npm install @rschedule/core @rschedule/standard-date-adapter

# Current DateAdapter packages

@rschedule/standard-date-adapter
@rschedule/moment-date-adapter
@rschedule/moment-tz-date-adapter
@rschedule/luxon-date-adapter
@rschedule/joda-date-adapter
```

## Brief Intro

rSchedule makes use of a [`DateAdapter`](./date-adapter) wrapper object which abstracts away from individual date library implementations, making this package date library agnostic.

[`StandardDateAdapter`](./date-adapter/standard-date-adapter), [`LuxonDateAdapter`](./date-adapter/luxon-date-adapter), [`MomentDateAdapter`](./date-adapter/moment-date-adapter), [`MomentTZDateAdapter`](./date-adapter/moment-tz-date-adapter), and [`JodaDateAdapter`](./date-adapter/joda-date-adapter) packages currently exists which provide support for a variety of date libraries (and the standard javascript `Date` object). If your chosen date adapter supports time zones, rSchedule supports time zones. Additionally, it should be fairly easy for you to create your own DateAdapter for your preferred library. See the [DateAdapter section](./date-adapter) for more info.

If you plan to use rSchedule with iCalendar support, you'll need to add the optional [`@rschedule/ical-tools`](./serialization/ical) package. In addition to `serializeToICal()` and `parseICal()` functions, the ical-tools package contains a [`VEvent` object](./serialization/ical/vevent) which adhears to the [iCalendar `VEVENT` component specifications](https://tools.ietf.org/html/rfc5545#section-3.6.1). Jump to the [`ical serialization`](./serialization/ical) section to learn more.

- Note: if you simply want ICAL support, you should consider using the [rrulejs](https://github.com/jakubroztocil/rrule) package instead as it currently supports a greater range of the iCal spec.

If you don't need iCalendar support, you can serialize your objects using the optional [`@rschedule/json-tools` package](./serialization/json). The json-tools package is much smaller than the ical-tools package, and supports a greater range of rSchedule's functionality.

## [Usage Overview](./usage)

See [Usage Overview](./usage) for more info.

## Other javascript recurring date libraries I'm aware of

- [rrulejs](https://github.com/jakubroztocil/rrule)
  - Supports time zones via luxon and supports iCal. `rrulejs` is older and more mature than rSchedule and I used it before making rSchedule.
  - For most projects, rrulejs will probably do everything you need and you may feel more comfortable using something older and with a larger install base. Another reason you might want to choose rrule would be for it's NLP, internationalization support, or support for `BYWEEKNO`, `BYYEARDAY`, and `BYSETPOS` ICal rules. By comparison, rSchedule has better timezone support, support for different date libraries, duration support, custom rule support, a smaller minimum bundle size, and complex calendar support. See the docs of both projects to learn more.
- [laterjs](https://github.com/bunkat/later) (currently unmaintained)
  - Simpler API. Not ICAL compatible. Has support for chron jobs.
- [dayspan](https://github.com/ClickerMonkey/dayspan)
  - Appears to be a pretty full featured recurring dates library (like rSchedule or rrulejs), but I don't know much about it. Interestingly, while rrulejs and rSchedule have somewhat similar APIs (borrowing heavily from the ICAL spec), dayspan's API seems to be very different and somewhat unique in places.

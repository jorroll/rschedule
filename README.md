# rSchedule

[![NPM version](https://flat.badgen.net/npm/v/@rschedule/core)](https://www.npmjs.com/package/@rschedule/core) [![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/core)](https://bundlephobia.com/result?p=@rschedule/core) [![Actively maintained](https://flat.badgen.net/badge/Maintenance%20level/Actively%20Maintained/green)](https://gist.github.com/cheerfulstoic/d107229326a01ff0f333a1d3476e068d)

### [View docs](#docs)

A javascript library, written in typescript, for working with recurring dates. The library is "date agnostic" and usable with `Date`, [Moment](https://momentjs.com), [luxon](https://moment.github.io/luxon/), [dayjs](https://day.js.org/), or [js-joda](https://github.com/js-joda/js-joda) objects. If your chosen date library supports time zones, rSchedule supports time zones. All objects in rSchedule are immutable. rSchedule supports creating schedules with durations. rSchedule is modular, tree-shakable, and extensible. It supports JSON and [ICAL](https://tools.ietf.org/html/rfc5545) serialization as well as custom recurrence rules.

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
@rschedule/dayjs-date-adapter
@rschedule/joda-date-adapter
```

[See the docs for setup instructions](#docs)

### Usage ([online demo](https://codesandbox.io/s/rschedule-starter-pxezu?fontsize=14&module=/src/index.ts))

You can play around with a demo of rSchedule on [codesandbox here](https://codesandbox.io/s/rschedule-starter-pxezu?fontsize=14&module=/src/index.ts).

#### Iterate using standard javascript syntax

```typescript
// showing usage with the StandardDateAdapter

const rule = new Rule({
  frequency: 'YEARLY',
  byMonthOfYear: [2, 6],
  byDayOfWeek: ['SU', ['MO', 3]],
  start: new Date(2010, 1, 7),
});

for (const { date } of rule.occurrences({ take: 10 })) {
  date.toISOString();

  // do stuff...
}
```

#### Get the first 5 occurrences after a starting date

```typescript
rule
  .occurrences({
    start: new Date(2010, 5, 7),
    take: 5,
  })
  .toArray()
  .map(date => date.toISOString());
```

#### Add another rule, subtract specific dates, filter to only return unique dates, and query to see if the result occurs on a Monday before `2013/11/15`.

```typescript
const secondRule = new Rule({
  start: new Date(2011, 1, 7),
  frequency: 'DAILY',
  byDayOfWeek: ['MO'],
});

const dates = new Dates({
  dates: [new Date(2010, 10, 15), new Date(2010, 11, 3)],
});

rule
  .pipe(add(secondRule), subtract(dates), unique())
  .occursOn({ weekday: 'MO', before: new Date(2013, 10, 15) }); // true
```

## Docs

- [Version 1.x docs (current)](https://dynodocs.dev/gitlab/john.carroll.p/rschedule/branch/v1/docs/1.%20Introduction.md)
- [Version 0.12 docs](https://gitlab.com/john.carroll.p/rschedule/tree/v0.12/docs)
- [Version 0.11 docs](https://gitlab.com/john.carroll.p/rschedule/tree/v0.11/docs)
- [Version 0.10 docs](https://gitlab.com/john.carroll.p/rschedule/tree/f46bf244370dd476633b944e424096a6ae629305/docs)
- [Version 0.9 docs](https://gitlab.com/john.carroll.p/rschedule/tree/a80b576c981570710def8f83575a4932b12f8f34/docs)

[Master branch docs (unreleased)](https://dynodocs.dev/gitlab/john.carroll.p/rschedule/branch/master/docs/1.%20Introduction.md)

## Known Limitations

- `@rschedule/ical-tools`
  - No [`BYWEEKNO`](https://gitlab.com/john.carroll.p/rschedule/issues/2), [`BYYEARDAY`](https://gitlab.com/john.carroll.p/rschedule/issues/3), or [`BYSETPOS`](https://gitlab.com/john.carroll.p/rschedule/issues/4) rule support.
  - `VEVENT` supports `RRULE`, `EXRULE`, `RDATE`, `EXDATE`, `DTSTART`, `DTEND` and `DURATION` properties. Other properties are not supported.
  - No `VCALENDAR` iCal support.

## Roadmap

- [x] Explore rearranging library exports and build to better support tree shaking and reduce minimum bundle size.
- [ ] Natural language package for converting rSchedule objects into human readable strings
  - [ ] Internationalization of human readable strings
- [ ] Create `subtractDuration` operator

## Typescript Version

| rSchedule version | Typescript version |
| ----------------- | ------------------ |
| 1.1.3             | 3.5                |
| 1.2.0             | 3.9                |

## About

See the [contributors list](https://gitlab.com/john.carroll.p/rschedule/-/graphs/master) for an up-to-date record of contributions to this repo. The initial version of rSchedule was created by [John Carroll](https://gitlab.com/john.carroll.p). Most of the RRULE tests were taken from the excellent [rrule.js](https://github.com/jakubroztocil/rrule) library (which were, themselves, taken from a python library, I believe).

This library was built using the [typescript starter repo](https://github.com/bitjson/typescript-starter). The implementation strategy drew inspiration from the [Angular Material2](https://github.com/angular/material2) Date Picker component (which makes use of date adapters to support different javascript date libraries), as well as [rrulejs](https://github.com/jakubroztocil/rrule) and [ice_cube](https://github.com/seejohnrun/ice_cube).

_This project is not affiliated with any of these projects._

## Similar libraries

- [rrulejs](https://github.com/jakubroztocil/rrule)
  - Supports time zones via luxon and supports iCal. `rrulejs` is older and more mature than rSchedule and I used it before making rSchedule.
  - For most projects, rrulejs will probably do everything you need and you may feel more comfortable using something older and with a larger install base. Another reason you might want to choose rrule would be for it's NLP, internationalization support, or support for `BYWEEKNO`, `BYYEARDAY`, and `BYSETPOS` ICal rules. By comparison, rSchedule has better timezone support, support for different date libraries, duration support, custom rule support, a smaller minimum bundle size, and complex calendar support. See the docs of both projects to learn more.
- [laterjs](https://github.com/bunkat/later) (currently unmaintained)
  - Simpler API. Not ICAL compatible. Has support for chron jobs.
- [dayspan](https://github.com/ClickerMonkey/dayspan)
  - Appears to be a pretty full featured recurring dates library (like rSchedule or rrulejs), but I don't know much about it. Interestingly, while rrulejs and rSchedule have somewhat similar APIs (borrowing heavily from the ICAL spec), dayspan's API seems to be very different and somewhat unique in places.

# rSchedule

**Still pre-1.0 release**

## _Note: these docs refer to the master branch of the library, rather than a specific release. At the moment, the master branch represents an unreleased overhaul of the library and these docs have NOT been properly updated to reflect these changes yet. Check out the [wiki page](https://gitlab.com/john.carroll.p/rschedule/wikis/home) for docs relating to the current release._

A javascript library, written in typescript, for working with recurring dates. Rules can be imported / exported in [ICAL](https://tools.ietf.org/html/rfc5545) spec format, and Rule objects themselves adhere to the javascript iterator protocol.

At this point, the library's core functionality is feature complete and all the tests are passing (!!). This being said, I'm still adjusting the library ahead of a 1.0 release as I dog food it in my own app. If you're looking for something more mature, check out [rrulejs](https://github.com/jakubroztocil/rrule).

**[See the wiki page for more info.](https://gitlab.com/john.carroll.p/rschedule/wikis/home#installation)**

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const rule = new RRule({
  frequency: 'YEARLY',
  byMonthOfYear: [2, 6],
  byDayOfWeek: ['SU', ['MO', 3]],
  start: new Date(2010, 1, 7),
});

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

rSchedule makes use of a fairly simple [`IDateAdapter`](./docs/date-adapter/README.md) wrapper object which abstracts away from individual date library implementations, making this package date library agnostic.

[`StandardDateAdapter`](./docs/date-adapter/standard-date-adapter.md), [`LuxonDateAdapter`](./docs/date-adapter/luxon-date-adapter.md), [`MomentDateAdapter`](./docs/date-adapter/moment-date-adapter.md), and [`MomentTZDateAdapter`](./docs/date-adapter/moment-tz-date-adapter.md) packages currently exists which provide a [`IDateAdapter`](./docs/date-adapter/README.md) complient wrapper for a variety of date libraries (and the standard javascript `Date` object). If your chosen date adapter supports time zones, rSchedule supports time zones. Additionally, it should be pretty easy for you to create your own `DateAdapter` for your preferred library. See the [DateAdapter section](./docs/date-adapter/README.md) for more info.

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

## [See the wiki for more information](https://gitlab.com/john.carroll.p/rschedule/wikis/home#installation)

### Known Limitations

- No `BYWEEKNO`, `BYYEARDAY`, or `BYSETPOS` rule support. "By day of year" and "by position in set" should both be pretty straightforward to implement (if someone else wants to), they're just not something I need so not on my todo list.
  - "By week of year" is different though. I spent a fair bit trying to get it to work and its just SUPER annoying (because it can create a valid date for year A in year B. e.g. the Saturday of the last week of 1998 _is in the year 1999_). Anyway, obviously doable, I have no plans to implement it though.

### About

The library, itself, has been created from scratch by me, John Carroll. Most of the RRULE tests were taken from the excellent [rrule.js](https://github.com/jakubroztocil/rrule) library (which were, themselves, taken from a python library, I believe).

This library was built using the [typescript starter repo](https://github.com/bitjson/typescript-starter). My implementation strategy has drawn inspiration from the [Angular Material2](https://github.com/angular/material2) Date Picker component (which makes use of date adapters to support different javascript date libraries), as well as [rrulejs](https://github.com/jakubroztocil/rrule) and [ice_cube](https://github.com/seejohnrun/ice_cube).

_This project is not affiliated with any of these projects._

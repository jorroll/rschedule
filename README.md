# rSchedule

***Note: While everything described here has been implemented, this library is still a WIP. I have some plans to overhaul the DateAdapter API, greatly simplifying it, as well as update the internal logic to always iterate over UTC values and convert them to a specific timezone at the last moment. This should (hopefully) eliminate a few outstanding DST bugs in the southern hemisphere, as well as simplify the internal code. Check out the [1.0 roadmap](https://gitlab.com/john.carroll.p/rschedule/issues/5) for more info.***

A javascript library, written in typescript, for working with recurring dates. Rules can be imported / exported in [ICAL](https://tools.ietf.org/html/rfc5545) spec format, and Rule objects themselves adhere to the javascript iterator protocol.

Example usage:

```typescript
const rule = new RRule({
  frequency: 'YEARLY',
  byMonthOfYear: [2, 6],
  byDayOfWeek: ['SU', ['MO', 3]],
  start: new StandardDateAdapter(new Date(2010,1,7))
})

let index = 0;
for (const date of rule.occurrences()) {
  date.toISOString()
  index++
  
  if (index > 10) break;
}

rule.occurrences({
  start: new StandardDateAdapter(new Date(2010,5,7)),
  take: 5
})
  .toArray()
  .map(date => date.toISOString())
```

#### Installation

```bash
# To install both the main package and the `DateAdapter` for standard javascript dates */

yarn add @rschedule/rschedule @rschedule/standard-date-adapter

# or

npm install @rschedule/rschedule @rschedule/standard-date-adapter
```

rSchedule makes use of a fairly simple `DateAdapter` wrapper object which abstracts away from individual date library implementations, making this package date library agnostic.

`StandardDateAdapter`, `LuxonDateAdapter`, `MomentDateAdapter`, and `MomentTZDateAdapter` packages currently exists which provide a `DateAdapter` complient wrapper for the standard javascript `Date` object, as well as [`moment`](https://momentjs.com), [`moment-timezone`](https://momentjs.com), and [luxon `DateTime`](https://moment.github.io/luxon/) objects. Additionally, it should be pretty easy for you to create your own `DateAdapter` for your preferred library. See the [DateAdapter section](https://gitlab.com/john.carroll.p/rschedule/wikis/usage/date-adapter) for more info.

## [See the wiki for more information](https://gitlab.com/john.carroll.p/rschedule/wikis/home#installation)

The wiki page has more information on rSchedule and how to use it.

## Known Issues / Todo

- No `BYWEEKNO`, `BYYEARDAY`, or `BYSETPOS` rule support. "By day of year" and "by position in set" should both be pretty straightforward, they're just not something I need so not on my todo list.
  - "By week of year" is different though. I spent a fair bit trying to get it to work and its just SUPER annoying (because it can create a valid date for year A in year B. e.g. the Saturday of the last week of 1998 *is in the year 1999*). Anyway, obviously doable, I have no plans to implement it though.
- See the [1.0 roadmap](https://gitlab.com/john.carroll.p/rschedule/issues/5) issue.

### About

The library, itself, has been created from scratch by me, John Carroll. Most of the RRULE tests were taken from the excellent [rrule.js](https://github.com/jakubroztocil/rrule) library (which were, themselves, taken from a python library, I believe).

This library was built using the [typescript starter repo](https://github.com/bitjson/typescript-starter). My implementation strategy has drawn inspiration from the [Angular Material2](https://github.com/angular/material2) Date Picker component (which makes use of date adapters to support different javascript date libraries), as well as [rrulejs](https://github.com/jakubroztocil/rrule) and [ice_cube](https://github.com/seejohnrun/ice_cube).

I'd like to give a special shout of thanks for both [rrule.js](https://github.com/jakubroztocil/rrule) and [ice_cube](https://github.com/seejohnrun/ice_cube) (a ruby gem) for their RRULE implementations.

*Note: this project is not affiliated with any other projects.*
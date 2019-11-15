# rSchedule

[![NPM version](https://flat.badgen.net/npm/v/@rschedule/core)](https://www.npmjs.com/package/@rschedule/core) [![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/core)](https://bundlephobia.com/result?p=@rschedule/core)

## Version 1.x Docs

A javascript library, written in typescript, for working with recurring dates. The library is "date agnostic" and usable with `Date`, [Moment](https://momentjs.com), [luxon](https://moment.github.io/luxon/), or [js-joda](https://github.com/js-joda/js-joda) objects. If your chosen date library supports time zones, rSchedule supports time zones. All objects in rSchedule are immutable. rSchedule supports creating schedules with durations. rSchedule is modular, tree-shakable, and extensible. It supports JSON and [ICAL](https://tools.ietf.org/html/rfc5545) serialization as well as custom recurrence rules.

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

### Setup

rSchedule supports multiple date libraries though a [`DateAdapter`](./date-adapter) interface. To get started, you need to import the date adapter for your chosen date library (see the [`DateAdapter`](./date-adapter) section for more information).

Create an `rschedule.ts` (or `rschedule.js`) file in your project which configures rSchedule locally. Instead of importing objects from `@rschedule/core`, you'll import them from this local file.

For example:

```ts
// rschedule.ts

import '@rschedule/moment-date-adapter/setup';
// import '@rschedule/json-tools/setup' <-- optional json support

export * from '@rschedule/moment-date-adapter';
export * from '@rschedule/core';
export * from '@rschedule/core/generators';
// export * from '@rschedule/ical-tools' <-- optional ical support
```

```ts
// other project file

import { Schedule } from './rschedule';

// ... do stuff
```

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

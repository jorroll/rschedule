# @rschedule/ical-tools

[![NPM version](https://flat.badgen.net/npm/v/@rschedule/ical-tools)](https://www.npmjs.com/package/@rschedule/ical-tools) [![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/ical-tools)](https://bundlephobia.com/result?p=@rschedule/ical-tools)

The optional package `@rschedule/ical-tools` includes a new `VEvent` object for working with [iCalendar `VEVENT` components](https://tools.ietf.org/html/rfc5545#section-3.6.1), as well as `serializeToICal()` and `parseICal()` functions.

**Important:** If you are _only_ interested in ICAL support, consider using [rrulejs](https://github.com/jakubroztocil/rrule) instead of rSchedule as it currently has greater support for ICAL recurrence rules.

Some limitations:

- Parsing / serializing `VCALENDAR` components is not currently supported.
- You can _only_ parse / serialize `VEvent` objects.
- `VEvent#data` is ignored.

Example:

```typescript
const vEvent = new VEvent({
  start: new Date(),
});

const iCal = serializeToICal(vEvent); // => string

parseICal(iCal); // => { vEvents: [vEvent], iCal: iCal, jCal: [...] }
```

## Installation

`@rschedule/ical-tools` has a peer dependency on `ical.js`

```bash
yarn add @rschedule/ical-tools ical.js

# or

npm install @rschedule/ical-tools ical.js
```

## Usage

When serializing to / from the [iCalendar spec](https://tools.ietf.org/html/rfc5545), you must use the `VEvent` object. This is because

1. `serializeToICal()` expects `VEvent` objects.
2. `parseICal()` returns `VEvent` objects.
3. Unlike `Schedule` objects, the `VEvent` object actually adhears to the specifics of the [iCalendar `VEVENT` spec](https://tools.ietf.org/html/rfc5545#section-3.6.1) (e.g. dtstart time is the first occurrence, etc).

See the [`VEvent` object section](./vevent) for more info on the `VEvent` object.

### `serializeToICal()`

The `serializeToICal()` function accepts a `VEvent` object and returns an iCalendar strings representing that object.

Example:

```typescript
const vEvent = new VEvent({
  start: new Date(),
});

const iCal = serializeToICal(vEvent); // => string
```

### `parseICal()`

The `parseICal()` function accepts an iCal string and returns a `IParsedICalString` object.

Example:

```typescript
const iCal = // ... ical string

const result = parseICal(iCal);

result.vEvents // => VEvent[];
result.iCal // => string;
result.jCal // => jCal object
```

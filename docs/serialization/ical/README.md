The optional package `@rschedule/ical-tools` includes a new `VEvent` object for working with iCalendar `VEVENT` components, as well as `serializeToICal()` and `parseICal()` functions. At this time, parsing / serializing `VCALENDAR` components is not supported.

Example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const vEvent = new VEvent({
  start: new Date()
})

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

When serializing to / from iCal, you must use the `VEvent` object. This is because

1. `serializeToICal()` expects `VEvent` objects.
2. `parseICal()` returns `VEvent` objects.
3. Unlike `Schedule` objects, the `VEvent` object actually adhears to the specifics of the iCalendar `VEVENT` spec (e.g. only one rrule, dtstart time is the first occurrence, etc).

See the [`VEvent` object section](./vevent) for more info on the `VEvent` object.

### `serializeToICal()`

The `serializeToICal()` function accepts a spread of `VEvent` objects and returns an array of iCalendar strings representing those objects.

Example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const vEvent = new VEvent({
  start: new Date()
})

const iCal = serializeToICal(vEvent); // => string
```

### `parseICal()`

The `parseICal()` function accepts either a single iCal string or an array of iCal strings, as well an options object with an optional dateAdapter property. If no options object is provided, `RScheduleConfig.defaultDateAdapter` is used. An `IParsedICalString<T extends typeof DateAdapter>` object is returned.

Example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const iCal = // ... ical string

const result = parseICal(iCal);

result.vEvents // => VEvent[];
result.iCal // => string;
result.jCal // => jCal object
```


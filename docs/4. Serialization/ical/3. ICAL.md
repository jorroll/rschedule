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

const iCal = vEvent.toICal(); // => string

vEvent.fromICal(iCal); // => VEvent[]
```

## Installation

`@rschedule/ical-tools` has a peer dependency on `ical.js`

```bash
yarn add @rschedule/ical-tools ical.js

# or

npm install @rschedule/ical-tools ical.js
```

## Usage

`VEvent` objects allow iterating a occurrence schedule made up of RRULEs and/or EXRULEs as well as RDATEs and EXDATEs. `VEvent` objects are similar to `Schedule` objects, but `VEvent` objects follow the [iCalendar `VEVENT` spec](https://tools.ietf.org/html/rfc5545#section-3.6.1) (e.g. dtstart time is the first occurrence, etc). As part of this support, `VEvent` objects make use of a special variation of `Rule` objects: `RRule` (i.e. `import { RRule } from '@rschedule/ical-tools'`). As with other rSchedule objects, `VEvent` is immutable.

Some rSchedule limitations:

- Not all iCal rules are currently supported.
  - `BYWEEKNO`, `BYYEARDAY`, `BYSETPOS` are unsupported
- Not all VEVENT properies of the ICAL spec are supported. The supported properties are `RRULE`, `EXRULE`, `RDATE`, `EXDATE`, `DTSTART`, `DTEND` and `DURATION`. Other properties are not supported.

Example usage:

```typescript
const vEvent = VEvent.fromICal(
  `DTSTART:20120524T000000Z\nRRULE:FREQ=WEEKLY;UNTIL=20121131T000000Z`,
);

vEvent
  .occurrences()
  .toArray()
  .map(date => date.toISOString());

vEvent.toICal(); // `DTSTART:20120524T000000Z\nRRULE:FREQ=WEEKLY;UNTIL=20121131T000000Z`
```

### Constructor

`VEvent` has the following constructor.

```typescript
class VEvent<D = any> {
  static fromICal(iCal: string): VEvent<{ jCal: IJCalComponent }>;

  data!: D;
  readonly start: DateAdapter;
  readonly isInfinite: boolean;
  readonly duration?: number | DateAdapter;
  readonly hasDuration: boolean;
  readonly maxDuration?: number;
  readonly timezone: string | null;

  readonly rrules: ReadonlyArray<RRule> = [];
  readonly exrules: ReadonlyArray<RRule> = [];
  readonly rdates: Dates<T>;
  readonly exdates: Dates<T>;

  constructor(args: {
    start: DateInput;
    // accepts either the number of milliseconds of the duration or the end
    // datetime of the first occurrence (which will be used to calculate the
    // duration in milliseconds)
    duration?: number | DateInput;
    // The data property holds arbitrary data associated with the `VEvent`.
    // The data property is mutable.
    //
    // When iterating through a VEvent, you can access a list of the generator objects (i.e. Rules / Dates)
    // which generated any yielded date by accessing the `DateAdapter#generators` property.
    // In this way, for a given, yielded date, you can access the objects which generated
    // the date as well as the arbitrary data associated with those objects.
    // The data property is ignored when serializing to iCal.
    data?: D;
    rrules?: ReadonlyArray<IVEventRuleOptions | RRule>;
    exrules?: ReadonlyArray<IVEventRuleOptions | RRule>;
    rdates?: ReadonlyArray<DateInput> | Dates;
    exdates?: ReadonlyArray<DateInput> | Dates;
    maxDuration?: number;
  });

  add(prop: 'rrule' | 'exrule', value: RRule): VEvent<D>;
  add(prop: 'rdate' | 'exdate', value: DateInput): VEvent<D>;

  remove(prop: 'rrule' | 'exrule', value: RRule): VEvent<D>;
  remove(prop: 'rdate' | 'exdate', value: DateInput): VEvent<D>;

  set(prop: 'timezone', value: string | null, options?: { keepLocalTime?: boolean }): VEvent<D>;
  set(prop: 'start', value: DateInput): VEvent<D>;
  set(prop: 'rrules' | 'exrules', value: RRule[]): VEvent<D>;
  set(prop: 'rdates' | 'exdates', value: Dates<unknown>): VEvent<D>;

  toICal(): string;
}
```

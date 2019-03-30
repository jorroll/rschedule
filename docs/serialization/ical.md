This library can serialize `Schedule` objects (as well as `RRule`, `EXRule`, `RDates`, and `EXDates` objects) to / from `ICAL` format.

Example:

```typescript
rrule.toICal(); // => string

schedule.toICal(); // => string[]
```

By default, it does so in a manner that might be unexpected for 3rd party APIs / someone familiar with the spec (see if you can spot the unexpected return in the example above), but you can force standard behavior.

What I mean: rSchedule allows RRule objects to have their own start / end times, but the spec doesn't allow this. To conform to the spec, by default RRULE objects are each serialized with their own, properly formatted, `DTSTART` time.

As such, by default, when you serialize a `Schedule` object, it is turned into an array of ICAL strings. This is fine when you're sending the data to another application you control, because you know what to expect. This might cause issues if you're trying to send the data to someone else's service (such as a google calendar), because they'll almost certainly expect a single `VEVENT` like object which contains `RRULE`, `EXRULE`, `RDATE`, `EXDATE` properties and a single `DTSTART` property. Google calendar would probably process an array of ical strings as an array of different events (rather than as pieces of the same event).

### If you'd like to serialize a Schedule to a single ICAL string, you must do the following:

1. You should make sure all of your Schedule's `RRULE` and `EXRULE` objects have the same start date, and none of the `RDates` or `EXDates` have a date which is earlier than that start date. If you don't do this, the ICAL string produced by `toICal()` will not accurately describe your schedule's occurrence pattern.
2. Call `toICal()` with the `singleStartDate: DateProp<T> | DateAdapter<T>` option.

Example:

```typescript
schedule.toICal({ singleStartDate: schedule.startDate }); // => string
```

_Note: `Schedule#startDate` returns `null` if the schedule has no occurrences, in which case `toICal()` will not receive a date and you'll have a bug._

If you're using RRule objects directly, and you'd like to just generate an ical string describing the rule without a DTSTART line, you can call `toICal()` with the `excludeDTSTART: boolean` option.

Example:

```typescript
rrule.toICal({ excludeDTSTART: true }); // => string
```

## Parsing from ICAL

At the moment, creating a `Schedule` object from ICAL strings is all that is supported (note, the schedule will create `new RRule()`, `new RDates()`, etc, as appropriate). I don't have a use case for instantiating stand-alone RDATE / RRULE objects.

`Schedule.fromICal()` has the following signature:

```typescript
class Schedule {

  static fromICal(
    icals: string | string[],
    dateAdapterConstructor: T extends DateAdapterConstructor,
    args?: {data?: D}
  ): Schedule<T, D>

}
```

You can use it like

```typescript
const schedule = Schedule.fromICal(ical, StandardDateAdapter);

const schedule = Schedule.fromICal(ical, StandardDateAdapter, { data: 'Holds anything I want' });
```

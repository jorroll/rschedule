# Occurrence Operators <!-- omit in toc -->

This library exports a selection of occurrence stream operators for manipulating a stream of occurrences. Current operators are:

- [Add](#Add)
- [Subtract](#Subtract)
- [Intersection](#Intersection)
- [Unique](#Unique)
- [MergeDuration](#MergeDuration)

Each of these operator functions is used as an argument to `IOccurrenceGenerator#pipe()`.

If you look at the source code for `Schedule` and `Calendar`, you'll see that, internally, their iteration logic is implemented with these operators. You can use these operators to create complex custom schedules.

For example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const rrules = new Rule({
  // ...rule options
});
const exrules = new Rule({
  // ...rule options
});
const rdates = new Dates({ dates: [new Date()] });
const exdates = new Dates({ dates: [new Date()] });

// This replicates the functionality of the `Schedule` object.
const schedule = new Calendar().pipe(
  add(rrule),
  subtract(exrule),
  add(rdates),
  subtract(exdates),
  unique(),
);

schedule.occurrences({ take: 5 }).toArray(); // occurrences;
```

## Operators <!-- omit in toc -->

#### Add

An operator function which accepts a spread of occurrence generators and adds their occurrences to the output.

Example:

```typescript
new Calendar().pipe(add(scheduleOne, scheduleTwo));
```

#### Subtract

An operator function which accepts a spread of occurrence generators and removes their occurrences from the output.

Example:

```typescript
new Calendar().pipe(
  add(schedule),
  subtract(aDifferentSchedule),
);
```

#### Intersection

An operator function which takes a spread of occurrence generators and only returns the dates which intersect every occurrence generator.

Because it's possible for all the generators to never intersect, and because the intersection operator can't detect this lack of intersection, you must call `intersection()` with a `{maxFailedIterations: number}` argument if it is built from occurrence generators of infinite length. For convenience, you can globally set `RScheduleConfig.defaultMaxFailedIterations`.

- Without further information, I'd probably set `defaultMaxFailedIterations = 50`.

The `maxFailedIterations` argument caps the number of iterations the operator will run through without finding a single valid occurrence. If this number is reached, the operator will stop iterating (preventing a possible infinite loop).

- Note: `maxFailedIterations` caps the number of iterations which _fail to turn up a single valid occurrence_. Every time a valid occurrence is returned, the current iteration count is reset to 0.
- If the occurrence generators feeding the IntersectionOperator are not infinite, the `maxFailedIterations` number is ignored.

Example:

```typescript
new Calendar().pipe(intersection({ maxFailedIterations: 50, streams: [scheduleOne, scheduleTwo] }));
```

#### Unique

An operator function which removes duplicate dates from the occurrence stream.

Example:

```typescript
new Calendar({
  schedules: [scheduleOne, scheduleTwo],
}).pipe(unique());
```

#### MergeDuration

_Note: only usable on streams where all occurrences have a duration_

An operator function which takes an occurrence stream with `hasDuration === true` and merges occurrences which have overlapping start and end times.

Example:

```typescript
const MILLISECONDS_IN_HOUR = 1000 * 60 * 60;

const dates = new Dates({
  dates: [
    new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
    new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 2 }),
    new StandardDateAdapter(new Date(2010, 10, 11, 14), { duration: MILLISECONDS_IN_HOUR * 2 }),
    new StandardDateAdapter(new Date(2010, 10, 12, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
  ],
  dateAdpter: StandardDateAdapter,
}).pipe(
  mergeDuration({
    maxDuration: MILLISECONDS_IN_HOUR * 24,
  }),
);

expect(dates.occurrences().toArray()).toEqual([
  new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
  new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 3 }),
  new StandardDateAdapter(new Date(2010, 10, 12, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
]);
```

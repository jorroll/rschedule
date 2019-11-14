# Occurrence Operators <!-- omit in toc -->

This library exports a selection of occurrence stream operators for manipulating a stream of occurrences. Current operators are:

- [Add](#add)
- [Subtract](#subtract)
- [Intersection](#intersection)
- [Unique](#unique)
- [MergeDuration](#mergeduration)
- [SplitDuration](#splitduration)

Each of these operator functions is used as an argument to `OccurrenceGenerator#pipe()`.

If you look at the source code for `Schedule` and `Calendar`, you'll see that, internally, their iteration logic is implemented with these operators. You can use these operators to create complex custom schedules.

For example:

```typescript
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

Because it's possible for all the generators to never intersect, and because the intersection operator can't detect this lack of intersection, you must call `intersection()` with a `{maxFailedIterations: number}` argument if it is built from occurrence generators of infinite length. For convenience, you can globally set `IntersectionOperator.defaultMaxFailedIterations`.

- Without further information, I'd probably set `defaultMaxFailedIterations = 50`.

The `maxFailedIterations` argument caps the number of iterations the operator will run through without finding a single valid occurrence. If this number is reached, the operator will stop iterating (preventing a possible infinite loop).

- Note: `maxFailedIterations` caps the number of iterations which _fail to turn up a single valid occurrence_. Every time a valid occurrence is returned, the current iteration count is reset to 0.
- If the occurrence generators feeding the IntersectionOperator are not infinite, the `maxFailedIterations` number is ignored.

Example:

```typescript
new Calendar().pipe(intersection({ streams: [scheduleOne, scheduleTwo], maxFailedIterations: 50 }));
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

You must provide a `maxDuration` argument that represents the maximum possible duration for a single occurrence. If this duration is exceeded, a `MergeDurationOperatorError` will be thrown.

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

#### SplitDuration

_Note: only usable on streams where all occurrences have a duration_

An operator function which takes an occurrence stream with `hasDuration === true` and passes occurrences through a splitting function. One usecase for this operator is to dynamically break up occurrences with a large duration into several smaller occurrences.

You must provide a `maxDuration` argument that represents the maximum possible duration for a single occurrence. If this duration is exceeded, a `SplitDurationOperatorError` will be thrown.

Usage example:

```typescript
const MILLISECONDS_IN_HOUR = 1000 * 60 * 60;

const splitFn = (date: DateTime) => {
  if (date.duration > MILLISECONDS_IN_HOUR) {
    const diff = date.duration! / 2;

    return [date.set('duration', diff), date.add(diff, 'millisecond').set('duration', diff)];
  }

  return [date];
};

const dates = new Dates({
  dates: [
    new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
    new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 2 }),
  ],
}).pipe(
  splitDuration({
    splitFn,
    maxDuration: MILLISECONDS_IN_HOUR * 1,
  }),
);

expect(dates.occurrences().toArray()).toEqual([
  new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
  new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
  new StandardDateAdapter(new Date(2010, 10, 11, 14), { duration: MILLISECONDS_IN_HOUR * 1 }),
]);
```

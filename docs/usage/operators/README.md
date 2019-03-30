This library exports a selection of occurrence stream operators for manipulating a stream of occurrences. Current operators are:

- [Operators](#operators)
    - [Add](#add)
    - [Subtract](#subtract)
    - [Intersection](#intersection)
    - [Unique](#unique)

Each of these operator functions is intended to be used as an argument in the `occurrenceStream()` function.

If you look at the source code for `Schedule` and `Calendar`, you'll see that, internally, their iteration logic is implemented with these operators. You can use these operators to create complex custom schedules.

Example from `Schedule` source:

```typescript
*_run(args: OccurrencesArgs<T> = {}) {
  const count = args.take;

  delete args.take;

  const iterator = occurrenceStream(
    add(...this.rrules),
    subtract(...this.exrules),
    add(this.rdates),
    subtract(this.exdates),
    unique(),
  )(this.dateAdapter)._run(args)

  let date = iterator.next().value
  let index = 0

  while (date && (count === undefined || count > index)) {
    date.generators.push(this)

    const yieldArgs = yield date.clone()

    date = iterator.next(yieldArgs).value

    index++
  }
}
```

The output from `occurrenceStream()` needs to be passed into a `Calendar` object to be useful.

Example:

```typescript
const scheduleOne = new Schedule();
const scheduleTwo = new Schedule();

new Calendar({
  schedule: occurrenceStream(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo)),
});
```

## Operators

#### Add

An operator function, intended as an argument for `occurrenceStream()`, which gets the union of the previous schedule's occurrences in the `occurrenceStream` pipe as well as the occurrences of any input arguments.

Example:

```typescript
occurrenceStream(add(scheduleOne, scheduleTwo));
```

#### Subtract

An operator function which filters out occurrences of input objects from the `occurrenceStream()` stream.

Example:

```typescript
occurrenceStream(add(schedule), subtract(aDifferentSchedule));
```

#### Intersection

An operator function takes a spread of occurrence streams and only returns the dates which intersect every occurrence stream.

Because it's possible for all the streams to never intersect, and because the intersection operator can't detect this lack of intersection, the IntersectionOperator must be constructed with either a `{maxFailedIterations: number}` argument or a `{defaultEndDate: T}` argument.

The `maxFailedIterations` argument caps the number of iterations `IterationOperator#_run()` will run through without finding a single valid occurrence. If this number is reached, the operator will stop iterating (preventing a possible infinite loop).

- Note: I'm going to emphasize that `maxFailedIterations` caps the number of iterations which fail to turn up a single valid occurrence. Every time a valid occurrence is returned, the current iteration count is reset to 0.

Alternatively, you can construct the operator with a `defaultEndDate` argument. This argument acts as the default `end` argument for `IterationOperator#_run()` for when you call that method without supplying an `end` argument (again, preventing possible infinite loops).

Example:

```typescript
occurrenceStream(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo));
```

#### Unique

An operator function which removes duplicate dates from the occurrence stream.

Example:

```typescript
occurrenceStream(
  add(scheduleOne, scheduleTwo)
  unique()
)
```

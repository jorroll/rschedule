# @rschedule/rule-tools

[![NPM version](https://flat.badgen.net/npm/v/@rschedule/rule-tools)](https://www.npmjs.com/package/@rschedule/rule-tools) [![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/rule-tools)](https://bundlephobia.com/result?p=@rschedule/rule-tools)

The optional package `@rschedule/rule-tools` contains utility functions for manipulating rSchedule `Rule` and `IScheduleLike` objects and working with common recurrence rule patterns. Even if you don't use it, it can provide a useful example of how to manipulate and build up immutable rSchedule objects.

Example:

```typescript
import { addSchedulePattern } from '@rschedule/rule-tools';

RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

let schedule = new Schedule<typeof StandardDateAdapter>();

schedule = addSchedulePattern('every [WEEKDAY]', new Date(), schedule);

// Assume the day is "Tuesday" so `new Date().getDay() === 2`

schedule.rrules[0].options; // { start: new Date(), frequency: 'WEEKLY', byDayOfWeek: ['TU']}

schedule.occursOn({ weekday: 'TU' }); // true
```

## Installation

```bash
yarn add @rschedule/rule-tools

# or

npm install @rschedule/rule-tools
```

## Usage

`@rschedule/rule-tools` provides utility functions for working with common occurrence and recurrence patterns which I've identified.

Currently, `@rschedule/rule-tools` defines four common recurrence patterns and one common occurrence pattern. A `RecurrencePattern` is a common combination of rule options for defining a recurring schedule. An `OccurrencePattern` is a common singleton occurrence definition.

The `rule-tools` package is meant to make it easier to add these common rule options to `Schedule` and `VEvent` objects, remove these common rule options, check if a schedule has a specific one of these common rule options on a given day, or update one of these common rule options to "stop" on a given day.

In practical terms, here is an example workflow:

1. A user clicks on a day on the calendar.
2. The `validRecurrencePatternsOnDate()` function can be used to find what common recurrence patterns can be added for the clicked date.
3. The `scheduleHasPattern()` function can be used to see if a specific `Schedule` object already has a specific occurrence pattern on the given date.
   - For all the rules existing in the `Schedule` for the given date, you can provide an option to the user to `end` that rule on that date, or remove the rule altogether.
     1. `endScheduleRecurrencePattern()`
     2. `removeSchedulePattern()`
   - For all the common rule patterns which the `Schedule` doesn't have on the given date, you can provide an option to the user to add a rule matching that pattern starting on the given date.
     1. `addSchedulePattern()`
4. If you have a `Rule` or rule options object, you can use `isRecurrencePattern()` to see if the rule options match a given recurrence pattern.
5. If you want to make a new `Rule` from scratch, you can use `buildRecurrencePattern()` to generate an options object matching the given recurrence pattern.

#### `RecurrencePattern` type

The `RecurrencePattern` type defines four common recurrence patterns. Where a recurrence pattern is a common set of rule options defining a schedule's repeating occurrences.

```typescript
type RecurrencePattern =
  | 'every [WEEKDAY]'
  | 'the [MONTH_WEEKNO] [WEEKDAY] of every month'
  | 'the [MONTH_DAYNO] of every month'
  | 'the last [WEEKDAY] of every month';
```

Examples:

1. `'every [WEEKDAY]'`
   - "Every Tuesday"
   - "Every Friday"
2. `'the [MONTH_WEEKNO] [WEEKDAY] of every month'`
   - "The 1st Monday of every month"
   - "The 5th Sunday of every month"
3. `'the [MONTH_DAYNO] of every month'`
   - "The 15th of every month"
   - "The 1st of every month"
4. `'the last [WEEKDAY] of every month';`
   - "The last Friday of every month"
   - "The last Saturday of every month"

#### `OccurrencePattern` type

The `OccurrencePattern` type defines one common definition for singleton occurrences.

```typescript
export type OccurrencePattern = 'date';
```

Examples:

1. `'date'`
   - "2019/05/04"
   - January 1st, 2019

## Schedule and VEvent functions

`@rschedule/rule-tools` provides utility functions for working with `IScheduleLike` objects (including `Schedule` and `VEvent`, and any custom objects you make which implement `IScheduleLike`).

### `scheduleHasPattern()`

Checks to see if a `schedule` contains the `OccurrencePattern` or `RecurrencePattern` on the given `date`.

- Pass the `ignoreStart: true` option to ignore the `start` time of the rules being checked (this means that the provided `date` can be before the rule's `start` time).

- Pass the `ignoreEnd: true` option to ignore the `end` time of the rules being checked (this means that the provided `date` can be after the rule's `end` time).

```typescript
function scheduleHasPattern<T extends typeof DateAdapter>(
  type: Pattern,
  date: DateInput<T>,
  schedule: IScheduleLike<T>,
  options?: {
    dateAdapter?: T | undefined;
    ignoreStart?: boolean | undefined;
    ignoreEnd?: boolean | undefined;
  },
): boolean;
```

### `addSchedulePattern()`

Adds the `OccurrencePattern` or `RecurrencePattern` to the `schedule` on the provided `date`.

```typescript
function addSchedulePattern<T extends typeof DateAdapter>(
  pattern: Pattern,
  date: DateInput<T>,
  schedule: IScheduleLike<T>,
  options?: { dateAdapter?: T },
): IScheduleLike<T>;
```

### `endScheduleRecurrencePattern()`

End any matching `RecurrencePatterns` the `schedule` has on the provided `date`.

```typescript
function endScheduleRecurrencePattern<T extends typeof DateAdapter>(
  type: RecurrencePattern,
  date: DateInput<T>,
  schedule: IScheduleLike<T>,
  options?: { dateAdapter?: T; cleanEXDates?: boolean },
): IScheduleLike<T>;
```

### `removeSchedulePattern()`

Remove any matching `OccurrencePatterns` or `RecurrencePatterns` the `schedule` has on the provided `date`.

```typescript
function removeSchedulePattern<T extends typeof DateAdapter>(
  pattern: Pattern,
  schedule: IScheduleLike<T>,
  date: DateInput<T>,
  options?: { dateAdapter?: T; cleanEXDates?: boolean },
): IScheduleLike<T>;
```

### `cleanScheduleEXDates()`

Remove all of the schedule's `exdates` which do not intersect the schedule's occurrences.

```typescript
function cleanScheduleEXDates<T extends typeof DateAdapter>(
  schedule: IScheduleLike<T>,
): IScheduleLike<T>;
```

## Rule functions

### `isRecurrencePattern()`

Checks to see if the provided rule/rule options match the given `RecurrencePattern`.

```typescript
function isRecurrencePattern<T extends typeof DateAdapter>(
  pattern: RecurrencePattern,
  date: DateInput<T>,
  rule: Rule<T> | IProvidedRuleOptions<T>,
  options?: { dateAdapter?: T; ignoreStart?: boolean; ignoreEnd?: boolean },
): boolean;
```

### `validRecurrencePatternsOnDate()`

Returns an array containing all the `RecurrencePatterns` which are valid on a given date.

```typescript
function validRecurrencePatternsOnDate<T extends typeof DateAdapter>(
  date: DateInput<T>,
  options?: { dateAdapter?: T },
): RecurrencePattern[];
```

### `buildRecurrencePattern()`

Builds a rule options object matching the given `RecurrencePattern` with the given `start` date.

```typescript
function buildRecurrencePattern<T extends typeof DateAdapter>(
  type: RecurrencePattern,
  start: DateInput<T>,
  options?: { dateAdapter?: T },
): IProvidedRuleOptions<T>;
```

# Change Log

This repo attempts to follow [semantic versioning](https://semver.org/).

## Unreleased

### Features

- Rigorously assert that rule options are valid. Previously, the library assumed typescript would catch obvious type errors and wouldn't bother checking for them.

### Fixes

- Prevent VEvent objects from being initialized with a rule specifying a `MILLISECONDLY` frequency.

## Releases

## 0.11.5 FEATURE (2019/7/19)

### Features

- upgraded `OccurrenceGenerator` methods to be duration aware
  - `occursBetween`
  - `occursOn`
  - `occursAfter`
  - `occursBefore`
- add option to `Calendar#set()` to set `Calendar#schedules`

## 0.11.4 FIX (2019/7/19)

### Features

- added ability to set rule frequency to 'MILLISECONDLY'

### Fixes

- added unit tests for `PipeController` and fixed bugs discovered during this process
  - fixed bug that affected reverse iteration of rules with a `count` property
  - fixed bug that affected reverse iteration with an interval > 1
  - fixed `DateTime#set()` bug that could occur when setting months
- added individual tests for each rule pipe
- fixed a few bugs in the `RevByDayOfWeek` pipe

## 0.11.3 FIX (2019/7/17)

### Fixes

- fixed iterating `Dates` in reverse with either the `start`/`end` arg
- fixed `OccurrenceGenerator#occursBefore()`
- fixed iterating occurrence operators in reverse
- added tests to help ensure a similar issue doesn't happen in the future.

## 0.11.2 FEATURE (2019/7/15)

### Features

- added `SplitDurationOperator`.
- added `VEvent#duration` support
- `ical-tools` can parse/serialize VEVENTs with `duration`/`dtend` property.
- `Dates#set()` can be used to set all the `duration` values of the underlying dates.

### Fixes

- fixed `MergeDurationOperator#_run()` not returning all relevant occurrences when provided a `start` or `end` arg.
- make the ordering of all ordered date arrays `duration` aware (for resolving order of otherwise identical dates).

## 0.11.1 FEATURE (2019/6/17)

### Features

- added `MergeDurationOperator`.

### Fixes

- fixed bug in the calculation of `Operator#isInfinite`.
- fixed bug in `AddOperator#_run()` and `IntersectionOperator#_run()` when iterating with `reverse: true` and a `start` / `end` time.

## 0.11.0 BREAKING (2019/5/4)

### Breaking

- updated `RScheduleConfig` so that config options are namespaced.
- updated `@rschedule/json-tools`
  - So that `IntersectionOperator#maxFailedIterations` is serialized.
    - There is no longer the option to provide `maxFailedIterations` to `parseJSON()`.
  - The `serializeToJSON()` interface has changed
  - The `parseJSON()` interface has changed to improve typing
- replace `ConstructorReturnType` with typescript builtin `InstanceType`
- reversed the order of the `DateAdapter#generators` property.
- changed the default type of `DateAdapter#generators` to `unknown[]`
- fixed type inference in some `@rschedule/rule-tools` methods which involved changing the type arguments.

### Features

- added `@rschedule/rule-tools` package.
- ability to set all `Rule#options` via `Rule#set()`.
- added `IScheduleLike<T extends typeof DateAdapter>` interface.
- added `IDataContainer<D>` interface
- added `RScheduleConfig.Rule.defaultWeekStart` config option.
- added `Operator.isOperator()`
- added support for serializing / parsing the `data` property to `@rschedule/json-tools`.
- when iterating through a `Schedule`, `Calendar`, `VEvent`, `Dates`, or `Rule` object, the `generators` property now receives some proper typing. This will make accessing the `data` property on occurrence generators easier.
- improved typing of many `isInstance` methods.
- added `DateAdapterFor<O extends IOccurrenceGenerator>`
- added `DataFor<O extends IDataContainer>`
- added `DateAdapter#end`
- ability to keep local time when calling `IOccurrenceGenerator#set('timezone')`

### Fixes

- `AddOperator.isAddOperator()`
- `SubtractOperator.isSubtractOperator()`
- `IntersectionOperator.isIntersectionOperator()`
- `UniqueOperator.isUniqueOperator()`
- `OccurrenceStream.isOccurrenceStream()`
- ensure `DateAdapter#date` is immutable
- don't include `undefined` properties in `DateAdapter#toJSON()`
- ensure `DateAdapter#generators` is propogated to results

## 0.10.0 BREAKING (2019/4/15)

### Breaking

- fixed `VEvent` to allow multiple rrules / exrules as per the ical spec.
  - This also included appropriate changes in `ical-tools` `serializeToICal()` and
    `parseICal()` functions.
- updated `Dates` to not change the timezone associated with `Dates#adapters`.
  This means that a date in `Dates#adapters` may not have the same timezone as `Dates#timezone`
  (dates yielded by `Dates` are still updated to have the same timezone as `Dates#timezone`, however).
  This distinction can be important when serializing a `Dates` object as it ensures the original
  timezones associated with the underlying dates are preserved.

### Features

- added ability to set individual `Rule#options` via `Rule#set()`.
- added ability to pass whole `Rule` and `Dates` objects to the `VEvent` constructor.
- added `VEvent#set()`, `VEvent#add()`, and `VEvent#remove()`.

## 0.9.1 FIX (2019/4/14)

### Fixes

- Fixed npm tag associated with `@rschedule/rschedule` release

## 0.9.0 BREAKING (2019/4/14)

### Breaking

- Rewrote repo so that, internally, immutable custom `DateTime` objects are used for datetime manipulation. This appears to have eliminated all outstanding recurrence bugs.
- Moved `MomentTZDateAdapter` into its own package.
- Updated `json-tools` to work with new API.
- Updated `ical-tools` to work with new API.
  - Added new `VEvent` object which aligns to the `VEVENT` component in the ICalendar spec.
  - Removed the `ical-tools` dependency on `lodash.clonedeep`.
- Eliminated `EXRule`, `RRule`, `EXDate`, and `RDate` objects. Now there are just `Dates` and `Rule` objects.
- Simplified the code for operators.
- Simplified the code for DateAdapters.
- Renamed `until` rule option to `end`.
- Changed rSchedule's representation of the "local" timezone from `undefined` to `null`.

### Features

- Added in beginning of `duration` support.
- Migrated docs from a gitlab WIKI to individual files inside the repo so that doc changes are tracked alongside the repo.
- Added immutable `add()`, `remove()`, and `set()` CRUD methods to `Schedule` and `Dates`.
- Added immutable `filter()` method to `Dates` which filters the `Dates` object's associated dates and returns a new `Dates` object.

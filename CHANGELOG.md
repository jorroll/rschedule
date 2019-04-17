# Change Log

This repo attempts to follow [semantic versioning](https://semver.org/).

## Unreleased

### Breaking

- updated `RScheduleConfig` so that config options are namespaced.
- updated `@rschedule/json-tools`
  - So that `IntersectionOperator#maxFailedIterations` is serialized.
    - There is no longer the option to provide `maxFailedIterations` to `parseJSON()`.
  - The `serializeToJSON()` interface has changed

### Features

- added `@rschedule/rule-tools` package.
- ability to set all `Rule#options` via `Rule#set()`.
- added `IScheduleLike<T extends typeof DateAdapter>` interface.
- added `RScheduleConfig.Rule.defaultWeekStart` config option.
- added `Operator.isOperator()`
- added support for serializing / parsing the `data` property to `@rschedule/json-tools`.

### Fixes

- `AddOperator.isAddOperator()`
- `SubtractOperator.isSubtractOperator()`
- `IntersectionOperator.isIntersectionOperator()`
- `UniqueOperator.isUniqueOperator()`
- `OccurrenceStream.isOccurrenceStream()`

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

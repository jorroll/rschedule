# Change Log

This repo attempts to follow [semantic versioning](https://semver.org/).

## 0.9.1 FIX (2019/4/14)

- Fixed npm tag associated with `@rschedule/rschedule` release

## 0.9.0 BREAKING (2019/4/14)

- Rewrote repo so that, internally, immutable custom `DateTime` objects are used for datetime manipulation. This appears to have eliminated all outstanding recurrence bugs.
- Added in beginning of `duration` support.
- Moved `MomentTZDateAdapter` into its own package.
- Updated `json-tools` to work with new API.
- Updated `ical-tools` to work with new API.
  - Added new `VEvent` object which aligns to the `VEVENT` component in the ICalendar spec.
  - Removed the `ical-tools` dependency on `lodash.clonedeep`.
- Migrated docs from a gitlab WIKI to individual files inside the repo so that doc changes are tracked alongside the repo.
- Eliminated `EXRule`, `RRule`, `EXDate`, and `RDate` objects. Now there are just `Dates` and `Rule` objects.
- Simplified the code for operators.
- Simplified the code for DateAdapters.
- Renamed `until` rule option to `end`.
- Added immutable `add()`, `remove()`, and `set()` CRUD methods to `Schedule` and `Dates`.
- Added immutable `filter()` method to `Dates` which filters the `Dates` object's associated dates and returns a new `Dates` object.
- Changed rSchedule's representation of the "local" timezone from `undefined` to `null`.

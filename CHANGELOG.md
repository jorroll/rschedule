# Change Log

This repo attempts to follow [semantic versioning](https://semver.org/).

## Unreleased

- None

## 1.2.1 FIX (2020/9/25)

### Fixes

- Explicitly define the return type of functions and methods (issue [#47](https://gitlab.com/john.carroll.p/rschedule/issues/47))

## 1.2.0 FEATURE (2020/6/25)

### Feature

- Update typescript to version 3.9.x

### Fixes

- Check presence of dayjs "UTC" plugin at run time rather than at import time ([#44](https://gitlab.com/john.carroll.p/rschedule/issues/44)).

## 1.1.3 FEATURE (2020/6/16)

### Feature

- Add `DayjsDateAdapter` package (#43).

## 1.0.5 FIX (2020/6/16)

### Fixes

- Fixed the handling of the `skipToDate` OccurrenceIterator `next()` arg ([!54](https://gitlab.com/john.carroll.p/rschedule/-/merge_requests/54))

## 1.0.4 FIX (2020/6/1)

### Fixes

- Fixed an issue when using IntersectionOperator with a RecurrencePipe ([!53](https://gitlab.com/john.carroll.p/rschedule/-/merge_requests/53))

## 1.0.3 FIX (2019/12/16)

### Fixes

- Properly serialize a VEvent containing a rule with an interval ([#39](https://gitlab.com/john.carroll.p/rschedule/issues/39))
- Remove `byMillisecondOfSecond` from VEvent rule options.

## 1.0.2 FIX (2019/12/1)

- Same as `1.0.1` but fixes a build issue with that version.

## 1.0.1 FIX (2019/12/1)

### Fixes

- Added all side effects declarations to each module's main `package.json` file as an attempted fix for [issue #37](https://gitlab.com/john.carroll.p/rschedule/issues/37). Previously each entry point handled it's own side effects declarations.

## 1.0.0 (2019/11/14)

- This marks the first non-beta release of rSchedule. There is no functional difference between this version and version `0.12.2`.

## 0.12.2 FIX (2019/11/13)

### Fixes

- Clarify the effect of the `timezone` argument in the docs.
- Fixed bug that could occur if a `RecurrenceRulesIterator` was passed run options with a `start`/`end` time in a different time zone from the `RecurrenceRulesIterator's` rule start time ([#35](https://gitlab.com/john.carroll.p/rschedule/issues/35)).
- Fixed a bug that could result in generated date adapters not having the proper `generators` value.

## 0.12.1 FIX (2019/9/26)

### Fixes

- Fixed module build targets so that `UMD` targets `es5` and `es2015` targets `es2015` (#34)

## 0.12.0 BREAKING (2019/9/15)

This is a large breaking change to the library that simplifies the API and increases the modularity / extensibility of the code. You should check out the updated docs to understand all of the changes. The new API is similar to the old API, but better.

#### API improvements

Through some dark, typescript sorcery, rSchedule no longer needs to export generic objects to adapt the library's typing for different date adapters. Now you can simply import your date adapter of choice once, and the types of rSchedule's objects will automatically be updated. Where before you might have:

```ts
const rule = new Rule<typeof MomentDateAdapter>();

const dates: Moment[] = rule
  .occurrences()
  .toArray()
  .map(({ date }) => date);

// OR

const rule = new Rule<typeof StandardDateAdapter>();

const dates: Date[] = rule
  .occurrences()
  .toArray()
  .map(({ date }) => date);
```

now you simply have

```ts
const rule = new Rule();

const dates: Moment[] = rule
  .occurrences()
  .toArray()
  .map(({ date }) => date);

// OR, when using the StandardDateAdapter

const rule = new Rule();

const dates: Date[] = rule
  .occurrences()
  .toArray()
  .map(({ date }) => date);
```

it's magical! End users need never touch a date adapter.

#### Modularity changes

The `@rschedule/rschedule` package has been removed and replaced with `@rschedule/core` which itself has been broken up into `@rschedule/core`, `@rschedule/core/generators`, and `@rschedule/core/rules`. The recurrence rule API has also been improved, simplified, and now made public (where before it was private API).

- `@rschedule/core` contains the required bits of the library: the recurrence and date adapter logic and nothing else (it doesn't contain any actual recurrence rules).
- `@rschedule/core/rules` contains individual rule modules. You can now pick and choose which rules you care about, potentially reducing bundle size. Unused rules are tree-shakable. This also means that this library can add additional rules in the future, without worrying about bloating the library for folks that don't need the new features.
- Similarly, `@rschedule/core/generators` contains the opinionated `OccurrenceGenerator` API, which is also now optional and tree-shakable. This allows additional occurrence stream operators to be added in the future, without fear of bloating the library for folks who don't need them.

### Breaking

_Note: this update is large and not all changes are included below._

- `@rschedule/rschedule` -> `@rschedule/core`, `@rschedule/core/generators`, and `@rschedule/core/rules`.
- DateAdapter updated to support different date libraries via typescript declaration merging. This affects almost all of the types in the library, most of which are no longer generic.
  - `OccurrenceGenerator` is no longer generic. Similarly, `Calendar`, `Schedule`, `Rule`, and `Dates` only receive an optional generic param for their `data` attribute.
  - `IDateAdapter` removed and folded into the `DateAdapterBase` class. Now, all date adapters must extend the abstract `DateAdapterBase` class.
  - `DateAdapter` class renamed `DateAdapterBase`. `DateAdapter` is now an exported type equal to the activated date adapter, as well as a namespace.
  - It is now impossible to utilize two different date adapters in a single project at the same time. This was never encouraged, but previously it was possible.
- `Dates` `duration` constructor argument now only applies the duration to provided dates which do not already have a duration. Put another way, the `duration` option for the dates constructor now acts as a default duration for provided dates, rather than _the duration_ of all dates.
- `DateAdapter#duration` type changed from `number | undefined` to `number`. A duration of `0` is treated as no duration.
- `OccurrenceGenerator#collections()` arguments changed. Specifically, CollectionIterator `ICollectionArgs` interface changed.
  - `incrementLinearly` option removed
  - `skipEmptyPeriods` option added
  - `granularity` `"INSTANTANIOUS"` option removed. Use `"MILLISECONDLY"` instead (which does the same thing).
  - By default, `OccurrenceGenerator#collections()` now increments linearly. You can use `skipEmptyPeriods: true` to get the old default behavior.
- Default granularity for `OccurrenceGenerator#collections()` is now `"YEARLY"`. This change was made to accomidate the other changes to CollectionIterator.
- `@rschedule/json-tools` no longer exports `parseJSON()` or `serializeToJSON()` functions. Instead, the library contains individual modules for each rSchedule object which, when imported, modify that rschedule object, adding `toJSON()` and static `fromJSON()` methods.
- `@rschedule/ical-tools` no longer exports `parseICal()` or `serializeToICal()` functions. Instead, `VEvent` now has `VEvent#toICal()` and `VEvent.fromICal()`.

### Features

- Added `DateAdapter#set('duration', number)` option for setting a date adapters duration.
- `RecurrenceRuleIterator`, as well as individual recurrence rules, are now public API.

### Fixes

- Fixed potential bug when calling `OccurrenceGenerator#collections()` with granularity `"MONTHLY"` and a `weekStart` value.
- Fixed the return type of `OccurrenceGenerator#[Symbol.iterator]`

### Peformance

- `OccurrenceGenerator#firstDate` and `OccurrenceGenerator#lastDate` now cache their value after the initial lazy evaluation.
- Combine time-related rule pipe logic into a base class to reduce bundle size

## Releases

## 0.11.6 FEATURE (2019/8/18)

### Features

- Rigorously assert that rule options are valid. Previously, the library assumed typescript would catch obvious type errors and wouldn't bother checking for them.
- Add JodaDateAdapter

### Fixes

- Prevent VEvent objects from being initialized with a rule specifying a `MILLISECONDLY` frequency.

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

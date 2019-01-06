# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## Unreleased

### ical-tools

Still marked as a beta release. This package has been updated to depend on the `ical.js` package for parsing of iCalendar strings. Work is being done to provide parsing and serializing functions for rSchedule objects.

### rschedule

**Breaking Changes**

- Removed parsing / serializing functionality from the package and moved it into `ical-tools` package.

**Features**

- Added `toJSON()` method to `DateAdapter` / `IDateAdapter`.

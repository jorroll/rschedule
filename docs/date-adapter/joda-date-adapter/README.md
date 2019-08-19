# @rschedule/joda-date-adapter

[![NPM version](https://flat.badgen.net/npm/v/@rschedule/joda-date-adapter)](https://www.npmjs.com/package/@rschedule/joda-date-adapter) [![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/joda-date-adapter)](https://www.npmjs.com/package/@rschedule/joda-date-adapter)

**[`JodaDateAdapter implements IDateAdapter<DateTime>`](../#IDateAdapter-Interface)**

rSchedule DateAdapter for working with [js-joda](https://github.com/js-joda/js-joda) `ZonedDateTime` objects. Supports time zones via the `@js-joda/timezone` package. Without the optional `@js-joda/timezone` package, supports the "UTC" and "SYSTEM" (local) time zones.

## Installation

```bash
yarn add @rschedule/joda-date-adapter

# or

npm install @rschedule/joda-date-adapter
```

## Usage

Configure as "global" default date adapter with:

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';
import { JodaDateAdapter } from '@rschedule/joda-date-adapter';

RScheduleConfig.defaultDateAdapter = JodaDateAdapter;
```

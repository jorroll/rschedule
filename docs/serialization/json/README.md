# @rschedule/json-tools

![NPM version](https://flat.badgen.net/npm/v/@rschedule/json-tools) ![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/json-tools)

The optional package `@rschedule/json-tools` includes `serializeToJSON()` and `parseJSON()` functions.

Example:

```typescript
import { serializeToJSON, parseJSON } from '@rschedule/json-tools';

RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const schedule = new Schedule<typeof StandardDateAdapter>({
  rrules: [
    {
      start: new Date(),
      frequency: 'DAILY',
    }
  ]
})

const json = serializeToJSON(schedule);

const string = JSON.stringify(json);

parseJSON(JSON.parse(string)); // => Schedule
```

## Installation

```bash
yarn add @rschedule/json-tools

# or

npm install @rschedule/json-tools
```

## Usage

`@rschedule/json-tools` supports serializing `Calendar`, `Schedule`, `Dates`, `Rule`, and `OccurrenceStream` objects to json, as well as parsing those objects back from json.

### `serializeToICal()`

The `serializeToJSON()` function accepts a spread of `Calendar`, `Schedule`, `Dates`, `Rule`, and `OccurrenceStream` objects and returns JSON object representations. If any of the objects being serialized have a `data` property, it is ignored.

Example:

```typescript
import { serializeToJSON } from '@rschedule/json-tools';

RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const schedule = new Schedule<typeof StandardDateAdapter>({
  rrules: [
    {
      start: new Date(),
      frequency: 'DAILY',
    }
  ]
})

const json = serializeToJSON(schedule);

const string = JSON.stringify(json);
```

### `parseJSON()`

The `parseJSON()` function accepts single/array of JSON serialized `Calendar`, `Schedule`, `Dates`, `Rule`, and `OccurrenceStream` objects and instantiates those objects. `parseJSON()` also accepts an optional
options object with optional `dateAdapter` and `maxFailedIterations` properties. If `dateAdapter` is not provided, `RScheduleConfig.defaultDateAdapter` is used. `maxFailedIterations` is used when parsing an `IntersectionOperator` (see the [occurrence stream operators](../../usage/operators#Intersection) section for more info).

Example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const jsonSchedule = // ... json object representing a Schedule

const schedule = parseJSON(jsonSchedule); // Schedule

Schedule.isSchedule(schedule) // true;
```


# @rschedule/json-tools

[![NPM version](https://flat.badgen.net/npm/v/@rschedule/json-tools)](https://www.npmjs.com/package/@rschedule/json-tools) [![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/json-tools)](https://bundlephobia.com/result?p=@rschedule/json-tools)

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
    },
  ],
});

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

`@rschedule/json-tools` supports serializing `Calendar`, `Schedule`, `Dates`, `Rule`, and `OccurrenceStream` objects to json, as well as parsing those objects back from json. It also supports optionally serializing / parsing the `data` property on `Calendar`, `Schedule`, `Dates`, and `Rule` objects.

### `serializeToICal()`

The `serializeToJSON()` function accepts an individual or array of `Calendar`, `Schedule`, `Dates`, `Rule`, or `OccurrenceStream` objects and returns JSON object representations. It also accepts an options object with a `serializeData` property.

- If `serializeData: true`, then the `data` property of `Calendar`, `Schedule`, `Dates`, `Rule` will be retained **_as-is_** in the JSON output.
- If `serializeData: (input: Calendar<any> | Schedule<any> | Dates<any> | Rule<any>) => unknown`, then the `Calendar | Schedule | Dates | Rule` object will be passed as a single argument to the provided function and the return value of the function will be added to the JSON output.

Example:

```typescript
import { serializeToJSON } from '@rschedule/json-tools';

RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const schedule = new Schedule<typeof StandardDateAdapter>({
  rrules: [
    {
      start: new Date(),
      frequency: 'DAILY',
    },
  ],
});

const json = serializeToJSON(schedule);
// ALTERNATIVELY const json = serializeToJSON(schedule, { serializeData: true });
// ALTERNATIVELY const json = serializeToJSON(schedule, { serializeData: input => JSON.stringify(input.data) });

const string = JSON.stringify(json);
```

### `parseJSON()`

The `parseJSON()` function accepts single/array of JSON serialized `Calendar`, `Schedule`, `Dates`, `Rule`, and `OccurrenceStream` objects and instantiates those objects. `parseJSON()` also accepts an optional
options object with optional `dateAdapter` and `parseData` properties.

- If `dateAdapter` is not provided, `RScheduleConfig.defaultDateAdapter` is used.
- If `data` is present on an object when `parseJSON()` parses it, that data will always be passed to the appropriate rSchedule constructor as the `data` property. If you provide an optional `parseData: (data?: unknown) => unknown` function, then that function will be used to parse an object's data property.

Example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const jsonSchedule = // ... json object representing a Schedule

const schedule = parseJSON(jsonSchedule); // Schedule
// ALTERNATIVELY const schedule = parseJSON(jsonSchedule, { parseData: data => data && JSON.parse(data) });

Schedule.isSchedule(schedule) // true;
```

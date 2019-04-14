### `StandardDateAdapter`

![NPM version](https://flat.badgen.net/npm/v/@rschedule/standard-date-adapter) ![Size when minified & gzipped](https://flat.badgen.net/bundlephobia/minzip/@rschedule/standard-date-adapter)

**implements [`IDateAdapter<Date>`](../#IDateAdapter-Interface)**

rSchedule DateAdapter for working with standard javascript `Date` objects. Only supports local and UTC timezones.

## Installation

```bash
yarn add @rschedule/standard-date-adapter

# or

npm install @rschedule/standard-date-adapter
```

## Usage

Configure as "global" default date adapter with:

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';

RScheduleConfig.defaultDateAdapter = StandardDateAdapter;
```

Unlike the other date adapters, if you want to create a StandardDateAdapter in the UTC timezone you need to pass an additional argument to the constructor

Example

```typescript
new StandardDateAdapter(new Date(), { timezone: 'UTC' });
```

Additionally, many object methods in rSchedule can accept either a raw date (in this case `Date`) object, or a DateAdapter object. If you ever want to specify that the date you are passing is a UTC date, you need to pass a StandardDateAdapter instance. This is because Date objects don't have a timezone setting themselves.

An example of where this is needed is if you are creating a new rule and the start time should be in UTC. In that case, you would need to pass in a `StandardDateAdapter` object as the start time, rather than a `Date` as the start time.

### `MomentTZDateAdapter`

**implements [`IDateAdapter<Moment>`](../)**

rSchedule DateAdapter for working with [moment-timezone](https://momentjs.com/timezone/) `Moment` objects. Has full timezone support. If you don't need full timezone support, or if you are not using the [`moment-timezone`](https://momentjs.com/timezone/) add on to [`moment`](https://momentjs.com), then you should consider the [`MomentDateAdapter`](./moment-date-adapter) instead.

## Installation

```bash
yarn add @rschedule/moment-tz-date-adapter

# or

npm install @rschedule/moment-tz-date-adapter
```

## Usage

Configure as "global" default date adapter with:

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';

RScheduleConfig.defaultDateAdapter = MomentTZDateAdapter;
```

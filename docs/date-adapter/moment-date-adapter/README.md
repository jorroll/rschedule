### `MomentDateAdapter`

**implements [`IDateAdapter<Moment>`](../)**

rSchedule DateAdapter for working with [moment](https://momentjs.com) `Moment` objects. Only supports local and UTC timezones. For full timezone support, you need to use the [`MomentTZDateAdapter`](./moment-tz-date-adapter) (along with [`moment-timezone`](https://momentjs.com/timezone/)).

## Installation

```bash
yarn add @rschedule/moment-date-adapter

# or

npm install @rschedule/moment-date-adapter
```

## Usage

Configure as "global" default date adapter with:

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';

RScheduleConfig.defaultDateAdapter = MomentDateAdapter;
```

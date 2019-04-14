### `LuxonDateAdapter`

**implements [`IDateAdapter<DateTime>`](../#IDateAdapter-Interface)**

rSchedule DateAdapter for working with [luxon](https://moment.github.io/luxon/) `DateTime` objects. Has full timezone support.

## Installation

```bash
yarn add @rschedule/luxon-date-adapter

# or

npm install @rschedule/luxon-date-adapter
```

## Usage

Configure as "global" default date adapter with:

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';

RScheduleConfig.defaultDateAdapter = LuxonDateAdapter;
```

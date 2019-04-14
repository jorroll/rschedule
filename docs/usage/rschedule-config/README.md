The `RScheduleConfig` object holds global config values for rSchedule.

Config properties:

- `defaultDateAdapter`
- `defaultTimezone`
- `defaultMaxFailedIterations`

### `defaultDateAdapter`

A convenience property which allows you to define a global default `IDateAdapter` constructor object which all rSchedule classes should use. See the [`IDateAdapter`](../date-adapter) section for more info.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.defaultDateAdapter = MomentTZDateAdapter;
```

### `defaultTimezone`

A convenience property which allows you to define a global default `timezone` value which all rSchedule classes should use. By default, the default `timezone` for rSchedule classes is the local time zone. For example, if you create a `Schedule` object and don't specify a specific timezone, it will return dates in the local time zone. If you wish to change this default globally, you can use this property.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.defaultTimezone = 'America/Los_Angeles';
```

### `defaultMaxFailedIterations`

A convenience property which allows you to define a global default `maxFailedIterations` value for the `IntersectionOperator`. See the [`IntersectionOperator`](../operators#intersection-operator) section on the occurrence stream operators page for more info.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.defaultMaxFailedIterations = 50;
```


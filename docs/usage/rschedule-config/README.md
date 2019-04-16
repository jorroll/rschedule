# RScheduleConfig

The `RScheduleConfig` class holds global config values for rSchedule.

```typescript
class RScheduleConfig {
  static defaultDateAdapter: typeof DateAdapter | undefined;
  static defaultTimezone: string | null = null;
  static IntersectionOperator: IntersectionOperatorConfig;
  static Rule: RuleConfig;
}

class IntersectionOperatorConfig {
  static defaultMaxFailedIterations: number | undefined;
}

class RuleConfig {
  static defaultWeekStart: IDateAdapter.Weekday | undefined;
}
```

## RScheduleConfig class

### `defaultDateAdapter`

A convenience property which allows you to define a global default `IDateAdapter` constructor object which all rSchedule classes should use. See the [`IDateAdapter`](../date-adapter) section for more info.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.defaultDateAdapter = MomentTZDateAdapter;
```

### `defaultTimezone`

A convenience property which allows you to define a global default `timezone` value which all rSchedule classes should use. By default, the default `timezone` for rSchedule classes is the local (`null`) time zone. For example, if you create a `Schedule` object and don't specify a specific timezone, it will return dates in the local time zone. If you wish to change this default globally, you can use this property.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.defaultTimezone = 'America/Los_Angeles';
```

## IntersectionOperatorConfig class

### `defaultMaxFailedIterations`

A convenience property which allows you to define a global default `maxFailedIterations` value for the `IntersectionOperator`. See the [`IntersectionOperator`](../operators#intersection-operator) section on the occurrence stream operators page for more info.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.IntersectionOperator.defaultMaxFailedIterations = 50;
```

## RuleConfig class

### `defaultWeekStart`

A convenience property which allows you to define a global default `weekStart` value for `Rule` objects. See the [`Rule`](../operators#intersection-operator) object description for more information on the `weekStart` option. When undefined, rSchedule follows the iCal spec convention of using a default `weekStart` of `MO`.

```typescript
import { RScheduleConfig } from '@rschedule/rschedule';

RScheduleConfig.Rule.defaultWeekStart = 'MO';
```

Note: if you set a `defaultWeekStart` value, then all rule objects will have a `weekStart` value. This will affect parsing rules from ical/json.

For example: normally when using the `parseICal()` function from the `ical-tools` package, the following would be `true`:

```typescript
'DTSTART:20190101T000000Z\nRRULE:FREQ=DAILY' ===
  serializeToICal(parseICal('DTSTART:20190101T000000Z\nRRULE:FREQ=DAILY'));
```

However, if `RScheduleConfig.Rule.defaultWeekStart !== undefined`, then rSchedule needs to do the following so that the rule behaves as expected:

```typescript
parseICal('DTSTART:20190101T000000Z\nRRULE:FREQ=DAILY') ===
  new Rule<typeof StandardDateAdapter>({
    start: new Date(2019, 0, 1),
    frequency: 'DAILY',
    weekStart: 'MO',
  });

// and

serializeToICal(parseICal('DTSTART:20190101T000000Z\nRRULE:FREQ=DAILY')) ===
  'DTSTART:20190101T000000Z\nRRULE:FREQ=DAILY;WKST=SU';
```

`json-tools` behaves similarly.

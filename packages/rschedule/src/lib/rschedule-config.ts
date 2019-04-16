import { DateAdapter } from './date-adapter';
import { IDateAdapter } from './date-time';

export class IntersectionOperatorConfig {
  static defaultMaxFailedIterations?: number;
}

export class RuleConfig {
  static defaultWeekStart?: IDateAdapter.Weekday;
}

export class RScheduleConfig {
  static defaultDateAdapter: typeof DateAdapter;
  static defaultTimezone: string | null = null;
  static IntersectionOperator = IntersectionOperatorConfig;
  static Rule = RuleConfig;
}

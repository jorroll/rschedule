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
  static readonly IntersectionOperator = IntersectionOperatorConfig;
  static readonly Rule = RuleConfig;
}

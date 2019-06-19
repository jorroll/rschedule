import { DateAdapter } from './date-adapter';
import { IDateAdapter } from './date-time';

export class IntersectionOperatorConfig {
  static defaultMaxFailedIterations?: number;
}

export class RuleConfig {
  static defaultWeekStart?: IDateAdapter.Weekday;
}

export class MergeDurationOperatorConfig {
  static defaultMaxDuration?: number;
}

export class SplitDurationOperatorConfig {
  static defaultMaxDuration?: number;
}

export class RScheduleConfig {
  static defaultDateAdapter: typeof DateAdapter;
  static readonly Rule = RuleConfig;
  static readonly IntersectionOperator = IntersectionOperatorConfig;
  static readonly MergeDurationOperator = MergeDurationOperatorConfig;
  static readonly SplitDurationOperator = SplitDurationOperatorConfig;
}

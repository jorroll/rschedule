import { DateAdapter } from './date-adapter';

export class RScheduleConfig {
  static defaultDateAdapter: typeof DateAdapter | undefined;
  static defaultTimezone: string | undefined;
  static defaultMaxFailedIterations: number | undefined;
}

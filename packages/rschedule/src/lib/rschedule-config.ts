import { DateAdapter } from './date-adapter';

export class RScheduleConfig {
  static defaultDateAdapter: typeof DateAdapter | undefined;
  static defaultTimezone: string | null = null;
  static defaultMaxFailedIterations: number | undefined;
}

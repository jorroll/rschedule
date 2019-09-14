import { DateAdapter } from '@rschedule/core';

declare module '@rschedule/core' {
  namespace RuleOption {
    type ByDayOfWeek = DateAdapter.Weekday | [DateAdapter.Weekday, number];
  }
}

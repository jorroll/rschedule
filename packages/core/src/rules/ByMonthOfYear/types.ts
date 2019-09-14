import { DateAdapter } from '@rschedule/core';

declare module '@rschedule/core' {
  namespace RuleOption {
    type ByMonthOfYear = DateAdapter.Month;
  }
}

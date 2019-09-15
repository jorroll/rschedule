import { DateAdapter } from '@rschedule/core';

declare module '../../recurrence-rule-options' {
  namespace RuleOption {
    type ByMonthOfYear = DateAdapter.Month;
  }
}

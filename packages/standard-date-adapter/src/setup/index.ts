import { DateAdapterBase } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';
import '@rschedule/core/rules/ICAL_RULES';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';

declare module '@rschedule/core/DateAdapter' {
  interface DateAdapterType {
    standard: StandardDateAdapter;
  }

  interface DateAdapterCTorType {
    standard: typeof StandardDateAdapter;
  }
}

DateAdapterBase.adapter = StandardDateAdapter;
Rule.recurrenceRules = ICAL_RULES;

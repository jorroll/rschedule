import { DateAdapterBase } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';
import '@rschedule/core/rules/ICAL_RULES';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';

declare module '@rschedule/core/DateAdapter' {
  interface DateAdapterType {
    moment: MomentDateAdapter;
  }

  interface DateAdapterCTorType {
    moment: typeof MomentDateAdapter;
  }
}

DateAdapterBase.adapter = MomentDateAdapter as any;
Rule.recurrenceRules = ICAL_RULES;

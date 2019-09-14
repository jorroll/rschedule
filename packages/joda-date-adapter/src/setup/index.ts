import { DateAdapterBase } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';
import '@rschedule/core/rules/ICAL_RULES';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
import { JodaDateAdapter } from '@rschedule/joda-date-adapter';

declare module '@rschedule/core/DateAdapter' {
  interface DateAdapterType {
    joda: JodaDateAdapter;
  }

  interface DateAdapterCTorType {
    joda: typeof JodaDateAdapter;
  }
}

DateAdapterBase.adapter = JodaDateAdapter as any;
Rule.recurrenceRules = ICAL_RULES;

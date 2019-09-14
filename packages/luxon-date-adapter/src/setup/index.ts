import { DateAdapterBase } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';
import '@rschedule/core/rules/ICAL_RULES';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';

declare module '@rschedule/core/DateAdapter' {
  interface DateAdapterType {
    luxon: LuxonDateAdapter;
  }

  interface DateAdapterCTorType {
    luxon: typeof LuxonDateAdapter;
  }
}

DateAdapterBase.adapter = LuxonDateAdapter as any;
Rule.recurrenceRules = ICAL_RULES;

import { DateAdapterBase } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';
import '@rschedule/core/rules/ICAL_RULES';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';

declare module '@rschedule/core/DateAdapter' {
  interface DateAdapterType {
    momentTZ: MomentTZDateAdapter;
  }

  interface DateAdapterCTorType {
    momentTZ: typeof MomentTZDateAdapter;
  }
}

DateAdapterBase.adapter = MomentTZDateAdapter as any;
Rule.recurrenceRules = ICAL_RULES;

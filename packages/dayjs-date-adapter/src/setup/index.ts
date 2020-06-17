import { DateAdapterBase } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';
import '@rschedule/core/rules/ICAL_RULES';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
import { DayjsDateAdapter } from '@rschedule/dayjs-date-adapter';

declare module '@rschedule/core/DateAdapter' {
  interface DateAdapterType {
    dayjs: DayjsDateAdapter;
  }

  interface DateAdapterCTorType {
    dayjs: typeof DayjsDateAdapter;
  }
}

DateAdapterBase.adapter = DayjsDateAdapter as any;
Rule.recurrenceRules = ICAL_RULES;

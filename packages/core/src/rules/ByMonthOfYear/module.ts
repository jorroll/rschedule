import { IRecurrenceRuleModule, numberSortComparer, RuleOptionError } from '@rschedule/core';
import { ByDayOfMonthRuleModule } from '../ByDayOfMonth';
import { ByHourOfDayRuleModule } from '../ByHourOfDay';
import { ByMillisecondOfSecondRuleModule } from '../ByMillisecondOfSecond';
import { ByMinuteOfHourRuleModule } from '../ByMinuteOfHour';
import { BySecondOfMinuteRuleModule } from '../BySecondOfMinute';
import { FrequencyRuleModule } from '../Frequency';
import { ruleOptionFilled } from '../utilities/rule-option-filled';
import { RevByMonthOfYearRule } from './rev-rule';
import {
  ByMonthOfYearRule,
  IByMonthOfYearRuleOptions,
  INormByMonthOfYearRuleOptions,
} from './rule';

export const ByMonthOfYearRuleModule: IRecurrenceRuleModule<
  IByMonthOfYearRuleOptions,
  INormByMonthOfYearRuleOptions
> = {
  name: 'ByMonthOfYear',
  get: processor => {
    if (processor.options.byMonthOfYear === undefined) return null;
    if (processor.reverse) {
      return new RevByMonthOfYearRule(processor);
    }
    return new ByMonthOfYearRule(processor);
  },
  normalizeOptions: (options, norm) => {
    if (options.byMonthOfYear !== undefined) {
      if (!ruleOptionFilled(options.byMonthOfYear)) {
        throw new RuleOptionError('"byMonthOfYear" expects a non-empty array');
      }

      if (options.byMonthOfYear.some((num: number) => num < 1 || num > 12)) {
        throw new RuleOptionError('"byMonthOfYear" values must be `num >= 1 && num >= 12`');
      }

      norm.byMonthOfYear = options.byMonthOfYear.slice();
      norm.byMonthOfYear!.sort(numberSortComparer);
    } else if (
      !(
        ruleOptionFilled((options as any).byDayOfMonth) ||
        ruleOptionFilled((options as any).byDayOfWeek) ||
        ruleOptionFilled((options as any).byDayOfYear)
      ) &&
      options.frequency === 'YEARLY'
    ) {
      norm.byMonthOfYear = [norm.start.get('month')];
    }
  },
  deps: () => [
    FrequencyRuleModule,
    ByMonthOfYearRuleModule,
    ByDayOfMonthRuleModule,
    ByHourOfDayRuleModule,
    ByMinuteOfHourRuleModule,
    BySecondOfMinuteRuleModule,
    ByMillisecondOfSecondRuleModule,
  ],
};

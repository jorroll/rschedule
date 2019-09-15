import { IRecurrenceRuleModule, RuleOptionError } from '@rschedule/core';
import { ByHourOfDayRuleModule } from '../ByHourOfDay';
import { ByMillisecondOfSecondRuleModule } from '../ByMillisecondOfSecond';
import { ByMinuteOfHourRuleModule } from '../ByMinuteOfHour';
import { BySecondOfMinuteRuleModule } from '../BySecondOfMinute';
import { FrequencyRuleModule } from '../Frequency';
import { ruleOptionFilled } from '../utilities/rule-option-filled';
import { RevByDayOfYearRule } from './rev-rule';
import { ByDayOfYearRule, IByDayOfYearRuleOptions, INormByDayOfYearRuleOptions } from './rule';

export const ByDayOfYearRuleModule: IRecurrenceRuleModule<
  IByDayOfYearRuleOptions,
  INormByDayOfYearRuleOptions
> = {
  name: 'ByDayOfYear',
  get: processor => {
    if (processor.options.byDayOfYear === undefined) return null;
    if (processor.reverse) return new RevByDayOfYearRule(processor);
    return new ByDayOfYearRule(processor);
  },
  normalizeOptions: (options, norm) => {
    if (options.byDayOfYear !== undefined) {
      if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(options.frequency)) {
        throw new RuleOptionError(
          '"byDayOfYear" cannot be present when "frequency" is "DAILY", "WEEKLY", or "MONTHLY"',
        );
      }

      if (!ruleOptionFilled(options.byDayOfYear)) {
        throw new RuleOptionError('"byDayOfYear" expects a non-empty array');
      }

      if (options.byDayOfYear.some((num: number) => num === 0 || num < -366 || num > 366)) {
        throw new RuleOptionError(
          '"byDayOfYear" values must be `num !== 0 && num <= 366 && num >= -366`',
        );
      }

      norm.byDayOfYear = options.byDayOfYear.slice();
    }
  },
  deps: () => [
    FrequencyRuleModule,
    ByDayOfYearRuleModule,
    ByHourOfDayRuleModule,
    ByMinuteOfHourRuleModule,
    BySecondOfMinuteRuleModule,
    ByMillisecondOfSecondRuleModule,
  ],
};

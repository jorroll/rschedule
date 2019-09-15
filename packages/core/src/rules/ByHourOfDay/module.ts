import { IRecurrenceRuleModule, numberSortComparer, RuleOptionError } from '@rschedule/core';
import { ByMillisecondOfSecondRuleModule } from '../ByMillisecondOfSecond';
import { ByMinuteOfHourRuleModule } from '../ByMinuteOfHour';
import { BySecondOfMinuteRuleModule } from '../BySecondOfMinute';
import { FrequencyRuleModule } from '../Frequency';
import { ruleOptionFilled } from '../utilities/rule-option-filled';
import { RevByHourOfDayRule } from './rev-rule';
import {
  ByHourOfDayRule,
  IByHourOfDayRuleRuleOptions,
  INormByHourOfDayRuleRuleOptions,
} from './rule';

export const ByHourOfDayRuleModule: IRecurrenceRuleModule<
  IByHourOfDayRuleRuleOptions,
  INormByHourOfDayRuleRuleOptions
> = {
  name: 'ByHourOfDay',
  get: processor => {
    if (processor.options.byHourOfDay === undefined) return null;
    if (processor.reverse) return new RevByHourOfDayRule(processor);
    return new ByHourOfDayRule(processor);
  },
  normalizeOptions: (options, norm) => {
    if (options.byHourOfDay !== undefined) {
      if (!ruleOptionFilled(options.byHourOfDay)) {
        throw new RuleOptionError('"byHourOfDay" expects a non-empty array');
      }

      if (options.byHourOfDay.some(num => num < 0 || num > 23)) {
        throw new RuleOptionError('"byHourOfDay" values must be >= 0 && <= 23');
      }

      norm.byHourOfDay = options.byHourOfDay;
      norm.byHourOfDay.sort(numberSortComparer);
    } else if (['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'].includes(options.frequency)) {
      norm.byHourOfDay = [norm.start.get('hour')];
    }
  },
  deps: () => [
    FrequencyRuleModule,
    ByHourOfDayRuleModule,
    ByMinuteOfHourRuleModule,
    BySecondOfMinuteRuleModule,
    ByMillisecondOfSecondRuleModule,
  ],
};

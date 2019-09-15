import { IRecurrenceRuleModule, numberSortComparer, RuleOptionError } from '@rschedule/core';
import { ByMillisecondOfSecondRuleModule } from '../ByMillisecondOfSecond';
import { BySecondOfMinuteRuleModule } from '../BySecondOfMinute';
import { FrequencyRuleModule } from '../Frequency';
import { ruleOptionFilled } from '../utilities/rule-option-filled';
import { RevByMinuteOfHourRule } from './rev-rule';
import {
  ByMinuteOfHourRule,
  IByMinuteOfHourRuleRuleOptions,
  INormByMinuteOfHourRuleRuleOptions,
} from './rule';

export const ByMinuteOfHourRuleModule: IRecurrenceRuleModule<
  IByMinuteOfHourRuleRuleOptions,
  INormByMinuteOfHourRuleRuleOptions
> = {
  name: 'ByMinuteOfHour',
  get: processor => {
    if (processor.options.byMinuteOfHour === undefined) return null;
    if (processor.reverse) return new RevByMinuteOfHourRule(processor);
    return new ByMinuteOfHourRule(processor);
  },
  normalizeOptions: (options, norm) => {
    if (options.byMinuteOfHour !== undefined) {
      if (!ruleOptionFilled(options.byMinuteOfHour)) {
        throw new RuleOptionError('"byMinuteOfHour" expects a non-empty array');
      }

      if (options.byMinuteOfHour.some(num => num < 0 || num > 59)) {
        throw new RuleOptionError('"byMinuteOfHour" values must be >= 0 && <= 59');
      }

      norm.byMinuteOfHour = options.byMinuteOfHour;
      norm.byMinuteOfHour.sort(numberSortComparer);
    } else if (!['MINUTELY', 'SECONDLY', 'MILLISECONDLY'].includes(options.frequency)) {
      norm.byMinuteOfHour = [norm.start.get('minute')];
    }
  },
  deps: () => [
    FrequencyRuleModule,
    ByMinuteOfHourRuleModule,
    BySecondOfMinuteRuleModule,
    ByMillisecondOfSecondRuleModule,
  ],
};

import { IRecurrenceRuleModule, numberSortComparer, RuleOptionError } from '@rschedule/core';
import { FrequencyRuleModule } from '../Frequency';
import { ruleOptionFilled } from '../utilities/rule-option-filled';
import { RevByMillisecondOfSecondRule } from './rev-rule';
import {
  ByMillisecondOfSecondRule,
  IByMillisecondOfSecondRuleOptions,
  INormByMillisecondOfSecondRuleOptions,
} from './rule';

export const ByMillisecondOfSecondRuleModule: IRecurrenceRuleModule<
  IByMillisecondOfSecondRuleOptions,
  INormByMillisecondOfSecondRuleOptions
> = {
  name: 'ByMillisecondOfSecond',
  get: processor => {
    if (processor.options.byMillisecondOfSecond === undefined) return null;
    if (processor.reverse) return new RevByMillisecondOfSecondRule(processor);
    return new ByMillisecondOfSecondRule(processor);
  },
  normalizeOptions: (options, norm) => {
    if (options.byMillisecondOfSecond !== undefined) {
      if (!ruleOptionFilled(options.byMillisecondOfSecond)) {
        throw new RuleOptionError('"byMillisecondOfSecond" expects a non-empty array');
      }

      if (options.byMillisecondOfSecond.some(num => num < 0 || num > 999)) {
        throw new RuleOptionError('"byMillisecondOfSecond" values must be >= 0 && <= 999');
      }

      norm.byMillisecondOfSecond = options.byMillisecondOfSecond;
      norm.byMillisecondOfSecond.sort(numberSortComparer);
    } else if (options.frequency !== 'MILLISECONDLY') {
      norm.byMillisecondOfSecond = [norm.start.get('millisecond')];
    }
  },
  deps: () => [FrequencyRuleModule, ByMillisecondOfSecondRuleModule],
};

import { IRecurrenceRuleModule, numberSortComparer, RuleOptionError } from '@rschedule/core';
import { ByMillisecondOfSecondRuleModule } from '../ByMillisecondOfSecond';
import { FrequencyRuleModule } from '../Frequency';
import { RevBySecondOfMinuteRule } from './rev-rule';
import {
  BySecondOfMinuteRule,
  IBySecondOfMinuteRuleOptions,
  INormBySecondOfMinuteRuleOptions,
} from './rule';

export const BySecondOfMinuteRuleModule: IRecurrenceRuleModule<
  IBySecondOfMinuteRuleOptions,
  INormBySecondOfMinuteRuleOptions
> = {
  name: 'BySecondOfMinute',
  get: processor => {
    if (processor.options.bySecondOfMinute === undefined) return null;
    if (processor.reverse) return new RevBySecondOfMinuteRule(processor);
    return new BySecondOfMinuteRule(processor);
  },
  normalizeOptions: (options, norm) => {
    if (options.bySecondOfMinute !== undefined) {
      if (!Array.isArray(options.bySecondOfMinute)) {
        throw new RuleOptionError('"bySecondOfMinute" expects an array');
      }

      if (options.bySecondOfMinute.some(num => num < 0 || num > 60)) {
        throw new RuleOptionError('"bySecondOfMinute" values must be >= 0 && <= 60');
      }

      norm.bySecondOfMinute = options.bySecondOfMinute;
      norm.bySecondOfMinute.sort(numberSortComparer);
    } else if (!['SECONDLY', 'MILLISECONDLY'].includes(options.frequency)) {
      norm.bySecondOfMinute = [norm.start.get('second')];
    }
  },
  deps: () => [FrequencyRuleModule, BySecondOfMinuteRuleModule, ByMillisecondOfSecondRuleModule],
};

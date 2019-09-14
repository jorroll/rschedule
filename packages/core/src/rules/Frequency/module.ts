import { DateAdapter, IRecurrenceRuleModule, RuleOptionError } from '@rschedule/core';
import { RevFrequencyRule } from './rev-rule';
import { FrequencyRule, IFrequencyRuleOptions, INormFrequencyRuleOptions } from './rule';

const FREQUENCIES = [
  'MILLISECONDLY',
  'SECONDLY',
  'MINUTELY',
  'HOURLY',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
];

export const FrequencyRuleModule: IRecurrenceRuleModule<
  IFrequencyRuleOptions,
  INormFrequencyRuleOptions
> = {
  name: 'FrequencyRule',
  get: processor => {
    if (
      (processor.options as any).byMillisecondOfSecond !== undefined ||
      processor.options.frequency !== 'MILLISECONDLY'
    ) {
      return null;
    }

    if (processor.reverse) return new RevFrequencyRule(processor, processor.end!);
    return new FrequencyRule(processor, processor.start);
  },
  normalizeOptions: (options, norm) => {
    if (!FREQUENCIES.includes(options.frequency)) {
      throw new RuleOptionError(`"frequency" must be one of ${JSON.stringify(FREQUENCIES)}`);
    }

    if (options.interval !== undefined) {
      if (!Number.isInteger(options.interval)) {
        throw new RuleOptionError('"interval" expects a whole number');
      }

      if (options.interval < 1) {
        throw new RuleOptionError('"interval" cannot be less than 1');
      }
    }

    if (options.weekStart !== undefined) {
      if (!DateAdapter.WEEKDAYS.includes(options.weekStart)) {
        throw new RuleOptionError(
          `"weekStart" must be one of ${JSON.stringify(DateAdapter.WEEKDAYS)}`,
        );
      }
    }

    norm.frequency = options.frequency;
    norm.interval = options.interval || 1;
    norm.weekStart = options.weekStart || 'MO';
  },
  deps: () => [FrequencyRuleModule],
};

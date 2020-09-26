import { IRecurrenceRulesIterator, RecurrenceRuleResult } from '@rschedule/core';
import { FrequencyRule, INormFrequencyRuleOptions, RevFrequencyRule } from '../Frequency';
import { RecurrenceRule } from './recurrence-rule';

const freqCache = new WeakMap<object, FrequencyRule | RevFrequencyRule>();

export abstract class RecurrenceRuleBase<
  T extends INormFrequencyRuleOptions
> extends RecurrenceRule<T> {
  protected frequency: FrequencyRule;

  constructor(processor: IRecurrenceRulesIterator<T>) {
    super(processor);

    if (!freqCache.has(this.processor)) {
      freqCache.set(this.processor, new FrequencyRule(processor, processor.start));
    }

    this.frequency = freqCache.get(this.processor) as FrequencyRule;
  }

  protected validateDate(arg: RecurrenceRuleResult): RecurrenceRuleResult {
    return this.frequency.validateDate(arg);
  }
}

export abstract class RevRecurrenceRuleBase<
  T extends INormFrequencyRuleOptions
> extends RecurrenceRule<T> {
  protected frequency: RevFrequencyRule;

  constructor(processor: IRecurrenceRulesIterator<T>) {
    super(processor);

    if (!freqCache.has(this.processor)) {
      freqCache.set(this.processor, new RevFrequencyRule(processor, processor.end!));
    }

    this.frequency = freqCache.get(this.processor) as RevFrequencyRule;
  }

  protected validateDate(arg: RecurrenceRuleResult): RecurrenceRuleResult {
    return this.frequency.validateDate(arg);
  }
}

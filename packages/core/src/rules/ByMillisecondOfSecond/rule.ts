import { DateAdapter, RuleOption } from '@rschedule/core';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import ByTimeOfUnitRule from '../utilities/by-time-of-unit';

declare module '../../recurrence-rule-options' {
  namespace RuleOption {
    type ByMillisecondOfSecond = DateAdapter.Millisecond;
  }

  interface IRuleOptions extends IByMillisecondOfSecondRuleOptions {}

  interface INormRuleOptions extends INormByMillisecondOfSecondRuleOptions {}
}

export interface IByMillisecondOfSecondRuleOptions extends IFrequencyRuleOptions {
  byMillisecondOfSecond?: RuleOption.ByMillisecondOfSecond[];
}

export interface INormByMillisecondOfSecondRuleOptions extends INormFrequencyRuleOptions {
  byMillisecondOfSecond?: RuleOption.ByMillisecondOfSecond[];
}

export class ByMillisecondOfSecondRule extends ByTimeOfUnitRule<
  INormByMillisecondOfSecondRuleOptions
> {
  protected readonly baseGranularity = 'second' as DateAdapter.TimeUnit;
  protected readonly granularity = 'millisecond' as DateAdapter.TimeUnit;
  protected readonly option = this.options.byMillisecondOfSecond!;
}

import { DateAdapter, RuleOption } from '@rschedule/core';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import ByTimeOfUnitRule from '../utilities/by-time-of-unit';

declare module '../../recurrence-rule-options' {
  namespace RuleOption {
    type BySecondOfMinute = DateAdapter.Second;
  }

  interface IRuleOptions extends IBySecondOfMinuteRuleOptions {}

  interface INormRuleOptions extends INormBySecondOfMinuteRuleOptions {}
}

export interface IBySecondOfMinuteRuleOptions extends IFrequencyRuleOptions {
  bySecondOfMinute?: RuleOption.BySecondOfMinute[];
}

export interface INormBySecondOfMinuteRuleOptions extends INormFrequencyRuleOptions {
  bySecondOfMinute?: RuleOption.BySecondOfMinute[];
}

export class BySecondOfMinuteRule extends ByTimeOfUnitRule<INormBySecondOfMinuteRuleOptions> {
  protected readonly baseGranularity: DateAdapter.TimeUnit = 'minute';
  protected readonly granularity: DateAdapter.TimeUnit = 'second';
  protected readonly option: DateAdapter.Minute[] = this.options.bySecondOfMinute!;
}

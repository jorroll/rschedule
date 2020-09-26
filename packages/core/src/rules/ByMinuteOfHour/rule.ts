import { DateAdapter, RuleOption } from '@rschedule/core';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import ByTimeOfUnitRule from '../utilities/by-time-of-unit';

declare module '../../recurrence-rule-options' {
  namespace RuleOption {
    type ByMinuteOfHour = DateAdapter.Minute;
  }

  interface IRuleOptions extends IByMinuteOfHourRuleRuleOptions {}

  interface INormRuleOptions extends INormByMinuteOfHourRuleRuleOptions {}
}

export interface IByMinuteOfHourRuleRuleOptions extends IFrequencyRuleOptions {
  byMinuteOfHour?: RuleOption.ByMinuteOfHour[];
}

export interface INormByMinuteOfHourRuleRuleOptions extends INormFrequencyRuleOptions {
  byMinuteOfHour?: RuleOption.ByMinuteOfHour[];
}

export class ByMinuteOfHourRule extends ByTimeOfUnitRule<INormByMinuteOfHourRuleRuleOptions> {
  protected readonly baseGranularity: DateAdapter.TimeUnit = 'hour' as DateAdapter.TimeUnit;
  protected readonly granularity: DateAdapter.TimeUnit = 'minute' as DateAdapter.TimeUnit;
  protected readonly option: DateAdapter.Minute[] = this.options.byMinuteOfHour!;
}

import { DateAdapter, RuleOption } from '@rschedule/core';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import ByTimeOfUnitRule from '../utilities/by-time-of-unit';

declare module '../../recurrence-rule-options' {
  namespace RuleOption {
    type ByHourOfDay = DateAdapter.Hour;
  }

  interface IRuleOptions extends IByHourOfDayRuleRuleOptions {}

  interface INormRuleOptions extends INormByHourOfDayRuleRuleOptions {}
}

export interface IByHourOfDayRuleRuleOptions extends IFrequencyRuleOptions {
  byHourOfDay?: RuleOption.ByHourOfDay[];
}

export interface INormByHourOfDayRuleRuleOptions extends INormFrequencyRuleOptions {
  byHourOfDay?: RuleOption.ByHourOfDay[];
}

export class ByHourOfDayRule extends ByTimeOfUnitRule<INormByHourOfDayRuleRuleOptions> {
  protected readonly baseGranularity: DateAdapter.TimeUnit = 'day';
  protected readonly granularity: DateAdapter.TimeUnit = 'hour';
  protected readonly option: DateAdapter.Hour[] = this.options.byHourOfDay!;
}

import { DateAdapter, RuleOption } from '@rschedule/core';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import ByTimeOfUnitRule from '../utilities/by-time-of-unit';

declare module '@rschedule/core' {
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
  protected readonly baseGranularity = 'day' as DateAdapter.TimeUnit;
  protected readonly granularity = 'hour' as DateAdapter.TimeUnit;
  protected readonly option = this.options.byHourOfDay!;
}

import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormByHourOfDayRuleRuleOptions } from './rule';

export class RevByHourOfDayRule extends RevByTimeOfUnitRule<INormByHourOfDayRuleRuleOptions> {
  protected readonly baseGranularity: DateAdapter.TimeUnit = 'day';
  protected readonly granularity: DateAdapter.TimeUnit = 'hour';
  protected readonly option: DateAdapter.Hour[] = this.options.byHourOfDay!.slice().reverse();
}

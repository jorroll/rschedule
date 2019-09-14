import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormByHourOfDayRuleRuleOptions } from './rule';

export class RevByHourOfDayRule extends RevByTimeOfUnitRule<INormByHourOfDayRuleRuleOptions> {
  protected readonly baseGranularity = 'day' as DateAdapter.TimeUnit;
  protected readonly granularity = 'hour' as DateAdapter.TimeUnit;
  protected readonly option = this.options.byHourOfDay!.slice().reverse();
}

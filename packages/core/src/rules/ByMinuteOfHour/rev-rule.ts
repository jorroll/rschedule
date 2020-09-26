import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormByMinuteOfHourRuleRuleOptions } from './rule';

export class RevByMinuteOfHourRule extends RevByTimeOfUnitRule<INormByMinuteOfHourRuleRuleOptions> {
  protected readonly baseGranularity: DateAdapter.TimeUnit = 'hour' as DateAdapter.TimeUnit;
  protected readonly granularity: DateAdapter.TimeUnit = 'minute' as DateAdapter.TimeUnit;
  protected readonly option: DateAdapter.Minute[] = this.options.byMinuteOfHour!.slice().reverse();
}

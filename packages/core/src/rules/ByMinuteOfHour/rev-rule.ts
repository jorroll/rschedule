import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormByMinuteOfHourRuleRuleOptions } from './rule';

export class RevByMinuteOfHourRule extends RevByTimeOfUnitRule<INormByMinuteOfHourRuleRuleOptions> {
  protected readonly baseGranularity = 'hour' as DateAdapter.TimeUnit;
  protected readonly granularity = 'minute' as DateAdapter.TimeUnit;
  protected readonly option = this.options.byMinuteOfHour!.slice().reverse();
}

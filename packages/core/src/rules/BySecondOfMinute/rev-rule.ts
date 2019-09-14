import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormBySecondOfMinuteRuleOptions } from './rule';

export class RevBySecondOfMinuteRule extends RevByTimeOfUnitRule<INormBySecondOfMinuteRuleOptions> {
  protected readonly baseGranularity = 'minute' as DateAdapter.TimeUnit;
  protected readonly granularity = 'second' as DateAdapter.TimeUnit;
  protected readonly option = this.options.bySecondOfMinute!.slice().reverse();
}

import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormBySecondOfMinuteRuleOptions } from './rule';

export class RevBySecondOfMinuteRule extends RevByTimeOfUnitRule<INormBySecondOfMinuteRuleOptions> {
  protected readonly baseGranularity: DateAdapter.TimeUnit = 'minute';
  protected readonly granularity: DateAdapter.TimeUnit = 'second';
  protected readonly option: DateAdapter.Minute[] = this.options
    .bySecondOfMinute!.slice()
    .reverse();
}

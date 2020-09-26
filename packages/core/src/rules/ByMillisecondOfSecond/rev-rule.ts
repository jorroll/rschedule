import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormByMillisecondOfSecondRuleOptions } from './rule';

export class RevByMillisecondOfSecondRule extends RevByTimeOfUnitRule<
  INormByMillisecondOfSecondRuleOptions
> {
  protected readonly baseGranularity: DateAdapter.TimeUnit = 'second';
  protected readonly granularity: DateAdapter.TimeUnit = 'millisecond';
  protected readonly option: number[] = this.options.byMillisecondOfSecond!.slice().reverse();
}

import { DateAdapter } from '@rschedule/core';
import RevByTimeOfUnitRule from '../utilities/rev-by-time-of-unit';
import { INormByMillisecondOfSecondRuleOptions } from './rule';

export class RevByMillisecondOfSecondRule extends RevByTimeOfUnitRule<
  INormByMillisecondOfSecondRuleOptions
> {
  protected readonly baseGranularity = 'second' as DateAdapter.TimeUnit;
  protected readonly granularity = 'millisecond' as DateAdapter.TimeUnit;
  protected readonly option = this.options.byMillisecondOfSecond!.slice().reverse();
}

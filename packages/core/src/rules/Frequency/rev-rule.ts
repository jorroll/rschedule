import { DateTime } from '@rschedule/core';
import { FrequencyRule, intervalDifferenceBetweenDates } from './rule';

export class RevFrequencyRule extends FrequencyRule {
  protected setToCurrentInterval(): DateTime {
    return this.intervalEndDate.subtract(1, 'millisecond');
  }

  protected intervalDifference(date: DateTime): number {
    return intervalDifferenceBetweenDates({
      first: this.firstIntervalStartDate,
      second: date,
      unit: this.intervalUnit,
      interval: this.options.interval,
      weekStart: this.options.weekStart,
      direction: 'before',
    });
  }
}

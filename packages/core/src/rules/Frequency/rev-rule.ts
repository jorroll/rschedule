import { DateTime } from '@rschedule/core';
import { FrequencyRule, intervalDifferenceBetweenDates } from './rule';

export class RevFrequencyRule extends FrequencyRule {
  protected setToCurrentInterval() {
    return this.intervalEndDate.subtract(1, 'millisecond');
  }

  protected intervalDifference(date: DateTime) {
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

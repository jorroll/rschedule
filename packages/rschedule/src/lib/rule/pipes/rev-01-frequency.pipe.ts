import { freqToGranularity } from '../../basic-utilities';
import { DateTime, IDateAdapter } from '../../date-time';
import { IFrequencyRuleOptions, intervalDifferenceBetweenDates } from './01-frequency.pipe';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

/**
 * The `RevFrequencyPipe` is the first pipe in the chain of rule pipes. It is
 * responsible for incrementing the date, as appropriate, while taking into
 * account the `RRULE` frequency and interval.
 */
export class RevFrequencyPipe extends PipeRule<IFrequencyRuleOptions>
  implements IPipeRule<IFrequencyRuleOptions> {
  private readonly intervalUnit = freqToGranularity(this.options.frequency);

  private intervalEndDate = this.normalizedEndDate(this.end!);
  private intervalStartDate = this.normalizedStartDate(this.intervalEndDate);

  run(args: IPipeRunFn) {
    let date: DateTime = args.date;

    // if a date is invalid, skipToDate will always be present
    // skipToDate may also be passed by a user on an otherwise valid date
    if (args.skipToDate) {
      date = args.skipToDate;

      this.skipToIntervalOnOrBefore(date);

      if (!this.dateIsWithinInterval(date)) {
        // this only applies when the interval is not 1
        date = this.intervalEndDate;
      }
    } else if (
      this.dateIsWithinInterval(date) &&
      this.dateIsWithinInterval(date.subtract(1, 'millisecond'))
    ) {
      date = date.subtract(1, 'millisecond');
    } else {
      this.decrementInterval(this.options.interval);

      date = this.intervalEndDate;
    }

    return this.nextPipe.run({ date });
  }

  private normalizedEndDate(date: DateTime) {
    if (this.options.frequency === 'WEEKLY') {
      return date.endGranularity('week', { weekStart: this.options.weekStart });
    }

    return date.endGranularity(this.intervalUnit as IDateAdapter.TimeUnit);
  }

  private normalizedStartDate(start: DateTime) {
    switch (this.options.frequency) {
      case 'YEARLY':
        return start.subtract(1, 'year');
      case 'MONTHLY':
        return start.subtract(1, 'month');
      case 'WEEKLY':
        return start.subtract(1, 'week');
      case 'DAILY':
        return start.subtract(1, 'day');
      case 'HOURLY':
        return start.subtract(1, 'hour');
      case 'MINUTELY':
        return start.subtract(1, 'minute');
      case 'SECONDLY':
        return start.subtract(1, 'second');
      case 'MILLISECONDLY':
        return start.subtract(1, 'millisecond');
    }
  }

  private decrementInterval(amount: number) {
    this.intervalEndDate = this.normalizedEndDate(
      this.intervalEndDate.subtract(amount, this.intervalUnit),
    );

    this.intervalStartDate = this.normalizedStartDate(this.intervalEndDate);
  }

  private skipToIntervalOnOrBefore(date: DateTime) {
    this.decrementInterval(
      intervalDifferenceBetweenDates({
        first: date,
        second: this.intervalEndDate,
        unit: this.intervalUnit,
        interval: this.options.interval,
        weekStart: this.options.weekStart,
      }),
    );
  }

  private dateIsWithinInterval(date: DateTime) {
    return this.intervalEndDate.isAfterOrEqual(date) && this.intervalStartDate.isBefore(date);
  }
}

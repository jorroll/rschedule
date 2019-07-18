import { freqToGranularity } from '../../basic-utilities';
import { DateTime, IDateAdapter } from '../../date-time';
import { INormalizedRuleOptions } from '../rule-options';
import { intervalDifferenceBetweenDates } from './01-frequency.pipe';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

type RevFrequencyOptions = Pick<INormalizedRuleOptions, 'frequency' | 'interval' | 'weekStart'>;

/**
 * The `RevFrequencyPipe` is the first pipe in the chain of rule pipes. It is
 * responsible for incrementing the date, as appropriate, while taking into
 * account the `RRULE` frequency and interval.
 */
export class RevFrequencyPipe extends PipeRule<RevFrequencyOptions>
  implements IPipeRule<RevFrequencyOptions> {
  private readonly intervalUnit = freqToGranularity(this.options.frequency);

  private intervalEndDate = this.normalizedEndDate(this.end!);
  private intervalStartDate = this.normalizedStartDate(this.intervalEndDate);

  /**
   * The problem is that DateTime is ignoring daylight savings time.
   *
   * When you pass in a new "skip to date" that date has been adjusted for
   * daylight savings and the pipe thinks it is invalid
   */

  run(args: IPipeRunFn) {
    let date: DateTime = args.date;

    if (args.invalidDate) {
      date = args.skipToDate!;

      this.skipToIntervalOnOrBefore(date);

      if (!this.dateIsWithinInterval(date)) {
        date = this.intervalEndDate;
      }
    } else if (args.skipToDate) {
      this.skipToIntervalOnOrBefore(args.skipToDate);

      date = this.dateIsWithinInterval(args.skipToDate) ? args.skipToDate : this.intervalEndDate;
    } else if (
      this.dateIsWithinInterval(date) &&
      this.dateIsWithinInterval(date.subtract(1, 'second'))
    ) {
      date = date.subtract(1, 'second');
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
    }
  }

  private decrementInterval(amount: number) {
    this.intervalEndDate = this.intervalEndDate.subtract(amount, this.intervalUnit);
    this.intervalStartDate = this.normalizedStartDate(this.intervalEndDate);
  }

  private skipToIntervalOnOrBefore(date: DateTime) {
    this.decrementInterval(
      intervalDifferenceBetweenDates({
        first: date,
        second: this.intervalEndDate,
        unit: this.intervalUnit,
        interval: this.options.interval,
      }),
    );
  }

  private dateIsWithinInterval(date: DateTime) {
    return this.intervalEndDate.isAfterOrEqual(date) && this.intervalStartDate.isBefore(date);
  }
}

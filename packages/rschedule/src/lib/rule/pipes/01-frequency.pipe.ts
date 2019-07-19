import { freqToGranularity } from '../../basic-utilities';
import {
  DateTime,
  IDateAdapter,
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_HOUR,
  MILLISECONDS_IN_MINUTE,
  MILLISECONDS_IN_SECOND,
  MILLISECONDS_IN_WEEK,
} from '../../date-time';
import { RuleOption } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

export interface IFrequencyRuleOptions {
  frequency: RuleOption.Frequency;
  interval: RuleOption.Interval;
  weekStart: RuleOption.WeekStart;
}

/**
 * The `FrequencyPipe` is the first pipe in the chain of rule pipes. It is
 * responsible for incrementing the date, as appropriate, while taking into
 * account the `RRULE` frequency and interval.
 */
export class FrequencyPipe extends PipeRule<IFrequencyRuleOptions>
  implements IPipeRule<IFrequencyRuleOptions> {
  private readonly intervalUnit = freqToGranularity(this.options.frequency);

  private intervalStartDate = this.normalizedStartDate(this.start);
  private intervalEndDate = this.normalizedEndDate(this.intervalStartDate);

  run(args: IPipeRunFn) {
    let date: DateTime = args.date;

    // if a date is invalid, skipToDate will always be present
    // skipToDate may also be passed by a user on an otherwise valid date
    if (args.skipToDate) {
      date = args.skipToDate;

      this.skipToIntervalOnOrAfter(date);

      if (!this.dateIsWithinInterval(date)) {
        // this only applies when the interval is not 1
        date = this.intervalStartDate;
      }
    } else if (
      this.dateIsWithinInterval(date) &&
      this.dateIsWithinInterval(date.add(1, 'millisecond'))
    ) {
      date = date.add(1, 'millisecond');
    } else {
      this.incrementInterval(this.options.interval);

      date = this.intervalStartDate;
    }

    return this.nextPipe.run({ date });
  }

  private normalizedStartDate(date: DateTime) {
    if (this.options.frequency === 'WEEKLY') {
      return date.granularity('week', { weekStart: this.options.weekStart });
    }

    return date.granularity(this.intervalUnit as IDateAdapter.TimeUnit);
  }

  private normalizedEndDate(start: DateTime) {
    switch (this.options.frequency) {
      case 'YEARLY':
        return start.add(1, 'year');
      case 'MONTHLY':
        return start.add(1, 'month');
      case 'WEEKLY':
        return start.add(1, 'week');
      case 'DAILY':
        return start.add(1, 'day');
      case 'HOURLY':
        return start.add(1, 'hour');
      case 'MINUTELY':
        return start.add(1, 'minute');
      case 'SECONDLY':
        return start.add(1, 'second');
      case 'MILLISECONDLY':
        return start.add(1, 'millisecond');
    }
  }

  private incrementInterval(amount: number) {
    this.intervalStartDate = this.normalizedStartDate(
      this.intervalStartDate.add(amount, this.intervalUnit),
    );

    this.intervalEndDate = this.normalizedEndDate(this.intervalStartDate);
  }

  private skipToIntervalOnOrAfter(date: DateTime) {
    this.incrementInterval(
      intervalDifferenceBetweenDates({
        first: this.intervalStartDate,
        second: date,
        unit: this.intervalUnit,
        interval: this.options.interval,
        weekStart: this.options.weekStart,
      }),
    );
  }

  private dateIsWithinInterval(date: DateTime) {
    return this.intervalStartDate.isBeforeOrEqual(date) && this.intervalEndDate.isAfter(date);
  }
}

/**
 * Given the frequency (unit) and interval, this function finds
 * how many jumps forward the first date needs in order to equal
 * or exceed the second date.
 *
 * For example:
 *
 * 1. Unit is daily and interval is 1. The second date is 3 days
 *    after the first. This will return 3.
 * 2. Unit is yearly and interval is 1. The second date is 3 days
 *    after the first. This will return 0.
 * 3. Unit is yearly and interval is 3. The second date is 4 years
 *    after the first. This will return 6.
 */
export function intervalDifferenceBetweenDates({
  first,
  second,
  unit,
  interval,
  weekStart,
}: {
  first: DateTime;
  second: DateTime;
  unit: IDateAdapter.TimeUnit | 'week';
  interval: number;
  weekStart: IDateAdapter.Weekday;
}) {
  let difference = (() => {
    let intervalDuration: number;

    switch (unit) {
      case 'year':
        let years = (second.get('year') - first.get('year')) * 12;
        years = years + second.get('month') - first.get('month');
        return Math.floor(years / 12);
      case 'month':
        let months = (second.get('year') - first.get('year')) * 12;
        months = months + second.get('month') - first.get('month');
        return months;
      case 'week':
        first = first.granularity('week', { weekStart });
        intervalDuration = MILLISECONDS_IN_WEEK;
        break;
      case 'day':
        intervalDuration = MILLISECONDS_IN_DAY;
        break;
      case 'hour':
        intervalDuration = MILLISECONDS_IN_HOUR;
        break;
      case 'minute':
        intervalDuration = MILLISECONDS_IN_MINUTE;
        break;
      case 'second':
        intervalDuration = MILLISECONDS_IN_SECOND;
        break;
      case 'millisecond':
        intervalDuration = 1;
        break;
      default:
        throw new Error('Unexpected `unit` value');
    }

    const diff = second.valueOf() - first.valueOf();

    const sign = Math.sign(diff);

    return Math.floor(Math.abs(diff) / intervalDuration) * sign;
  })();

  if (difference > 0 && difference < interval) {
    difference = interval;
  } else if (difference > interval) {
    difference = Math.ceil(difference / interval) * interval;
  }

  return difference;
}

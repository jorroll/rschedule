import {
  DateAdapter,
  DateTime,
  freqToGranularity,
  INormRuleOptionsBase,
  InvalidDateTime,
  IRecurrenceRulesIterator,
  IRuleOptionsBase,
  RecurrenceRuleResult,
  RuleOption,
  ValidDateTime,
} from '@rschedule/core';

import { RecurrenceRule } from '../utilities/recurrence-rule';

declare module '@rschedule/core' {
  namespace RuleOption {
    type Frequency =
      | 'MILLISECONDLY'
      | 'SECONDLY'
      | 'MINUTELY'
      | 'HOURLY'
      | 'DAILY'
      | 'WEEKLY'
      | 'MONTHLY'
      | 'YEARLY';
    type Interval = number;
    type WeekStart = DateAdapter.Weekday;
  }

  interface IRuleOptions extends IFrequencyRuleOptions {}

  interface INormRuleOptions extends INormFrequencyRuleOptions {}
}

export interface IFrequencyRuleOptions extends IRuleOptionsBase {
  frequency: RuleOption.Frequency;
  interval?: RuleOption.Interval;
  weekStart?: RuleOption.WeekStart;
}

export interface INormFrequencyRuleOptions extends INormRuleOptionsBase {
  frequency: RuleOption.Frequency;
  interval: RuleOption.Interval;
  weekStart: RuleOption.WeekStart;
}

export class FrequencyRule extends RecurrenceRule<INormFrequencyRuleOptions> {
  protected readonly intervalUnit = freqToGranularity(this.options.frequency);

  protected firstIntervalStartDate: DateTime;
  protected intervalStartDate: DateTime;
  protected intervalEndDate: DateTime;

  constructor(
    processor: IRecurrenceRulesIterator<INormFrequencyRuleOptions>,
    protected initDate: DateTime,
  ) {
    super(processor);

    this.firstIntervalStartDate = this.normalizedStartDate(this.options.start);
    this.intervalStartDate = this.firstIntervalStartDate;
    this.intervalEndDate = this.normalizedEndDate(this.firstIntervalStartDate);

    this.skipToInterval(this.initDate);
  }

  run(date: DateTime) {
    return this.validateDate(new ValidDateTime(date));
  }

  validateDate(arg: RecurrenceRuleResult) {
    const { date } = arg;

    if (arg instanceof ValidDateTime && this.dateIsWithinInterval(date)) {
      return arg;
    }

    this.skipToInterval(date);

    return new InvalidDateTime(
      // if the interval is 1, date will always be within the interval
      this.dateIsWithinInterval(date) ? date : this.setToCurrentInterval(),
    );
  }

  protected setToCurrentInterval() {
    return this.intervalStartDate;
  }

  protected normalizedStartDate(date: DateTime) {
    if (this.options.frequency === 'WEEKLY') {
      return date.granularity('week', { weekStart: this.options.weekStart });
    }

    return date.granularity(this.intervalUnit as DateAdapter.TimeUnit);
  }

  protected normalizedEndDate(start: DateTime) {
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
      default:
        throw new Error(`Unknown frequency ${this.options.frequency}`);
    }
  }

  protected skipToInterval(date: DateTime) {
    const amount = this.intervalDifference(date);

    this.intervalStartDate = this.firstIntervalStartDate.add(amount, this.intervalUnit);

    this.intervalEndDate = this.normalizedEndDate(this.intervalStartDate);
  }

  protected dateIsWithinInterval(date: DateTime) {
    return this.intervalStartDate.isBeforeOrEqual(date) && this.intervalEndDate.isAfter(date);
  }

  protected intervalDifference(date: DateTime) {
    return intervalDifferenceBetweenDates({
      first: this.firstIntervalStartDate,
      second: date,
      unit: this.intervalUnit,
      interval: this.options.interval,
      weekStart: this.options.weekStart,
      direction: 'after',
    });
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
  direction,
}: {
  first: DateTime;
  second: DateTime;
  unit: DateAdapter.TimeUnit | 'week';
  interval: number;
  weekStart: DateAdapter.Weekday;
  direction: 'after' | 'before';
}) {
  let difference = (() => {
    let intervalDuration: number;
    let months: number;

    switch (unit) {
      case 'year':
        months = (second.get('year') - first.get('year')) * 12;
        months = months + second.get('month') - first.get('month');
        return Math.floor(months / 12);
      case 'month':
        months = (second.get('year') - first.get('year')) * 12;
        months = months + second.get('month') - first.get('month');
        return months;
      case 'week':
        first = first.granularity('week', { weekStart });
        intervalDuration = DateAdapter.MILLISECONDS_IN_WEEK;
        break;
      case 'day':
        intervalDuration = DateAdapter.MILLISECONDS_IN_DAY;
        break;
      case 'hour':
        intervalDuration = DateAdapter.MILLISECONDS_IN_HOUR;
        break;
      case 'minute':
        intervalDuration = DateAdapter.MILLISECONDS_IN_MINUTE;
        break;
      case 'second':
        intervalDuration = DateAdapter.MILLISECONDS_IN_SECOND;
        break;
      case 'millisecond':
        intervalDuration = 1;
        break;
      default:
        throw new Error('Unexpected `unit` value');
    }

    const diff = second.valueOf() - first.valueOf();

    return Math.floor(diff / intervalDuration);
  })();

  const fn = direction === 'after' ? Math.ceil : Math.floor;

  difference = fn(difference / interval) * interval;

  return difference;
}

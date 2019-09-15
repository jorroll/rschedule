import {
  DateAdapter,
  DateTime,
  dateTimeSortComparer,
  InvalidDateTime,
  RecurrenceRuleError,
  RuleOption,
  uniqDateTimes,
  ValidDateTime,
} from '@rschedule/core';
import '../ByMonthOfYear/types';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import getNextWeekday from '../utilities/get-next-weekday';
import getNthWeekdayOfMonth from '../utilities/get-nth-weekday-of-month';
import getNthWeekdayOfYear from '../utilities/get-nth-weekday-of-year';
import { RecurrenceRuleBase } from '../utilities/recurrence-rule-base';
import './types';

declare module '../../recurrence-rule-options' {
  interface IRuleOptions extends IByDayOfWeekRuleOptions {}

  interface INormRuleOptions extends INormByDayOfWeekRuleOptions {}
}

export interface IByDayOfWeekRuleOptions extends IFrequencyRuleOptions {
  byDayOfWeek?: RuleOption.ByDayOfWeek[];
}

export interface INormByDayOfWeekRuleOptions extends INormFrequencyRuleOptions {
  byDayOfWeek?: RuleOption.ByDayOfWeek[];
  byMonthOfYear?: RuleOption.ByMonthOfYear[];
}

export class ByDayOfWeekRule extends RecurrenceRuleBase<INormByDayOfWeekRuleOptions> {
  run(date: DateTime) {
    if (this.options.frequency === 'YEARLY') {
      return this.options.byMonthOfYear === undefined
        ? this.expandYearly(date)
        : this.expandMonthly(date);
    } else if (this.options.frequency === 'MONTHLY') {
      return this.expandMonthly(date);
    }

    return this.expand(date);
  }

  private expandYearly(date: DateTime) {
    let next: DateTime | undefined = getNextWeekdaysOfYear(date, this.options.byDayOfWeek!)[0];

    let index = 0;
    let base = date;

    // If we can't find a valid date this year,
    // search next year. Only search the next 28 years.
    // (the calendar repeats on a 28 year cycle, according
    // to the internet).
    while (!next && index < 28) {
      index++;
      base = base.granularity('year').add(1, 'year');
      next = getNextWeekdaysOfYear(base, this.options.byDayOfWeek!)[0];
    }

    if (!next) {
      throw new RecurrenceRuleError(
        'The byDayOfWeek rule appears to contain an impossible combination',
      );
    }

    return this.result(date, next);
  }

  private expandMonthly(date: DateTime) {
    let next: DateTime | undefined = getNextWeekdaysOfMonth(date, this.options.byDayOfWeek!)[0];

    let index = 0;
    let base = date;

    // TODO: performance improvment
    // If, in the first year, a match isn't found, we should be able to
    // jumpt to the next leap year and check that. Or, if already on
    // a leap year, we can just error immediately.

    // If we can't find a valid date this month,
    // search the next month. Only search the next 4 years
    // (to account for leap year).
    while (!next && index < 50) {
      index++;
      base = base.granularity('month').add(1, 'month');
      next = getNextWeekdaysOfMonth(base, this.options.byDayOfWeek!)[0];
    }

    if (!next) {
      throw new RecurrenceRuleError(
        'The byDayOfWeek rule appears to contain an impossible combination',
      );
    }

    return this.result(date, next);
  }

  private expand(date: DateTime) {
    const next = this.options
      .byDayOfWeek!.map(weekday => getNextWeekday(date, weekday as DateAdapter.Weekday))
      .sort(dateTimeSortComparer)[0];

    return this.result(date, next);
  }

  private result(date: DateTime, next: DateTime) {
    if (next.isEqual(date)) {
      return this.validateDate(new ValidDateTime(date));
    }

    return this.validateDate(new InvalidDateTime(next.granularity('day')));
  }
}

/** For each byDayOfWeek entry, find the next DateTime */
export function getNextWeekdaysOfYear(date: DateTime, byDayOfWeek: RuleOption.ByDayOfWeek[]) {
  const normalizedNthWeekdaysOfYear = byDayOfWeek
    .filter(entry => Array.isArray(entry))
    .map(entry => getNthWeekdayOfYear(date, ...(entry as [DateAdapter.Weekday, number])));

  const normalizedNextWeekdays = byDayOfWeek
    .filter(entry => typeof entry === 'string')
    .map(weekday => getNextWeekday(date, weekday as DateAdapter.Weekday))
    .filter(entry => entry.get('year') === date.get('year'));

  return uniqDateTimes([...normalizedNthWeekdaysOfYear, ...normalizedNextWeekdays])
    .filter(entry => entry.isAfterOrEqual(date))
    .sort(dateTimeSortComparer);
}

/** For each byDayOfWeek entry, find the next DateTime */
export function getNextWeekdaysOfMonth(date: DateTime, byDayOfWeek: RuleOption.ByDayOfWeek[]) {
  const normalizedNthWeekdaysOfMonth = byDayOfWeek
    .filter(entry => Array.isArray(entry))
    .map(entry => getNthWeekdayOfMonth(date, ...(entry as [DateAdapter.Weekday, number])));

  const normalizedNextWeekdays = byDayOfWeek
    .filter(entry => typeof entry === 'string')
    .map(weekday => getNextWeekday(date, weekday as DateAdapter.Weekday))
    .filter(
      entry => entry.get('year') === date.get('year') && entry.get('month') === date.get('month'),
    );

  return uniqDateTimes([...normalizedNthWeekdaysOfMonth, ...normalizedNextWeekdays])
    .filter(entry => entry.isAfterOrEqual(date))
    .sort(dateTimeSortComparer);
}

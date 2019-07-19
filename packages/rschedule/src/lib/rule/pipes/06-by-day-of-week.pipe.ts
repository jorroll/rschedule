import { DateTime, dateTimeSortComparer, IDateAdapter, uniqDateTimes } from '../../date-time';
import { RuleOption } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeError, PipeRule } from './interfaces';
import {
  getDifferenceBetweenWeekdays,
  getNextWeekday,
  getNthWeekdayOfMonth,
  getNthWeekdayOfYear,
} from './utilities';

export interface IByDayOfWeekRuleOptions {
  frequency: RuleOption.Frequency;
  byDayOfWeek: RuleOption.ByDayOfWeek[];
  byMonthOfYear?: IDateAdapter.Month[];
}

export class ByDayOfWeekPipe extends PipeRule<IByDayOfWeekRuleOptions>
  implements IPipeRule<IByDayOfWeekRuleOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    if (this.options.frequency === 'YEARLY') {
      return this.options.byMonthOfYear === undefined
        ? this.expandYearly(args)
        : this.expandMonthly(args);
    } else if (this.options.frequency === 'MONTHLY') {
      return this.expandMonthly(args);
    }

    return this.expand(args);
  }

  private expandYearly(args: IPipeRunFn) {
    const { date } = args;

    let next: DateTime | undefined = getNextWeekdaysOfYear(date, this.options.byDayOfWeek)[0];

    let index = 0;
    let base = date;

    // If we can't find a valid date this year,
    // search next year. Only search the next 28 years.
    // (the calendar repeats on a 28 year cycle, according
    // to the internet).
    while (!next && index < 28) {
      index++;
      base = base.granularity('year').add(1, 'year');
      next = getNextWeekdaysOfYear(base, this.options.byDayOfWeek)[0];
    }

    if (!next) {
      throw new PipeError('The byDayOfWeek rule appears to contain an impossible combination');
    }

    if (next.isEqual(date)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next.granularity('day'));
  }

  private expandMonthly(args: IPipeRunFn) {
    const { date } = args;

    let next: DateTime | undefined = getNextWeekdaysOfMonth(date, this.options.byDayOfWeek)[0];

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
      next = getNextWeekdaysOfMonth(base, this.options.byDayOfWeek)[0];
    }

    if (!next) {
      throw new PipeError('The byDayOfWeek rule appears to contain an impossible combination');
    }

    if (next.isEqual(date)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next.granularity('day'));
  }

  private expand(args: IPipeRunFn) {
    const { date } = args;

    const next = this.options.byDayOfWeek
      .map(weekday => getNextWeekday(date, weekday as IDateAdapter.Weekday))
      .sort(dateTimeSortComparer)[0];

    if (next.isEqual(date)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next.granularity('day'));
  }
}

/** For each byDayOfWeek entry, find the next DateTime */
export function getNextWeekdaysOfYear(date: DateTime, byDayOfWeek: RuleOption.ByDayOfWeek[]) {
  const normalizedNthWeekdaysOfYear = byDayOfWeek
    .filter(entry => Array.isArray(entry))
    .map(entry => getNthWeekdayOfYear(date, ...(entry as [IDateAdapter.Weekday, number])));

  const normalizedNextWeekdays = byDayOfWeek
    .filter(entry => typeof entry === 'string')
    .map(weekday => getNextWeekday(date, weekday as IDateAdapter.Weekday))
    .filter(entry => entry.get('year') === date.get('year'));

  return uniqDateTimes([...normalizedNthWeekdaysOfYear, ...normalizedNextWeekdays])
    .filter(entry => entry.isAfterOrEqual(date))
    .sort(dateTimeSortComparer);
}

/** For each byDayOfWeek entry, find the next DateTime */
export function getNextWeekdaysOfMonth(date: DateTime, byDayOfWeek: RuleOption.ByDayOfWeek[]) {
  const normalizedNthWeekdaysOfMonth = byDayOfWeek
    .filter(entry => Array.isArray(entry))
    .map(entry => getNthWeekdayOfMonth(date, ...(entry as [IDateAdapter.Weekday, number])));

  const normalizedNextWeekdays = byDayOfWeek
    .filter(entry => typeof entry === 'string')
    .map(weekday => getNextWeekday(date, weekday as IDateAdapter.Weekday))
    .filter(
      entry => entry.get('year') === date.get('year') && entry.get('month') === date.get('month'),
    );

  return uniqDateTimes([...normalizedNthWeekdaysOfMonth, ...normalizedNextWeekdays])
    .filter(entry => entry.isAfterOrEqual(date))
    .sort(dateTimeSortComparer);
}

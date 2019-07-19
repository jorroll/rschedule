import { DateTime, dateTimeSortComparer, IDateAdapter, uniqDateTimes } from '../../date-time';
import { RuleOption } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';
import { getNextWeekday, getNthWeekdayOfMonth, getNthWeekdayOfYear } from './utilities';

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
    let { date } = args;

    const base = date.granularity('day');

    let next: DateTime | undefined = getNextWeekdaysOfYear(base, this.options.byDayOfWeek)[0];

    const index = 0;

    while (!next && index < 30) {
      date = date.granularity('year').add(1, 'year');

      next = getNextWeekdaysOfYear(date, this.options.byDayOfWeek)[0];
    }

    if (index >= 30) {
      throw new Error('Infinite while loop');
    }

    if (next.isEqual(base)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next);
  }

  private expandMonthly(args: IPipeRunFn) {
    let { date } = args;

    const base = date.granularity('day');

    let next: DateTime | undefined = getNextWeekdaysOfMonth(base, this.options.byDayOfWeek)[0];

    const index = 0;

    while (!next && index < 30) {
      date = date.granularity('month').add(1, 'month');

      next = getNextWeekdaysOfMonth(date, this.options.byDayOfWeek)[0];
    }

    if (index >= 30) {
      throw new Error('Infinite while loop');
    }

    if (next.isEqual(base)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next);
  }

  private expand(args: IPipeRunFn) {
    const { date } = args;

    const base = date.granularity('day');

    const next = this.options.byDayOfWeek
      .map(weekday => getNextWeekday(base, weekday as IDateAdapter.Weekday))
      .sort(dateTimeSortComparer)[0];

    if (next.isEqual(base)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next);
  }
}

/** For each byDayOfWeek entry, find the next DateTime */
export function getNextWeekdaysOfYear(date: DateTime, byDayOfWeek: RuleOption.ByDayOfWeek[]) {
  const normalizedNthWeekdaysOfYear = byDayOfWeek
    .filter(entry => Array.isArray(entry))
    .map(entry => getNthWeekdayOfYear(date, ...(entry as [IDateAdapter.Weekday, number])));

  const normalizedNextWeekdays = byDayOfWeek
    .filter(entry => typeof entry === 'string')
    .map(weekday => getNextWeekday(date, weekday as IDateAdapter.Weekday));

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
    .map(weekday => getNextWeekday(date, weekday as IDateAdapter.Weekday));

  return uniqDateTimes([...normalizedNthWeekdaysOfMonth, ...normalizedNextWeekdays])
    .filter(entry => entry.isAfterOrEqual(date))
    .sort(dateTimeSortComparer);
}

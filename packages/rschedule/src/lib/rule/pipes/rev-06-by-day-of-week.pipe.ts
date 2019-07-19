import { DateTime, dateTimeSortComparer, IDateAdapter, uniqDateTimes } from '../../date-time';
import { RuleOption } from '../rule-options';
import { IByDayOfWeekRuleOptions } from './06-by-day-of-week.pipe';
import { IPipeRule, IPipeRunFn, PipeError, PipeRule } from './interfaces';
import { getNthWeekdayOfMonth, getNthWeekdayOfYear, getPreviousWeekday } from './utilities';

export class RevByDayOfWeekPipe extends PipeRule<IByDayOfWeekRuleOptions>
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

    let next: DateTime | undefined = getPrevWeekdaysOfYear(date, this.options.byDayOfWeek)[0];

    let index = 0;
    let base = date;

    // If we can't find a valid date this year,
    // search the previous year. Only search the past 28 years.
    // (the calendar repeats on a 28 year cycle, according
    // to the internet).
    while (!next && index < 28) {
      index++;
      base = base.granularity('year').subtract(1, 'millisecond');
      next = getPrevWeekdaysOfYear(base, this.options.byDayOfWeek)[0];
    }

    if (!next) {
      throw new PipeError('The byDayOfWeek rule appears to contain an impossible combination');
    }

    if (next.isEqual(date)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next.endGranularity('day'));
  }

  private expandMonthly(args: IPipeRunFn) {
    const { date } = args;

    let next: DateTime | undefined = getPrevWeekdaysOfMonth(date, this.options.byDayOfWeek)[0];

    let index = 0;
    let base = date;

    // TODO: performance improvment
    // If, in the first year, a match isn't found, we should be able to
    // jumpt to the previous leap year and check that. Or, if already on
    // a leap year, we can just error immediately.

    // If we can't find a valid date this month,
    // search the previous month. Only search the past 4 years
    // (to account for leap year).
    while (!next && index < 50) {
      index++;
      base = base.granularity('month').subtract(1, 'millisecond');
      next = getPrevWeekdaysOfMonth(base, this.options.byDayOfWeek)[0];
    }

    if (!next) {
      throw new PipeError('The byDayOfWeek rule appears to contain an impossible combination');
    }

    if (next.isEqual(date)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next.endGranularity('day'));
  }

  private expand(args: IPipeRunFn) {
    const { date } = args;

    const base = date.endGranularity('day');

    const next = this.options.byDayOfWeek
      .map(weekday => getPreviousWeekday(base, weekday as IDateAdapter.Weekday))
      .sort(dateTimeSortComparer)
      .pop()!;

    if (next.isEqual(base)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next.endGranularity('day'));
  }
}

/** For each byDayOfWeek entry, find the previous DateTime */
export function getPrevWeekdaysOfYear(date: DateTime, byDayOfWeek: RuleOption.ByDayOfWeek[]) {
  const normalizedNthWeekdaysOfYear = byDayOfWeek
    .filter(entry => Array.isArray(entry))
    .map(entry => getNthWeekdayOfYear(date, ...(entry as [IDateAdapter.Weekday, number])));

  const normalizedNextWeekdays = byDayOfWeek
    .filter(entry => typeof entry === 'string')
    .map(weekday => getPreviousWeekday(date, weekday as IDateAdapter.Weekday))
    .filter(entry => entry.get('year') === date.get('year'));

  return uniqDateTimes([...normalizedNthWeekdaysOfYear, ...normalizedNextWeekdays])
    .filter(entry => entry.isBeforeOrEqual(date))
    .sort(dateTimeSortComparer)
    .reverse();
}

/** For each byDayOfWeek entry, find the previous DateTime */
export function getPrevWeekdaysOfMonth(date: DateTime, byDayOfWeek: RuleOption.ByDayOfWeek[]) {
  const normalizedNthWeekdaysOfMonth = byDayOfWeek
    .filter(entry => Array.isArray(entry))
    .map(entry => getNthWeekdayOfMonth(date, ...(entry as [IDateAdapter.Weekday, number])));

  const normalizedNextWeekdays = byDayOfWeek
    .filter(entry => typeof entry === 'string')
    .map(weekday => getPreviousWeekday(date, weekday as IDateAdapter.Weekday))
    .filter(
      entry => entry.get('year') === date.get('year') && entry.get('month') === date.get('month'),
    );

  return uniqDateTimes([...normalizedNthWeekdaysOfMonth, ...normalizedNextWeekdays])
    .filter(entry => entry.isBeforeOrEqual(date))
    .sort(dateTimeSortComparer)
    .reverse();
}

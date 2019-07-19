import { DateTime } from '../../date-time';
import { RuleOption } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeError, PipeRule } from './interfaces';
import { getNthWeekdayOfMonth } from './utilities';

export interface IByDayOfMonthRuleOptions {
  byDayOfMonth: RuleOption.ByDayOfMonth[];
  byDayOfWeek?: RuleOption.ByDayOfWeek[];
}

export class ByDayOfMonthPipe extends PipeRule<IByDayOfMonthRuleOptions>
  implements IPipeRule<IByDayOfMonthRuleOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let { date } = args;

    const normalizedByDayOfMonth = normalizeByDayOfMonth(
      date,
      this.options.byDayOfMonth,
      this.options.byDayOfWeek,
    );

    const currentDay = date.get('day');

    for (const day of normalizedByDayOfMonth) {
      if (currentDay > day) continue;

      if (currentDay === day) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.granularity('month').set('day', day));
    }

    let next: number | undefined;
    let nextMonth = date;
    let index = 0;

    while (!next && index < 30) {
      nextMonth = nextMonth.granularity('month').add(1, 'month');

      next = normalizeByDayOfMonth(
        nextMonth,
        this.options.byDayOfMonth,
        this.options.byDayOfWeek,
      )[0];

      index++;
    }

    if (index >= 13) {
      throw new PipeError('byDayOfMonth Infinite while loop');
    }

    date = nextMonth.set('day', next!);

    return this.nextValidDate(args, date);
  }
}

/**
 * Does a few things:
 *
 * 1. filters out byDayOfMonth entries which are not applicable
 *    to current month
 * 2. negative entries to positive ones
 * 3. if a byDayOfWeek option is given, removes days which are
 *    not on the correct day of the week
 */

export function normalizeByDayOfMonth(
  date: DateTime,
  byDayOfMonth: RuleOption.ByDayOfMonth[],
  byDayOfWeek?: RuleOption.ByDayOfWeek[],
) {
  const lengthOfMonth = date.endGranularity('month').get('day');

  let normalizedByDayOfMonth = byDayOfMonth
    .filter(day => lengthOfMonth >= Math.abs(day))
    .map(day => (day > 0 ? day : lengthOfMonth + day + 1));

  if (byDayOfWeek) {
    const base = date.granularity('month');

    const filteredByDayOfMonth: number[] = [];

    byDayOfWeek.forEach(entry => {
      if (typeof entry === 'string') {
        filteredByDayOfMonth.push(
          ...normalizedByDayOfMonth.filter(day => base.set('day', day).get('weekday') === entry),
        );

        return;
      }

      const nthWeekdayOfMonth = getNthWeekdayOfMonth(date, ...entry).get('day');

      if (normalizedByDayOfMonth.includes(nthWeekdayOfMonth)) {
        filteredByDayOfMonth.push(nthWeekdayOfMonth);
      }
    });

    normalizedByDayOfMonth = Array.from(new Set(filteredByDayOfMonth));
  }

  return normalizedByDayOfMonth.sort((a, b) => {
    if (a > b) return 1;
    if (a < b) return -1;
    else return 0;
  });
}

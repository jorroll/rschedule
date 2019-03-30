import { DateTime, dateTimeSortComparer, IDateAdapter } from '../../date-time';
import { getNextWeekdaysOfMonth, getNextWeekdaysOfYear } from './06-by-day-of-week.pipe';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';
import { getPreviousWeekday } from './utilities';

export class RevByDayOfWeekPipe extends PipeRule implements IPipeRule {
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

    const base = date.endGranularity('day');

    let next: DateTime | undefined = getNextWeekdaysOfYear(base, this.options.byDayOfWeek!).pop();

    const index = 0;

    while (!next && index < 30) {
      date = date.endGranularity('year').subtract(1, 'year');

      next = getNextWeekdaysOfYear(date, this.options.byDayOfWeek!).pop();
    }

    if (index >= 30) {
      throw new Error('Infinite while loop');
    }

    if (next!.isEqual(base)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next!);
  }

  private expandMonthly(args: IPipeRunFn) {
    let { date } = args;

    const base = date.endGranularity('day');

    let next: DateTime | undefined = getNextWeekdaysOfMonth(base, this.options.byDayOfWeek!).pop();

    const index = 0;

    while (!next && index < 30) {
      date = date.endGranularity('month').subtract(1, 'month');

      next = getNextWeekdaysOfMonth(date, this.options.byDayOfWeek!).pop();
    }

    if (index >= 30) {
      throw new Error('Infinite while loop');
    }

    if (next!.isEqual(base)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next!);
  }

  private expand(args: IPipeRunFn) {
    const { date } = args;

    const base = date.endGranularity('day');

    const next = this.options
      .byDayOfWeek!.map(weekday => getPreviousWeekday(base, weekday as IDateAdapter.Weekday))
      .sort(dateTimeSortComparer)
      .pop()!;

    if (next.isEqual(base)) {
      return this.nextPipe.run({ date });
    }

    return this.nextValidDate(args, next);
  }
}

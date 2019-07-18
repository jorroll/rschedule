import { INormalizedRuleOptions } from '../rule-options';
import { normalizeByDayOfMonth } from './05-by-day-of-month.pipe';
import { IPipeRule, IPipeRunFn, PipeError, PipeRule } from './interfaces';

type ByDayOfMonthOptions = Pick<INormalizedRuleOptions, 'byDayOfMonth' | 'byDayOfWeek'>;

export class RevByDayOfMonthPipe extends PipeRule<ByDayOfMonthOptions>
  implements IPipeRule<ByDayOfMonthOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let { date } = args;

    const normalizedByDayOfMonth = normalizeByDayOfMonth(
      date,
      this.options.byDayOfMonth!,
      this.options.byDayOfWeek,
    ).reverse();

    const currentDay = date.get('day');

    for (const day of normalizedByDayOfMonth) {
      if (currentDay < day) continue;

      if (currentDay === day) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.endGranularity('month').set('day', day));
    }

    let next: number | undefined;
    let nextMonth = date;
    let index = 0;

    while (!next && index < 30) {
      nextMonth = nextMonth.endGranularity('month').subtract(1, 'month');

      next = normalizeByDayOfMonth(
        nextMonth,
        this.options.byDayOfMonth!,
        this.options.byDayOfWeek,
      ).pop();

      index++;
    }

    if (index >= 13) {
      throw new PipeError('byDayOfMonth Infinite while loop');
    }

    date = nextMonth.set('day', next!);

    return this.nextValidDate(args, date);
  }
}

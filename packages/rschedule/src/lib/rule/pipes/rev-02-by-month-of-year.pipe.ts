import { IByMonthOfYearRuleOptions } from './02-by-month-of-year.pipe';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

export class RevByMonthOfYearPipe extends PipeRule<IByMonthOfYearRuleOptions>
  implements IPipeRule<IByMonthOfYearRuleOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let { date } = args;

    const currentMonth = date.get('month');

    for (const month of this.options.byMonthOfYear) {
      if (currentMonth < month) continue;

      if (currentMonth === month) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.endGranularity('year').set('month', month));
    }

    date = date
      .endGranularity('year')
      .subtract(1, 'year')
      .set('month', this.options.byMonthOfYear[0]);

    return this.nextValidDate(args, date);
  }
}

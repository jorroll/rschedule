import { RuleOption } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

export interface IByMonthOfYearRuleOptions {
  byMonthOfYear: RuleOption.ByMonthOfYear[];
}

export class ByMonthOfYearPipe extends PipeRule<IByMonthOfYearRuleOptions>
  implements IPipeRule<IByMonthOfYearRuleOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let { date } = args;

    const currentMonth = date.get('month');

    for (const month of this.options.byMonthOfYear) {
      if (currentMonth > month) continue;

      if (currentMonth === month) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.granularity('year').set('month', month));
    }

    date = date
      .granularity('year')
      .add(1, 'year')
      .set('month', this.options.byMonthOfYear[0]);

    return this.nextValidDate(args, date);
  }
}

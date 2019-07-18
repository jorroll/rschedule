import { INormalizedRuleOptions } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

type ByHourOfDayOptions = Pick<INormalizedRuleOptions, 'byHourOfDay'>;

export class RevByHourOfDayPipe extends PipeRule<ByHourOfDayOptions>
  implements IPipeRule<ByHourOfDayOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let { date } = args;

    const currentHour = date.get('hour');

    for (const hour of this.options.byHourOfDay!) {
      if (currentHour < hour) continue;

      if (currentHour === hour) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.endGranularity('day').set('hour', hour));
    }

    date = date
      .endGranularity('day')
      .subtract(1, 'day')
      .set('hour', this.options.byHourOfDay![0]);

    return this.nextValidDate(args, date);
  }
}

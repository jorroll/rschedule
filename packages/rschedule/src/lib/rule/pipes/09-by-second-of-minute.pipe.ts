import { INormalizedRuleOptions } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

type BySecondOfMinuteOptions = Pick<INormalizedRuleOptions, 'bySecondOfMinute'>;

export class BySecondOfMinutePipe extends PipeRule<BySecondOfMinuteOptions>
  implements IPipeRule<BySecondOfMinuteOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let date = args.date;

    const currentSecond = date.get('second');

    for (const second of this.options.bySecondOfMinute!) {
      if (currentSecond > second) continue;

      if (currentSecond === second) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.granularity('minute').set('second', second));
    }

    date = date
      .granularity('minute')
      .add(1, 'minute')
      .set('second', this.options.bySecondOfMinute![0]);

    return this.nextValidDate(args, date);
  }
}

import { INormalizedRuleOptions } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

type ByMillisecondOfSecondOptions = Pick<INormalizedRuleOptions, 'byMillisecondOfSecond'>;

export class RevByMillisecondOfSecondPipe extends PipeRule<ByMillisecondOfSecondOptions>
  implements IPipeRule<ByMillisecondOfSecondOptions> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let date = args.date;

    const currentMillisecond = date.get('millisecond');

    for (const millisecond of this.options.byMillisecondOfSecond!) {
      if (currentMillisecond < millisecond) continue;

      if (currentMillisecond === millisecond) return this.nextPipe.run({ date });

      return this.nextValidDate(
        args,
        date.endGranularity('second').set('millisecond', millisecond),
      );
    }

    date = date
      .endGranularity('second')
      .subtract(1, 'second')
      .set('millisecond', this.options.byMillisecondOfSecond![0]);

    return this.nextValidDate(args, date);
  }
}

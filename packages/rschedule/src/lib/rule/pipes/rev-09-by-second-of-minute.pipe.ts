import { DateTime } from '../../date-time';
// import { Options } from '../rule-options';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

export class RevBySecondOfMinutePipe extends PipeRule implements IPipeRule {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let date = args.date;

    const currentSecond = date.get('second');

    for (const second of this.options.bySecondOfMinute!) {
      if (currentSecond < second) continue;

      if (currentSecond === second) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.endGranularity('minute').set('second', second));
    }

    date = date
      .endGranularity('minute')
      .subtract(1, 'minute')
      .set('second', this.options.bySecondOfMinute![0]);

    return this.nextValidDate(args, date);
  }
}

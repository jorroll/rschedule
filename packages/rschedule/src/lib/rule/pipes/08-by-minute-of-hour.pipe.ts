import { DateTime } from '../../date-time';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

export class ByMinuteOfHourPipe extends PipeRule implements IPipeRule {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let date = args.date;

    const currentMinute = date.get('minute');

    for (const minute of this.options.byMinuteOfHour!) {
      if (currentMinute > minute) continue;

      if (currentMinute === minute) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.granularity('hour').set('minute', minute));
    }

    date = date
      .granularity('hour')
      .add(1, 'hour')
      .set('minute', this.options.byMinuteOfHour![0]);

    return this.nextValidDate(args, date);
  }
}

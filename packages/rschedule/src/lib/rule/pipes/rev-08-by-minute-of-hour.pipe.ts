import { IByMinuteOfHourRulePipe } from './08-by-minute-of-hour.pipe';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

export class RevByMinuteOfHourPipe extends PipeRule<IByMinuteOfHourRulePipe>
  implements IPipeRule<IByMinuteOfHourRulePipe> {
  run(args: IPipeRunFn) {
    if (args.invalidDate) {
      return this.nextPipe.run(args);
    }

    let date = args.date;

    const currentMinute = date.get('minute');

    for (const minute of this.options.byMinuteOfHour) {
      if (currentMinute < minute) continue;

      if (currentMinute === minute) return this.nextPipe.run({ date });

      return this.nextValidDate(args, date.endGranularity('hour').set('minute', minute));
    }

    date = date
      .endGranularity('hour')
      .subtract(1, 'hour')
      .set('minute', this.options.byMinuteOfHour[0]);

    return this.nextValidDate(args, date);
  }
}

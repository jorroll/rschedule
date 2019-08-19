import { IDateAdapter } from '../../date-time';
import { IPipeRunFn, PipeRule } from './interfaces';

/**
 * Contains shared logic for ByHourOfDay, ByMinuteOfHour,
 * BySecondOfMinute, and ByMillisecondOfSecond rule pipes
 */
export abstract class ByTimePipe<T> extends PipeRule<T> {
  runFn(
    baseGranularity: IDateAdapter.TimeUnit,
    granularity: IDateAdapter.TimeUnit,
    optionName: keyof T,
  ) {
    return (args: IPipeRunFn) => {
      if (args.invalidDate) {
        return this.nextPipe.run(args);
      }

      let { date } = args;

      // e.g. const currentTime = date.get('hour');
      const currentTime = date.get(granularity as any);

      // e.g. for (const time of this.options.byHourOfDay) {
      for (const time of (this.options as any)[optionName]) {
        if (currentTime > time) continue;

        if (currentTime === time) return this.nextPipe.run({ date });

        // e.g. return this.nextValidDate(args, date.granularity('day').set('hour', time));
        return this.nextValidDate(args, date.granularity(baseGranularity).set(granularity, time));
      }

      date = date
        // e.g. .granularity('day')
        .granularity(baseGranularity)
        // e.g. .add(1, 'day')
        .add(1, baseGranularity)
        // e.g. .set('hour', this.options.byHourOfDay[0]);
        .set(granularity, (this.options as any)[optionName][0]);

      return this.nextValidDate(args, date);
    };
  }
}

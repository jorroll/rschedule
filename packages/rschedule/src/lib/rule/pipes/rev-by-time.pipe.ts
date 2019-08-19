import { IDateAdapter } from '../../date-time';
import { IPipeRunFn, PipeRule } from './interfaces';

/**
 * Contains shared logic for ByHourOfDay, ByMinuteOfHour,
 * BySecondOfMinute, and ByMillisecondOfSecond reverse rule pipes
 */
export abstract class RevByTimePipe<T> extends PipeRule<T> {
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

      const currentTime = date.get(granularity as any);

      for (const time of (this.options as any)[optionName]) {
        if (currentTime < time) continue;

        if (currentTime === time) return this.nextPipe.run({ date });

        return this.nextValidDate(
          args,
          date.endGranularity(baseGranularity).set(granularity, time),
        );
      }

      date = date
        .endGranularity(baseGranularity)
        .subtract(1, baseGranularity)
        .set(granularity, (this.options as any)[optionName][0]);

      return this.nextValidDate(args, date);
    };
  }
}

import { DateTime } from '../../date-time';
import { IPipeRule } from './interfaces';

export const fakePipe: IPipeRule<unknown> = {
  run(args: any) {
    return args;
  },
} as any;

export function dateTime(...args: number[]) {
  return DateTime.fromJSON({
    timezone: null,
    year: args[0],
    month: args[1] || 1,
    day: args[2] || 1,
    hour: args[3] || 0,
    minute: args[4] || 0,
    second: args[5] || 0,
    millisecond: args[6] || 0,
  });
}

export function isoString(...args: number[]) {
  return dateTime(...args).toISOString();
}

export function buildPipeFn<T extends new (...args: any) => IPipeRule<unknown>, O>(
  pipeConstructor: T,
) {
  return (start: DateTime, options: O) => {
    const pipe = new pipeConstructor({ start, options });
    pipe.nextPipe = fakePipe;
    return pipe;
  };
}

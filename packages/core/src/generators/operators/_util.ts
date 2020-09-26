import { DateTime, IRunNextArgs } from '@rschedule/core';

import {
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
} from '../occurrence-generator';

/**
 * Simple class that lets us access the `value`, `runArgs`, and `done`
 * status of an OccurrenceGenerator iterator
 */
export class IterableWrapper {
  done!: boolean;
  value!: DateTime | undefined;

  readonly stream: OccurrenceGeneratorRunResult;

  constructor(generator: OccurrenceGenerator, readonly runArgs: IRunArgs) {
    this.stream = generator._run(this.runArgs);
    this.next();
  }

  next(
    args?: IRunNextArgs,
  ): {
    done: boolean | undefined;
    value: DateTime | undefined;
  } {
    const { done, value } = this.stream.next(args);

    this.done = typeof done === 'boolean' ? done : true;
    this.value = value;
    return { done, value };
  }
}

export function processYieldArgs(
  streams: IterableWrapper[],
  options: { reverse?: boolean } = {},
  yieldArgs: IRunNextArgs = {},
): void {
  if (!yieldArgs.skipToDate || streams.length === 0) return;

  // check for invalid `skipToDate` option
  if (
    options.reverse
      ? streams.every(s => s.value!.isBeforeOrEqual(yieldArgs.skipToDate!))
      : streams.every(s => s.value!.isAfterOrEqual(yieldArgs.skipToDate!))
  ) {
    throw new Error(
      'A provided `skipToDate` option must be greater than the last yielded date ' +
        '(or smaller, in the case of reverse iteration)',
    );
  }

  for (const stream of streams) {
    if (stream.done) continue; // no point in calling `next()`
    if (
      options.reverse
        ? stream.value!.isBeforeOrEqual(yieldArgs.skipToDate)
        : stream.value!.isAfterOrEqual(yieldArgs.skipToDate)
    ) {
      // This can happen there are two streams and one stream starts after the other finishes.
      // Or, when iterating in reverse, when one stream ends before the other starts.
      // In this case we don't want to call `next()` because it will throw an error.
      // In both of these cases, calling `next()` won't do anything anyway.
      continue;
    }

    stream.next(yieldArgs);
  }
}

/** sorts ascending with completed iterables at the end */
export function streamsComparer(a: IterableWrapper, b: IterableWrapper): 0 | 1 | -1 {
  if (a.done && b.done) return 0;
  if (a.done) return 1;
  if (b.done) return -1;
  if (a.value!.isAfter(b.value!)) return 1;
  return -1;
}

/** sorts descending with completed iterables at the start */
export function streamsReverseComparer(a: IterableWrapper, b: IterableWrapper): 0 | 1 | -1 {
  if (a.done && b.done) return 0;
  if (a.done) return -1;
  if (b.done) return 1;
  if (a.value!.isAfter(b.value!)) return -1;
  return 1;
}

export function selectNextIterable(
  streams: IterableWrapper[],
  options: { reverse?: boolean } = {},
  yieldArgs: IRunNextArgs = {},
): IterableWrapper | undefined {
  processYieldArgs(streams, options, yieldArgs);

  return streams
    .sort(options.reverse ? streamsReverseComparer : streamsComparer)
    .filter(s => !s.done)
    .shift();
}

export function selectLastIterable(
  streams: IterableWrapper[],
  options: { reverse?: boolean } = {},
  yieldArgs: IRunNextArgs = {},
): IterableWrapper | undefined {
  processYieldArgs(streams, options, yieldArgs);

  return streams
    .sort(options.reverse ? streamsReverseComparer : streamsComparer)
    .filter(s => !s.done)
    .pop();
}

export function streamPastEnd(
  stream: IterableWrapper,
  options: { reverse?: boolean; start?: DateTime; end?: DateTime },
): boolean {
  return (
    stream.done ||
    !!(options.reverse
      ? options.start && options.start.isAfter(stream.value!)
      : options.end && options.end.isBefore(stream.value!))
  );
}

export function streamPastSkipToDate(
  stream: IterableWrapper,
  skipToDate: DateTime,
  options: { reverse?: boolean },
): boolean {
  return (
    stream.done ||
    !!(options.reverse
      ? skipToDate.isAfterOrEqual(stream.value!)
      : skipToDate.isBeforeOrEqual(stream.value!))
  );
}

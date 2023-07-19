import { ArgumentError, DateTime, IRunNextArgs } from '@rschedule/core';
import {
  IOperatorConfig,
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
  Operator,
  OperatorFnOutput,
} from '../occurrence-generator';
import { IterableWrapper, selectLastIterable, selectNextIterable } from './_util';

/**
 * An operator function, which takes a spread of occurrence generators and only
 * returns the dates which intersect every occurrence generator.
 * This operator ignores duration.
 *
 * Because it's possible for all the generators to never intersect,
 * and because the intersection operator can't detect this lack of intersection,
 * you must call `intersection()` with a `{maxFailedIterations: number}` argument.
 * For convenience, you can globally set `RScheduleConfig.defaultMaxFailedIterations`.
 * Without further information, I'd probably set `defaultMaxFailedIterations = 50`.
 *
 * The `maxFailedIterations` argument caps the number of iterations the operator will
 * run through without finding a single valid occurrence. If this number is reached, the operator will
 * stop iterating (preventing a possible infinite loop).
 *
 * - Note: `maxFailedIterations` caps the number of iterations which
 *   *fail to turn up a single valid occurrence*. Every time a valid occurrence is returned,
 *   the current iteration count is reset to 0.
 *
 */

export function intersection(args: {
  maxFailedIterations?: number;
  streams: OccurrenceGenerator[];
}): OperatorFnOutput {
  return (options: IOperatorConfig) => new IntersectionOperator(args, options);
}

export class IntersectionOperator extends Operator {
  static defaultMaxFailedIterations: number | undefined;

  readonly maxFailedIterations?: number;

  constructor(
    args: {
      maxFailedIterations?: number;
      streams: OccurrenceGenerator[];
    },
    config: IOperatorConfig,
  ) {
    super(args.streams, config);

    if (this.isInfinite) {
      this.maxFailedIterations =
        args.maxFailedIterations || IntersectionOperator.defaultMaxFailedIterations;

      if (!this.maxFailedIterations) {
        throw new ArgumentError(
          'The IntersectionOperator must be provided ' +
          'a `maxFailedIterations` argument when it is built from schedules of infinite length. ' +
          'This argument is used to ensure that the IntersectionOperator does not enter ' +
          'an infinite loop because the underlying schedules never intersect. ' +
          'If the `maxFailedIterations` count is reached it will be assumed that ' +
          'all valid occurrences have been found and iteration will end without error.' +
          'Without additional information, "50" is probably a good ' +
          '`maxFailedIterations` value. ' +
          'If the schedules are not of infinite length, `maxFailedIterations` is ignored. ' +
          'Note also that you can provide a `defaultMaxFailedIterations` number via ' +
          'IntersectionOperator.defaultMaxFailedIterations.',
        );
      }
    }
  }

  set(_: 'timezone', value: string | null): IntersectionOperator {
    return new IntersectionOperator(
      {
        maxFailedIterations: this.maxFailedIterations,
        streams: this.streams.map(stream => stream.set('timezone', value)),
      },
      {
        ...this.config,
        base: this.config.base && this.config.base.set('timezone', value),
        timezone: value,
      },
    );
  }

  *_run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    const streams = this.streams.map(stream => new IterableWrapper(stream, args));

    if (this.config.base) {
      streams.push(new IterableWrapper(this.config.base, args));
    }

    if (streams.length === 0) return;

    const hasEndDate = !!(!this.isInfinite || args.reverse || args.end);

    if (
      !cycleStreams(streams, undefined, {
        ...args,
        hasEndDate,
        iteration: 0,
        maxIterations: this.maxFailedIterations,
      })
    ) {
      return;
    }

    let stream = selectNextIterable(streams, args);

    while (stream) {
      const yieldArgs = yield this.normalizeRunOutput(stream.value!);

      const lastValidDate = stream.value;

      if (!(yieldArgs?.skipToDate)) {
        // iterate the current stream
        stream.next();
      }

      if (
        !cycleStreams(
          streams,
          lastValidDate,
          {
            ...args,
            hasEndDate,
            iteration: 0,
            maxIterations: this.maxFailedIterations,
          },
          yieldArgs,
        )
      ) {
        return;
      }

      // The call to `cycleStreams()`, above, has already called
      // selectNextIterable with the `yieldArgs`
      stream = selectNextIterable(streams, args);
    }
  }

  protected calculateIsInfinite(): boolean {
    // Note: Array#every() === true when length === 0
    if (!this.config.base) {
      if (this.streams.length === 0) return false;

      return this.streams.every(stream => stream.isInfinite);
    } else if (this.streams.length === 0) return this.config.base.isInfinite;

    return this.config.base.isInfinite && this.streams.every(stream => stream.isInfinite);
  }

  protected calculateHasDuration(): boolean {
    const streamsDuration = this.streams.every(stream => stream.hasDuration);

    if (!this.config.base) return streamsDuration;

    return this.config.base.hasDuration && streamsDuration;
  }
}

function cycleStreams(
  streams: IterableWrapper[],
  lastValidDate: DateTime | undefined,
  options: {
    maxIterations?: number;
    hasEndDate: boolean;
    iteration: number;
    end?: DateTime;
    reverse?: boolean;
  },
  yieldArgs?: IRunNextArgs,
): boolean {
  const next = selectNextIterable(streams, options, yieldArgs);

  if (!next) return false;

  if (lastValidDate && next.value!.isEqual(lastValidDate)) return true;

  if (streams.some(stream => stream.done)) return false;

  if (streams.every(stream => stream.value!.isEqual(next.value))) return true;

  options.iteration++;

  if (options.maxIterations && !options.hasEndDate && options.iteration > options.maxIterations) {
    return false;
  }

  // Since not all of the streams are equal, we grab the last stream...
  const last = selectLastIterable(streams, options)!;

  // ...and skip all the other streams so they are equal or past the last one
  streams.forEach(stream => {
    // Because streams can have multiple, identical dates in a row,
    // we don't want to `skipToDate` if the provided date is equal to the current date.
    if (last.value!.isEqual(stream.value!)) return;

    stream.next({ skipToDate: last.value });
  });

  // then we repeat
  return cycleStreams(streams, lastValidDate, options);
}

import { ArgumentError } from '../basic-utilities';
import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IOccurrenceGenerator, IRunArgs } from '../interfaces';
import { RScheduleConfig } from '../rschedule-config';
import { IOperatorConfig, Operator, OperatorFnOutput } from './interface';
import {
  IterableWrapper,
  selectLastIterable,
  selectNextIterable,
  streamPastEnd,
  streamPastSkipToDate,
} from './utilities';

const INTERSECTION_OPERATOR_ID = Symbol.for('a978cd71-e379-4a0e-b4da-cbc14ce473dc');

/**
 * An operator function, which takes a spread of occurrence generators and only
 * returns the dates which intersect every occurrence generator.
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

export function intersection<T extends typeof DateAdapter>(args: {
  maxFailedIterations?: number;
  streams: IOccurrenceGenerator<T>[];
}): OperatorFnOutput<T> {
  return (options: IOperatorConfig<T>) => new IntersectionOperator(args, options);
}

export class IntersectionOperator<T extends typeof DateAdapter> extends Operator<T> {
  static isIntersectionOperator<T extends typeof DateAdapter = any>(
    object: unknown,
  ): object is IntersectionOperator<T> {
    return !!(super.isOperator(object) && (object as any)[INTERSECTION_OPERATOR_ID]);
  }

  readonly isInfinite: boolean;
  readonly maxFailedIterations?: number;

  protected readonly [INTERSECTION_OPERATOR_ID] = true;

  constructor(
    args: {
      maxFailedIterations?: number;
      streams: IOccurrenceGenerator<T>[];
    },
    config: IOperatorConfig<T>,
  ) {
    super(args.streams, config);

    this.isInfinite =
      this.config.base && this.config.base.isInfinite === false
        ? false
        : !this._streams.some(stream => !stream.isInfinite);

    if (this.isInfinite) {
      this.maxFailedIterations =
        args.maxFailedIterations || RScheduleConfig.IntersectionOperator.defaultMaxFailedIterations;

      if (!this.maxFailedIterations) {
        throw new ArgumentError(
          'The IntersectionOperator must be provided ' +
            'a `maxFailedIterations` argument when it is built from schedules of infinite length. ' +
            'This argument is used to ensure that the IntersectionOperator does not enter ' +
            'an infinite loop because the underlying schedules never intersect. ' +
            'If the `maxFailedIterations` count is reached it will be assumed that ' +
            'all valid occurrences have been found and iteration will end.' +
            'Without additional information, "50" is probably a good ' +
            '`maxFailedIterations` value. ' +
            'If the schedules are not of infinite length, `maxFailedIterations` is ignored. ' +
            'Note also that you can provide a `defaultMaxFailedIterations` number to `RScheduleConfig`.',
        );
      }
    }
  }

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
    return new IntersectionOperator(
      {
        maxFailedIterations: this.maxFailedIterations,
        streams: this._streams.map(stream => stream.set('timezone', value)),
      },
      {
        ...this.config,
        base: this.config.base && this.config.base.set('timezone', value),
        timezone: value,
      },
    );
  }

  /** @internal */
  *_run(args: IRunArgs = {}): IterableIterator<DateTime> {
    const streams = this._streams.map(stream => new IterableWrapper(stream._run(args)));

    if (this.config.base) {
      streams.push(new IterableWrapper(this.config.base._run(args)));
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

    while (!streams.some(stream => stream.done)) {
      const yieldArgs = yield this.normalizeRunOutput(stream.value);

      const lastValidDate = stream.value;

      stream.picked();

      if (
        !cycleStreams(streams, lastValidDate, {
          ...args,
          hasEndDate,
          iteration: 0,
          maxIterations: this.maxFailedIterations,
        })
      ) {
        return;
      }

      stream = selectNextIterable(streams, args);

      if (yieldArgs && yieldArgs.skipToDate) {
        while (!streamPastSkipToDate(stream, yieldArgs.skipToDate, args)) {
          stream.picked();

          if (
            !cycleStreams(streams, lastValidDate, {
              ...args,
              hasEndDate,
              iteration: 0,
              maxIterations: this.maxFailedIterations,
            })
          ) {
            return;
          }

          stream = selectNextIterable(streams, args);
        }
      }
    }
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
): boolean {
  const next = selectNextIterable(streams, options);

  if (streams.some(stream => stream.done) || streamPastEnd(next, options)) return false;

  if (streams.every(stream => stream.value.isEqual(next.value))) return true;

  if (lastValidDate && next.value.isEqual(lastValidDate)) return true;

  options.iteration++;

  if (options.maxIterations && !options.hasEndDate && options.iteration > options.maxIterations) {
    return false;
  }

  const last = selectLastIterable(streams, options);

  streams.forEach(stream => {
    stream.skipToDate(last.value, options);
  });

  return cycleStreams(streams, lastValidDate, options);
}

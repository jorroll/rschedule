import { ArgumentError, DateTime, IRunNextArgs } from '@rschedule/core';
import {
  IOperatorConfig,
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
  Operator,
  OperatorFnOutput,
} from '../occurrence-generator';
import { IterableWrapper } from './_util';

class DurationIterableWrapper extends IterableWrapper {
  workingValue: DateTime | undefined;

  constructor(generator: OccurrenceGenerator, runArgs: IRunArgs) {
    super(generator, runArgs);
    this.workingValue = this.value;
    this.next();
  }
}

export class MergeDurationOperatorError extends Error { }

/**
 * An operator function which takes an occurrence stream with
 * `hasDuration === true` and merges occurrences which have overlapping
 * start and end times.
 *
 * Because it's possible for all the occurrences in the stream to have
 * overlapping start and end times, you must provide a `maxDuration`
 * argument that represents the maximum possible duration for a single
 * occurrence. If this duration is exceeded, a `MergeDurationOperatorError`
 * will be thrown.
 *
 * - For your convenience, you can globally set a default
 *   `MergeDurationOperator#maxDuration` via
 *   `RScheduleConfig.MergeDurationOperator.defaultMaxDuration`.
 *
 * Usage example:
 *
 * ```typescript
 * const MILLISECONDS_IN_HOUR = 1000 * 60 * 60;
 *
 * const dates = new Dates({
 *   dates: [
 *     new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
 *     new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 2 }),
 *     new StandardDateAdapter(new Date(2010, 10, 11, 14), { duration: MILLISECONDS_IN_HOUR * 2 }),
 *     new StandardDateAdapter(new Date(2010, 10, 12, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
 *   ],
 *   dateAdpter: StandardDateAdapter,
 * }).pipe(
 *   mergeDuration({
 *     maxDuration: MILLISECONDS_IN_HOUR * 24
 *   })
 * )
 *
 * dates.occurrences().toArray() === [
 *   new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
 *   new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 3 }),
 *   new StandardDateAdapter(new Date(2010, 10, 12, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
 * ]
 * ```
 */

export function mergeDuration(args: { maxDuration: number }): OperatorFnOutput {
  return (options: IOperatorConfig) => new MergeDurationOperator(args, options);
}

export class MergeDurationOperator extends Operator {
  readonly maxDuration: number;

  constructor(
    args: {
      maxDuration: number;
    },
    config: IOperatorConfig,
  ) {
    super([], config);

    this.maxDuration = args.maxDuration;

    if (config.base && !config.base.hasDuration) {
      throw new ArgumentError(
        'Base stream provided to MergeDurationOperator does not have an associated duration. ' +
        'The MergeDurationOperator can only be used with streams which have a duration. ',
      );
    }
  }

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
    return new MergeDurationOperator(
      {
        maxDuration: this.maxDuration,
      },
      {
        ...this.config,
        base: this.config.base && this.config.base.set('timezone', value),
        timezone: value,
      },
    );
  }

  _run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    return args.reverse ? this.reverseRun(args) : this.forwardRun(args);
  }

  protected calculateIsInfinite() {
    return !!(this.config.base && this.config.base.isInfinite);
  }

  protected calculateHasDuration() {
    return true;
  }

  private *forwardRun(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    if (!this.config.base) return;

    // We want to find occurrences that end after the provided
    // `start` time even if they begin before the provided `start`
    // time. Because of this, we must begin iterating `maxDuration`
    // before the provided start time.
    let checkFromStart = args.start;
    if (args.start) {
      checkFromStart = args.start.subtract(this.maxDuration, 'millisecond');
    }

    let checkFromEnd = args.end;
    if (args.end) {
      checkFromEnd = args.end.add(this.maxDuration, 'millisecond');
    }

    const stream = new DurationIterableWrapper(this.config.base, {
      ...args,
      start: checkFromStart,
      end: checkFromEnd,
    });

    let yieldArgs: IRunNextArgs | undefined;

    // checking `stream.workingValue` because when `stream.done === true`
    // `stream.workingValue` will not have been yielded yet
    while (stream.workingValue) {
      // TODO(@john.carroll.p): figure out how to handle `DateTime#generators` for merged `DateTimes`
      while (!stream.done && stream.workingValue.end!.isAfterOrEqual(stream.value!)) {
        if (stream.workingValue.duration! > this.maxDuration) {
          throw new MergeDurationOperatorError(
            `MergeDurationOperatorError: Occurrence duration exceeded maxDuration of ` +
            this.maxDuration,
          );
        }

        if (stream.value!.end!.isAfter(stream.workingValue.end!)) {
          const diff: number = stream.value!.end!.valueOf() - stream.workingValue.end!.valueOf();

          stream.workingValue = stream.workingValue!.set(
            'duration',
            stream.workingValue.duration! + diff,
          );
        }

        stream.next();
      }

      // check to make sure the occurrence we are about to yield ends after the
      // provided start time.
      if (args.start && stream.workingValue.end!.isBefore(args.start)) {
        stream.workingValue = stream.value;
        stream.next();
        continue;
      }

      // make sure the occurrence we are about to yield ends after the
      // provided skipToDate
      if (
        yieldArgs?.skipToDate &&
        stream.workingValue.end!.isBefore(yieldArgs.skipToDate)
      ) {
        stream.workingValue = stream.value;
        stream.next();
        continue;
      }

      // make sure we are not after the user requested `end` time.
      if (args.end && stream.workingValue && stream.workingValue.isAfter(args.end)) {
        break;
      }

      if (stream.workingValue.duration! > this.maxDuration) {
        throw new MergeDurationOperatorError(
          `MergeDurationOperatorError: Occurrence duration exceeded maxDuration of ` +
          this.maxDuration,
        );
      }

      yieldArgs = yield this.normalizeRunOutput(stream.workingValue);

      if (
        yieldArgs?.skipToDate &&
        stream.workingValue!.isAfterOrEqual(yieldArgs.skipToDate)
      ) {
        throw new Error(
          'A provided `skipToDate` option must be greater than the last yielded date ' +
          '(or smaller, in the case of reverse iteration)',
        );
      }

      stream.workingValue = stream.value;
      stream.next();
    }
  }

  private *reverseRun(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    if (!this.config.base) return;

    // We want to find occurrences that end after the provided
    // `start` time even if they begin before the provided `start`
    // time. Because of this, we must begin iterating `maxDuration`
    // before the provided start time.
    let checkFromStart = args.start;
    if (args.start) {
      checkFromStart = args.start.subtract(this.maxDuration, 'millisecond');
    }

    let checkFromEnd = args.end;
    if (args.end) {
      checkFromEnd = args.end.add(this.maxDuration, 'millisecond');
    }

    const stream = new DurationIterableWrapper(this.config.base, {
      ...args,
      start: checkFromStart,
      end: checkFromEnd,
    });

    let yieldArgs: any | undefined;

    // checking `stream.workingValue` because when `stream.done === true`
    // `stream.workingValue` will not have been yielded yet
    while (stream.workingValue) {
      // TODO(@john.carroll.p): figure out how to handle `DateTime#generators` for merged `DateTimes`
      while (!stream.done && stream.workingValue!.isBeforeOrEqual(stream.value!.end!)) {
        if (stream.workingValue!.duration! > this.maxDuration) {
          throw new MergeDurationOperatorError(
            `MergeDurationOperatorError: Occurrence duration exceeded maxDuration of ` +
            this.maxDuration,
          );
        }

        if (
          stream.value!.isBefore(stream.workingValue!) ||
          stream.value!.end!.isAfter(stream.workingValue!.end!)
        ) {
          if (stream.value!.end!.isAfter(stream.workingValue!.end!)) {
            // `stream.workingValue` is a subset of `stream.value`
            // so simply replace `stream.workingValue` with `stream.value`
            stream.workingValue = stream.value;
          } else {
            const diff = stream.workingValue!.valueOf() - stream.value!.valueOf();

            stream.workingValue = stream.value!.set(
              'duration',
              stream.workingValue!.duration! + diff,
            );
          }
        }

        stream.next();
      }

      // check to make sure the occurrence we are about to yield starts before the
      // provided start time.
      if (args.start && stream.workingValue!.end!.isBefore(args.start)) {
        break;
      }

      if (
        yieldArgs &&
        yieldArgs.skipToDate &&
        stream.workingValue!.end!.isBefore(yieldArgs.skipToDate)
      ) {
        stream.workingValue = stream.value;
        stream.next();
        continue;
      }

      // make sure we are not after the user requested `end` time.
      if (args.end && stream.workingValue && stream.workingValue.isAfter(args.end)) {
        stream.workingValue = stream.value;
        stream.next();
        continue;
      }

      if (stream.workingValue!.duration! > this.maxDuration) {
        throw new MergeDurationOperatorError(
          `MergeDurationOperatorError: Occurrence duration exceeded maxDuration of ` +
          this.maxDuration,
        );
      }

      yieldArgs = yield this.normalizeRunOutput(stream.workingValue!);

      if (
        yieldArgs &&
        yieldArgs.skipToDate &&
        stream.workingValue!.end!.isBeforeOrEqual(yieldArgs.skipToDate)
      ) {
        throw new Error(
          'A provided `skipToDate` option must be greater than the last yielded date ' +
          '(or smaller, in the case of reverse iteration)',
        );
      }

      stream.workingValue = stream.value;
      stream.next();
    }
  }
}

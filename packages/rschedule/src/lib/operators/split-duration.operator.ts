import { ArgumentError } from '../basic-utilities';
import { DateAdapter } from '../date-adapter';
import { DateTime, dateTimeSortComparer } from '../date-time';
import { IRunArgs } from '../interfaces';
import { RScheduleConfig } from '../rschedule-config';
import { IOperatorConfig, Operator, OperatorFnOutput } from './interface';
import { IterableWrapper, streamPastEnd, streamPastSkipToDate } from './utilities';

const SPLIT_DURATION_OPERATOR_ID = Symbol.for('4066d190-c387-4368-9753-b5bf88685cdb');

export class SplitDurationOperatorError extends Error {}

/**
 * An operator function which takes an occurrence stream with
 * `hasDuration === true` and passes occurrences through a splitting
 * function. One use case for this operator is to dynamically break up
 * occurrences with a large duration into several smaller occurrences.
 *
 * You must provide a `maxDuration` argument that represents the
 * maximum possible duration for a single occurrence. If this
 * duration is exceeded, a `SplitDurationOperatorError` will be
 * thrown.
 *
 * - For your convenience, you can globally set a default
 *   `SplitDurationOperator#maxDuration` via
 *   `RScheduleConfig.SplitDurationOperator.defaultMaxDuration`.
 *
 * Usage example:
 *
 * ```typescript
 * const MILLISECONDS_IN_HOUR = 1000 * 60 * 60;
 *
 * const splitFn = (date: DateTime) => {
 *   if (date.duration > MILLISECONDS_IN_HOUR) {
 *     const diff = date.duration! / 2;
 *
 *     return [
 *       date.set('duration', diff),
 *       date.add(diff, 'millisecond').set('duration', diff),
 *     ];
 *   }
 *
 *   return [date];
 * };
 *
 * const dates = new Dates({
 *   dates: [
 *     new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
 *     new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 2 }),
 *   ],
 *   dateAdpter: StandardDateAdapter,
 * }).pipe(
 *   splitDuration({
 *     splitFn,
 *     maxDuration: MILLISECONDS_IN_HOUR * 1
 *   })
 * )
 *
 * expect(dates.occurrences().toArray()).toEqual([
 *   new StandardDateAdapter(new Date(2010, 10, 10, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
 *   new StandardDateAdapter(new Date(2010, 10, 11, 13), { duration: MILLISECONDS_IN_HOUR * 1 }),
 *   new StandardDateAdapter(new Date(2010, 10, 11, 14), { duration: MILLISECONDS_IN_HOUR * 1 }),
 * ])
 * ```
 */

export function splitDuration<T extends typeof DateAdapter>(args: {
  maxDuration?: number;
  splitFn: (dateTime: DateTime) => DateTime[];
}): OperatorFnOutput<T> {
  return (options: IOperatorConfig<T>) => new SplitDurationOperator(args, options);
}

export class SplitDurationOperator<T extends typeof DateAdapter> extends Operator<T> {
  static isSplitDurationOperator(object: unknown): object is SplitDurationOperator<any> {
    return !!(super.isOperator(object) && (object as any)[SPLIT_DURATION_OPERATOR_ID]);
  }

  readonly splitFn: (dateTime: DateTime) => DateTime[];
  readonly maxDuration: number;

  protected readonly [SPLIT_DURATION_OPERATOR_ID] = true;

  constructor(
    args: {
      maxDuration?: number;
      splitFn: (dateTime: DateTime) => DateTime[];
    },
    config: IOperatorConfig<T>,
  ) {
    super([], config);

    this.splitFn = args.splitFn;

    this.maxDuration =
      args.maxDuration || RScheduleConfig.SplitDurationOperator.defaultMaxDuration!;

    if (!this.maxDuration) {
      throw new ArgumentError(
        'The SplitDurationOperator must be provided a `maxDuration` argument. ' +
          "If an occurrence's duration exceeds the `maxDuration` " +
          'an error will be thrown. ' +
          'For your convenience, you can globally set a default `maxDuration` value ' +
          'via `RScheduleConfig.SplitDurationOperator.defaultMaxDuration`.',
      );
    }

    if (config.base && !config.base.hasDuration) {
      throw new ArgumentError(
        'Base stream provided to SplitDurationOperator does not have an associated duration. ' +
          'The SplitDurationOperator can only be used with streams which have a duration.',
      );
    }
  }

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
    return new SplitDurationOperator(
      {
        maxDuration: this.maxDuration,
        splitFn: this.splitFn,
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
    if (!this.config.base) return;

    const reverse = args.reverse || false;

    // We want to find occurrences that end after the provided
    // `start` time even if they begin before the provided `start`
    // time. Because of this, we add `maxDuration` to
    // the provided start time.
    let checkFromStart = args.start;

    if (args.start) {
      checkFromStart = reverse
        ? args.start.add(this.maxDuration, 'millisecond')
        : args.start.subtract(this.maxDuration, 'millisecond');
    }

    // same goes for `end` time as with `start` time.
    let checkFromEnd = args.end;

    if (args.end) {
      checkFromEnd = reverse
        ? args.end.subtract(this.maxDuration, 'millisecond')
        : args.end.add(this.maxDuration, 'millisecond');
    }

    const stream = new IterableWrapper(
      this.config.base._run({ ...args, start: checkFromStart, end: checkFromEnd }),
    );

    let yieldArgs: { skipToDate?: DateTime } | undefined;

    const datesBucket: DateTime[][] = [];

    while (!stream.done || (datesBucket[0] && datesBucket[0][0])) {
      /**
       * Example:
       * 10am - 2pm -> 10am - 12pm, 12pm - 2pm
       * 11am - 3pm -> 11am - 1pm, 1pm - 3pm
       * 2pm - 4pm -> 2pm - 3pm, 3pm - 4pm
       */

      if (!(datesBucket[0] && datesBucket[0][0])) {
        // we're out of dates
        datesBucket.push(this.splitDate(stream.value, reverse));
        stream.picked();
      }

      while (
        !stream.done &&
        (reverse
          ? datesBucket[0].some(date => date.isBeforeOrEqual(stream.value.end!))
          : datesBucket[0].some(date => date.isAfterOrEqual(stream.value)))
      ) {
        datesBucket.push(this.splitDate(stream.value, reverse));

        stream.picked();
      }

      let selectedDate = datesBucket[0] && datesBucket[0][0];
      let bucketIndex = -1;
      let selectedBucketIndex = 0;
      let dateIndex = -1;
      let selectedDateIndex = 0;

      // find the next date as well as its location in the datesBucket
      for (const bucket of datesBucket) {
        bucketIndex++;
        dateIndex = -1;

        for (const date of bucket) {
          dateIndex++;

          if (
            (reverse ? date.isAfter(selectedDate) : date.isBefore(selectedDate)) ||
            (date.isEqual(selectedDate) &&
              (reverse
                ? date.duration! > selectedDate.duration!
                : date.duration! < selectedDate.duration!))
          ) {
            selectedDate = date;
            selectedBucketIndex = bucketIndex;
            selectedDateIndex = dateIndex;
            break;
          }
        }
      }

      datesBucket[selectedBucketIndex].splice(selectedDateIndex, 1);

      if (datesBucket[selectedBucketIndex].length === 0) {
        datesBucket.splice(selectedBucketIndex, 1);
      }

      // If we've been yieldedArgs from the last cycle, check to see
      // that the selectedDate honors the `skipToDate` requirement
      // if not, discard this selectedDate
      if (
        yieldArgs &&
        yieldArgs.skipToDate &&
        selectedDate &&
        !datePastEnd(selectedDate, args) &&
        !datePastSkipToDate(selectedDate, yieldArgs.skipToDate, args)
      ) {
        continue;
      }

      // because we subtracted `maxDuration` to the base iterator's start time,
      // check to make sure the selectedDate we are about to yield should
      // actually be yielded (it may be before the provided `start` time).
      // If not, discard the selectedDate.
      if (
        args.start &&
        (reverse ? selectedDate.isAfter(args.start) : selectedDate.end!.isBefore(args.start!))
      ) {
        continue;
      }

      // because we added `maxDuration` to the base iterator's end time,
      // check to make sure the selectedDate we are about to yield should
      // actually be yielded (it may be after the provided `end` time).
      // If not, end iteration.
      if (
        args.end &&
        (reverse ? selectedDate.end!.isBefore(args.end) : selectedDate.isAfter(args.end!))
      ) {
        break;
      }

      if (selectedDate.duration! > this.maxDuration) {
        throw new SplitDurationOperatorError(
          `SplitDurationOperatorError: Occurrence duration exceeded maxDuration of ` +
            this.maxDuration,
        );
      }

      yieldArgs = yield this.normalizeRunOutput(selectedDate);
    }
  }

  protected calculateIsInfinite() {
    return !!(this.config.base && this.config.base.isInfinite);
  }

  protected calculateHasDuration() {
    return true;
  }

  protected splitDate(date: DateTime, reverse: boolean) {
    const dates = this.splitFn(date);

    let valid: boolean;

    if (dates.length === 0) {
      valid = false;
    } else if (dates.length === 1) {
      valid = date.duration === dates[0].duration;
    } else {
      valid = date.duration! === dates.reduce((prev, curr) => prev + curr.duration!, 0);
    }

    if (!valid) {
      throw new Error(
        'The provided SplitDurationOperator split function ' +
          'must return an array of DateTimes with length > 0 ' +
          'where the total duration of the new dates equals the duration of ' +
          'the original date.',
      );
    }

    dates.sort(dateTimeSortComparer);

    if (reverse) {
      dates.reverse();
    }

    return dates;
  }
}

function datePastEnd(
  date: DateTime,
  options: { reverse?: boolean; start?: DateTime; end?: DateTime },
) {
  return !!(options.reverse
    ? options.end && date.isBefore(options.end)
    : options.end && date.isAfter(options.end));
}

function datePastSkipToDate(date: DateTime, skipToDate: DateTime, options: { reverse?: boolean }) {
  return !!(options.reverse ? skipToDate.isAfterOrEqual(date) : skipToDate.isBeforeOrEqual(date));
}

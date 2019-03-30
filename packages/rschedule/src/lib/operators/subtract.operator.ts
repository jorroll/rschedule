import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IHasOccurrences, IRunArgs } from '../interfaces';
import { add } from './add.operator';
import { IOperatorConfig, Operator, OperatorFnOutput } from './interface';
import { IterableWrapper, streamPastEnd, streamPastSkipToDate } from './utilities';

const SUBTRACT_OPERATOR_ID = Symbol.for('66b1962f-32c5-4c16-9a9d-e69f52812ab8');

/**
 * An operator function, intended as an argument for
 * `occurrenceStream()`, which excludes the occurrences of input arguments from the
 * occurrences of the previous schedule's occurrences in the `occurrenceStream` pipe.
 *
 * @param inputs a spread of scheduling objects
 */
export function subtract<T extends typeof DateAdapter>(
  ...streams: IHasOccurrences<T>[]
): OperatorFnOutput<T> {
  return (options: IOperatorConfig<T>) => new SubtractOperator(streams, options);
}

export class SubtractOperator<T extends typeof DateAdapter> extends Operator<T> {
  static isSubtractOperator(object: unknown): object is SubtractOperator<any> {
    return !!(object && typeof object === 'object' && (object as any)[SUBTRACT_OPERATOR_ID]);
  }

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | undefined) {
    return new SubtractOperator(this._streams.map(stream => stream.set('timezone', value)), {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  *_run(args: IRunArgs = {}): IterableIterator<DateTime> {
    if (!this.config.base) return;

    const inclusion = new IterableWrapper(this.config.base._run(args));
    const exclusion = new IterableWrapper(
      add(...this._streams)({
        dateAdapter: this.config.dateAdapter,
        timezone: this.config.timezone,
      })._run(args),
    );

    cycleStreams(inclusion, exclusion, args);

    if (streamPastEnd(inclusion, args)) return;

    while (!inclusion.done) {
      const yieldArgs = yield this.normalizeRunOutput(inclusion.value);

      inclusion.picked();

      cycleStreams(inclusion, exclusion, args);

      if (yieldArgs && yieldArgs.skipToDate) {
        while (
          !streamPastEnd(inclusion, args) &&
          !streamPastSkipToDate(inclusion, yieldArgs.skipToDate, args)
        ) {
          inclusion.picked();
          cycleStreams(inclusion, exclusion, args);
        }
      }

      if (streamPastEnd(inclusion, args)) return;
    }
  }
}

function cycleStreams(
  inclusion: IterableWrapper,
  exclusion: IterableWrapper,
  options: { reverse?: boolean } = {},
) {
  iterateExclusion(inclusion, exclusion, options);

  while (!inclusion.done && !exclusion.done && inclusion.value.isEqual(exclusion.value)) {
    inclusion.picked();
    iterateExclusion(inclusion, exclusion, options);
  }
}

function iterateExclusion(
  inclusion: IterableWrapper,
  exclusion: IterableWrapper,
  options: { reverse?: boolean } = {},
) {
  if (options.reverse) {
    while (!exclusion.done && !inclusion.done && exclusion.value.isAfter(inclusion.value)) {
      exclusion.picked();
    }

    return;
  }

  while (!exclusion.done && !inclusion.done && exclusion.value.isBefore(inclusion.value)) {
    exclusion.picked();
  }
}

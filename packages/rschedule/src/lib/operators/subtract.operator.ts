import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IOccurrenceGenerator, IRunArgs } from '../interfaces';
import { add } from './add.operator';
import { IOperatorConfig, Operator, OperatorFnOutput } from './interface';
import { IterableWrapper, streamPastEnd, streamPastSkipToDate } from './utilities';

const SUBTRACT_OPERATOR_ID = Symbol.for('66b1962f-32c5-4c16-9a9d-e69f52812ab8');

/**
 * An operator function which accepts a spread of occurrence generators
 * and removes their occurrences from the output.
 *
 * @param streams a spread of occurrence generators
 */
export function subtract<T extends typeof DateAdapter>(
  ...streams: IOccurrenceGenerator<T>[]
): OperatorFnOutput<T> {
  return (options: IOperatorConfig<T>) => new SubtractOperator(streams, options);
}

export class SubtractOperator<T extends typeof DateAdapter> extends Operator<T> {
  static isSubtractOperator<T extends typeof DateAdapter = any>(
    object: unknown,
  ): object is SubtractOperator<T> {
    return !!(super.isOperator(object) && (object as any)[SUBTRACT_OPERATOR_ID]);
  }

  protected readonly [SUBTRACT_OPERATOR_ID] = true;

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
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

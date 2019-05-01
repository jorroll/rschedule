import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IRunArgs } from '../interfaces';
import { IOperatorConfig, Operator, OperatorFnOutput } from './interface';
import { IterableWrapper, streamPastEnd, streamPastSkipToDate } from './utilities';

const UNIQUE_OPERATOR_ID = Symbol.for('cba869a4-13bf-407a-9648-18cc66261231');

/**
 * An operator function which deduplicates an occurrence stream. Occurrence
 * `duration` is currently ignored.
 */
export function unique<T extends typeof DateAdapter>(): OperatorFnOutput<T> {
  return (options: IOperatorConfig<T>) => new UniqueOperator([], options);
}

export class UniqueOperator<T extends typeof DateAdapter> extends Operator<T> {
  static isUniqueOperator(object: unknown): object is UniqueOperator<any> {
    return !!(super.isOperator(object) && (object as any)[UNIQUE_OPERATOR_ID]);
  }

  protected readonly [UNIQUE_OPERATOR_ID] = true;

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
    return new UniqueOperator([], {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  /** @internal */
  *_run(args: IRunArgs = {}): IterableIterator<DateTime> {
    if (!this.config.base) return;

    const stream = new IterableWrapper(this.config.base._run(args));

    while (!stream.done) {
      const yieldArgs = yield this.normalizeRunOutput(stream.value);

      const lastValue = stream.value;

      stream.picked();

      if (yieldArgs && yieldArgs.skipToDate) {
        while (
          !streamPastEnd(stream, args) &&
          !streamPastSkipToDate(stream, yieldArgs.skipToDate, args)
        ) {
          stream.picked();
        }
      }

      while (!streamPastEnd(stream, args) && stream.value.isEqual(lastValue)) {
        stream.picked();
      }
    }
  }
}

import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { HasOccurrences, IHasOccurrences, IRunArgs, IRunnable } from '../interfaces';
import { IOperatorConfig, Operator, OperatorFnOutput } from './interface';
import {
  IterableWrapper,
  selectNextIterable,
  streamPastEnd,
  streamPastSkipToDate,
} from './utilities';

const ADD_OPERATOR_ID = Symbol.for('2898c208-e9a8-41a2-8627-2bc993ab376f');

/**
 * An operator function, intended as an argument for
 * `occurrenceStream()`, which gets the union of the previous
 * schedule's occurrences in the `occurrenceStream` pipe as well as the occurrences
 * of any input arguments.
 *
 * @param streams a spread of scheduling objects
 */
export function add<T extends typeof DateAdapter>(
  ...streams: IHasOccurrences<T>[]
): OperatorFnOutput<T> {
  return (options: IOperatorConfig<T>) => new AddOperator(streams, options);
}

export class AddOperator<T extends typeof DateAdapter> extends Operator<T> {
  static isAddOperator(object: unknown): object is AddOperator<any> {
    return !!(object && typeof object === 'object' && (object as any)[ADD_OPERATOR_ID]);
  }

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | undefined) {
    return new AddOperator(this._streams.map(stream => stream.set('timezone', value)), {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  *_run(args: IRunArgs = {}): IterableIterator<DateTime> {
    const streams = this._streams.map(input => new IterableWrapper(input._run(args)));

    if (this.config.base) {
      streams.push(new IterableWrapper(this.config.base._run(args)));
    }

    if (streams.length === 0) return;

    let stream = selectNextIterable(streams, args);

    if (streamPastEnd(stream, args)) return;

    while (!stream.done) {
      const yieldArgs = yield this.normalizeRunOutput(stream.value);

      stream.picked();

      stream = selectNextIterable(streams, args);

      if (yieldArgs && yieldArgs.skipToDate) {
        while (
          !streamPastEnd(stream, args) &&
          !streamPastSkipToDate(stream, yieldArgs.skipToDate, args)
        ) {
          stream.picked();
          stream = selectNextIterable(streams, args);
        }
      }

      if (streamPastEnd(stream, args)) return;
    }
  }
}

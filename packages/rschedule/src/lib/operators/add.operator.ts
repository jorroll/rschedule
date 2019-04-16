import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IOccurrenceGenerator, IRunArgs } from '../interfaces';
import { IOperatorConfig, Operator, OperatorFnOutput } from './interface';
import {
  IterableWrapper,
  selectNextIterable,
  streamPastEnd,
  streamPastSkipToDate,
} from './utilities';

const ADD_OPERATOR_ID = Symbol.for('2898c208-e9a8-41a2-8627-2bc993ab376f');

/**
 * An operator function which accepts a spread of occurrence generators
 * and adds their occurrences to the output.
 *
 * @param streams a spread of occurrence generators
 */
export function add<T extends typeof DateAdapter>(
  ...streams: IOccurrenceGenerator<T>[]
): OperatorFnOutput<T> {
  return (options: IOperatorConfig<T>) => new AddOperator(streams, options);
}

export class AddOperator<T extends typeof DateAdapter> extends Operator<T> {
  static isAddOperator(object: any): object is AddOperator<any> {
    return !!(super.isOperator(object) && (object as any)[ADD_OPERATOR_ID]);
  }

  protected readonly [ADD_OPERATOR_ID] = true;

  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
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

import {
  IOperatorConfig,
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
  Operator,
  OperatorFnOutput,
} from '../occurrence-generator';

import { IterableWrapper, selectNextIterable } from './_util';

/**
 * An operator function which accepts a spread of occurrence generators
 * and adds their occurrences to the output.
 *
 * @param streams a spread of occurrence generators
 */
export function add(...streams: OccurrenceGenerator[]): OperatorFnOutput {
  return (options: IOperatorConfig) => new AddOperator(streams, options);
}

export class AddOperator extends Operator {
  set(_: 'timezone', value: string | null): AddOperator {
    return new AddOperator(this.streams.map(stream => stream.set('timezone', value)), {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  *_run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    const wrappedStreams = this.streams.map(input => new IterableWrapper(input, args));

    if (this.config.base) {
      wrappedStreams.push(new IterableWrapper(this.config.base, args));
    }

    if (wrappedStreams.length === 0) return;

    let stream = selectNextIterable(wrappedStreams, args);

    while (stream && !stream.done) {
      // yield the current stream's value
      const yieldArgs = yield this.normalizeRunOutput(stream.value!);

      if (!(yieldArgs && yieldArgs.skipToDate)) {
        // iterate the current stream
        stream.next();
      }

      // select the next stream
      stream = selectNextIterable(wrappedStreams, args, yieldArgs);
    }
  }

  protected calculateIsInfinite(): boolean {
    return (
      (this.config.base && this.config.base.isInfinite) ||
      this.streams.some(stream => stream.isInfinite)
    );
  }

  protected calculateHasDuration(): boolean {
    const streamsDuration = this.streams.every(stream => stream.hasDuration);

    if (!this.config.base) return streamsDuration;

    return this.config.base.hasDuration && streamsDuration;
  }
}

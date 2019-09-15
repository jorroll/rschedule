import { DateTime } from '@rschedule/core';

import {
  IOperatorConfig,
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
  Operator,
  OperatorFnOutput,
} from '../occurrence-generator';

import { IterableWrapper, selectNextIterable, streamPastEnd, streamPastSkipToDate } from './_util';

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
  set(_: 'timezone', value: string | null) {
    return new AddOperator(this.streams.map(stream => stream.set('timezone', value)), {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  *_run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    const streams = this.streams.map(input => new IterableWrapper(input._run(args)));

    if (this.config.base) {
      streams.push(new IterableWrapper(this.config.base._run(args)));
    }

    if (streams.length === 0) return;

    let stream = selectNextIterable(streams, args);

    if (streamPastEnd(stream, args)) return;

    while (!stream.done) {
      const yieldArgs = yield this.normalizeRunOutput(stream.value!);

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

  protected calculateIsInfinite() {
    return (
      (this.config.base && this.config.base.isInfinite) ||
      this.streams.some(stream => stream.isInfinite)
    );
  }

  protected calculateHasDuration() {
    const streamsDuration = this.streams.every(stream => stream.hasDuration);

    if (!this.config.base) return streamsDuration;

    return this.config.base.hasDuration && streamsDuration;
  }
}

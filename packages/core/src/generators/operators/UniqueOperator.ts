import { DateTime } from '@rschedule/core';
import {
  IOperatorConfig,
  IRunArgs,
  OccurrenceGeneratorRunResult,
  Operator,
  OperatorFnOutput,
} from '../occurrence-generator';
import { IterableWrapper, streamPastEnd, streamPastSkipToDate } from './_util';

/**
 * An operator function which deduplicates an occurrence stream. Occurrence
 * `duration` is currently ignored.
 */
export function unique(): OperatorFnOutput {
  return (options: IOperatorConfig) => new UniqueOperator([], options);
}

export class UniqueOperator extends Operator {
  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
    return new UniqueOperator([], {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  *_run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    if (!this.config.base) return;

    const stream = new IterableWrapper(this.config.base._run(args));

    while (!stream.done) {
      const yieldArgs = yield this.normalizeRunOutput(stream.value!);

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

      while (!streamPastEnd(stream, args) && stream.value!.isEqual(lastValue)) {
        stream.picked();
      }
    }
  }

  protected calculateIsInfinite() {
    return !!(this.config.base && this.config.base.isInfinite);
  }

  protected calculateHasDuration() {
    return !!(this.config.base && this.config.base.hasDuration);
  }
}

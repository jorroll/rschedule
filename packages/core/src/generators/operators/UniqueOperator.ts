import {
  IOperatorConfig,
  IRunArgs,
  OccurrenceGeneratorRunResult,
  Operator,
  OperatorFnOutput,
} from '../occurrence-generator';
import { IterableWrapper } from './_util';

/**
 * An operator function which deduplicates an occurrence stream. Occurrence
 * `duration` is currently ignored.
 */
export function unique(): OperatorFnOutput {
  return (options: IOperatorConfig) => new UniqueOperator([], options);
}

export class UniqueOperator extends Operator {
  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null): UniqueOperator {
    return new UniqueOperator([], {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  *_run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    if (!this.config.base) return;

    const stream = new IterableWrapper(this.config.base, args);

    while (!stream.done) {
      const yieldArgs = yield this.normalizeRunOutput(stream.value!);

      const lastValue = stream.value;

      // iterate the current stream
      stream.next(yieldArgs);

      while (
        !(yieldArgs && yieldArgs.skipToDate) &&
        !stream.done &&
        stream.value!.isEqual(lastValue)
      ) {
        stream.next();
      }
    }
  }

  protected calculateIsInfinite(): boolean {
    return !!(this.config.base && this.config.base.isInfinite);
  }

  protected calculateHasDuration(): boolean {
    return !!(this.config.base && this.config.base.hasDuration);
  }
}

import { IRunNextArgs } from '@rschedule/core';
import {
  IOperatorConfig,
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
  Operator,
  OperatorFnOutput,
} from '../occurrence-generator';
import { IterableWrapper, processYieldArgs } from './_util';
import { AddOperator } from './AddOperator';

/**
 * An operator function which accepts a spread of occurrence generators
 * and removes their occurrences from the output.
 *
 * @param streams a spread of occurrence generators
 */
export function subtract(...streams: OccurrenceGenerator[]): OperatorFnOutput {
  return (options: IOperatorConfig) => new SubtractOperator(streams, options);
}

export class SubtractOperator extends Operator {
  /** Not actually used but necessary for IRunnable interface */
  set(_: 'timezone', value: string | null) {
    return new SubtractOperator(this.streams.map(stream => stream.set('timezone', value)), {
      ...this.config,
      base: this.config.base && this.config.base.set('timezone', value),
      timezone: value,
    });
  }

  *_run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    if (!this.config.base) return;

    const inclusion = new IterableWrapper(this.config.base, args);
    const exclusion = new IterableWrapper(
      new AddOperator(this.streams, {
        timezone: this.config.timezone,
      }),
      args,
    );

    cycleStreams(inclusion, exclusion, args);

    while (!inclusion.done) {
      const yieldArgs = yield this.normalizeRunOutput(inclusion.value!);

      if (!(yieldArgs && yieldArgs.skipToDate)) {
        inclusion.next();
      }

      cycleStreams(inclusion, exclusion, args, yieldArgs);
    }
  }

  protected calculateIsInfinite() {
    return !!(this.config.base && this.config.base.isInfinite);
  }

  protected calculateHasDuration() {
    return !!(this.config.base && this.config.base.hasDuration);
  }
}

function cycleStreams(
  inclusion: IterableWrapper,
  exclusion: IterableWrapper,
  options: { reverse?: boolean } = {},
  yieldArgs: IRunNextArgs = {},
) {
  processYieldArgs([inclusion, exclusion], options, yieldArgs);

  iterateExclusion(inclusion, exclusion, options);

  while (!inclusion.done && !exclusion.done && inclusion.value!.isEqual(exclusion.value)) {
    inclusion.next();
    iterateExclusion(inclusion, exclusion, options);
  }
}

function iterateExclusion(
  inclusion: IterableWrapper,
  exclusion: IterableWrapper,
  options: { reverse?: boolean } = {},
) {
  if (options.reverse) {
    while (!exclusion.done && !inclusion.done && exclusion.value!.isAfter(inclusion.value!)) {
      exclusion.next();
    }

    return;
  }

  while (!exclusion.done && !inclusion.done && exclusion.value!.isBefore(inclusion.value!)) {
    exclusion.next();
  }
}

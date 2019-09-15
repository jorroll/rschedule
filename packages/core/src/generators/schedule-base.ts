import { DateInput, DateTime } from '@rschedule/core';

import {
  CollectionIterator,
  ICollectionsArgs,
  IOccurrencesArgs,
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
  OccurrenceIterator,
} from './occurrence-generator';

import { Dates } from './dates';
import { RuleBase } from './rule-base';

type UnwrapArray<T extends ReadonlyArray<any>> = T extends ReadonlyArray<infer R> ? R : never;

export interface IScheduleBaseArgs<Data = any> {
  timezone?: string | null;
  data?: Data;
  maxDuration?: number;
}

export abstract class ScheduleBase<Data = any> extends OccurrenceGenerator {
  abstract readonly rrules: ReadonlyArray<RuleBase<any, any>>;
  abstract readonly exrules: ReadonlyArray<RuleBase<any, any>>;
  abstract readonly rdates: Dates;
  abstract readonly exdates: Dates;

  /**
   * Convenience property for holding arbitrary data.
   */
  data: Data;

  abstract readonly isInfinite: boolean;
  abstract readonly hasDuration: boolean;

  protected abstract readonly occurrenceStream: OccurrenceGenerator;

  /**
   * Create a new Schedule object with the specified options.
   *
   * The order of precidence for rrules, rdates, exrules, and exdates is:
   *
   * 1. rrules are included
   * 2. exrules are excluded
   * 3. rdates are included
   * 4. exdates are excluded
   *
   */
  constructor(options: IScheduleBaseArgs<Data>) {
    super(options);
    this.data = options.data as Data;
  }

  occurrences(
    args: IOccurrencesArgs = {},
  ): OccurrenceIterator<[this, UnwrapArray<this['rrules']> | this['rdates']]> {
    return new OccurrenceIterator(this, this.normalizeOccurrencesArgs(args));
  }

  collections(
    args: ICollectionsArgs = {},
  ): CollectionIterator<[this, UnwrapArray<this['rrules']> | this['rdates']]> {
    return new CollectionIterator(this, this.normalizeCollectionsArgs(args));
  }

  abstract add(prop: 'rrule' | 'exrule', value: RuleBase<any, any>): ScheduleBase<Data>;
  abstract add(prop: 'rdate' | 'exdate', value: DateInput): ScheduleBase<Data>;

  abstract remove(prop: 'rrule' | 'exrule', value: RuleBase<any, any>): ScheduleBase<Data>;
  abstract remove(prop: 'rdate' | 'exdate', value: DateInput): ScheduleBase<Data>;

  abstract set(
    prop: 'timezone',
    value: string | null,
    options?: { keepLocalTime?: boolean },
  ): ScheduleBase<Data>;
  abstract set(prop: 'rrules' | 'exrules', value: RuleBase<any, any>[]): ScheduleBase<Data>;
  abstract set(prop: 'rdates' | 'exdates', value: Dates): ScheduleBase<Data>;

  *_run(args: IRunArgs = {}): OccurrenceGeneratorRunResult {
    const count = args.take;

    delete args.take;

    const iterator = this.occurrenceStream._run(args);

    let date = iterator.next().value;
    let index = 0;

    while (date && (count === undefined || count > index)) {
      date = date.add(this, 'generator');

      const yieldArgs = yield this.normalizeRunOutput(date);

      date = iterator.next(yieldArgs).value;

      index++;
    }

    return undefined;
  }
}

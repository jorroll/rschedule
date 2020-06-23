import {
  cloneRuleOptions,
  DateTime,
  INormRuleOptionsBase,
  IRecurrenceRuleModule,
  IRuleOptionsBase,
  IRunNextArgs,
  normalizeRuleOptions,
  RecurrenceRulesIterator,
  recurrenceRulesReducer,
} from '@rschedule/core';

import { normalizeDateTimeTimezone } from '../utilities';

import {
  CollectionIterator,
  ICollectionsArgs,
  IOccurrencesArgs,
  IRunArgs,
  OccurrenceGenerator,
  OccurrenceGeneratorRunResult,
  OccurrenceIterator,
} from './occurrence-generator';

export interface IRuleArgs<D = any> {
  data?: D;
  timezone?: string | null;
  maxDuration?: number;
}

export abstract class RuleBase<
  Options extends IRuleOptionsBase,
  NOptions extends INormRuleOptionsBase,
  Data = any
  > extends OccurrenceGenerator {
  /**
   * Convenience property for holding arbitrary data. Accessible on individual DateAdapters
   * generated by this `Rule` object via the `DateAdapter#generators` property. Unlike
   * the rest of the `Rule` object, the data property is mutable.
   */
  data: Data;

  readonly isInfinite: boolean;

  readonly hasDuration: boolean;

  readonly duration: number | undefined;

  readonly timezone: string | null;

  readonly options: Options;

  protected readonly normOptions: NOptions;

  constructor(
    protected readonly recurrenceRules: readonly IRecurrenceRuleModule<any, any>[],
    config: Options,
    options: IRuleArgs<Data> = {},
  ) {
    super(options);

    this.options = cloneRuleOptions(config);

    this.normOptions = normalizeRuleOptions(this.recurrenceRules, this.options);

    this.timezone =
      options.timezone !== undefined ? options.timezone : this.normOptions.start.timezone;

    this.data = options.data as Data;

    this.hasDuration = !!config.duration;

    if (this.hasDuration) this.duration = config.duration;

    this.isInfinite = this.normOptions.end === undefined && this.normOptions.count === undefined;
  }

  occurrences(args: IOccurrencesArgs = {}): OccurrenceIterator<[this]> {
    return new OccurrenceIterator(this, this.normalizeOccurrencesArgs(args));
  }

  collections(args: ICollectionsArgs = {}): CollectionIterator<[this]> {
    return new CollectionIterator(this, this.normalizeCollectionsArgs(args));
  }

  /**
   * Rule's are immutable. This allows you to create a new Rule with an updated timezone
   * or rule option.
   *
   * ### Important!
   * When updating the rule's timezone, this does not change the *options* associated with this
   * `Rule`, so the rule is still processed using whatever timezone is
   * associated with the rule's `start` time. When the rule is run, and
   * a date is found to be valid, that date is only then converted to
   * the timezone you specify here and returned to you. If you wish
   * to update the timezone associated with the rule options, change the rule's
   * `start` time.
   */
  abstract set(
    prop: 'timezone',
    value: string | null,
    tzoptions?: { keepLocalTime?: boolean },
  ): RuleBase<Options, NOptions, Data>;
  abstract set(prop: 'options', value: Options): RuleBase<Options, NOptions, Data>;
  abstract set<Prop extends keyof Options>(
    prop: Prop,
    value: Options[Prop],
  ): RuleBase<Options, NOptions, Data>;

  *_run(rawArgs: IRunArgs = {}): OccurrenceGeneratorRunResult {
    const args = this.normalizeRunArgs(rawArgs);

    const iterator = new RecurrenceRulesIterator(
      recurrenceRulesReducer(this.recurrenceRules),
      this.normOptions,
      args,
    );

    let date = iterator.next().value;

    let index = 0;

    while (date && (args.take === undefined || index < args.take)) {
      index++;

      date = date.add(this, 'generator');

      const yieldArgs: IRunNextArgs | undefined = yield this.normalizeRunOutput(date);

      if (yieldArgs?.skipToDate) {
        // The RecurrenceRuleIterator might have a different timezone from the rule.
        // Because of this, the yieldArgs will not properly be normalized by the
        // OccurrenceIterator, so we need to do it here
        date = iterator.next({
          ...yieldArgs,
          skipToDate: normalizeDateTimeTimezone(yieldArgs.skipToDate, iterator.start.timezone),
        }).value;
      } else {
        // theoretically, the yieldArgs are undefined here
        // maybe in the future there will be other yieldArg options though
        date = iterator.next(yieldArgs).value;
      }
    }

    return undefined;
  }
}

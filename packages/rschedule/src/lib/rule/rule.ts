import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IRunArgs, OccurrenceGenerator } from '../interfaces';
import { OccurrenceStream, OperatorFnOutput, pipeFn } from '../operators';
import { PipeController } from './pipes';
import {
  cloneRuleOptions,
  INormalizedRuleOptions,
  IProvidedRuleOptions,
  normalizeRuleOptions,
} from './rule-options';

const RULE_ID = Symbol.for('c551fc52-0d8c-4fa7-a199-0ac417565b45');

export class Rule<T extends typeof DateAdapter, D = unknown> extends OccurrenceGenerator<T> {
  /**
   * Similar to `Array.isArray()`, `isRule()` provides a surefire method
   * of determining if an object is a `Rule` by checking against the
   * global symbol registry.
   */
  static isRule(object: unknown): object is Rule<any> {
    return !!(object && typeof object === 'object' && (object as any)[RULE_ID]);
  }

  pipe: (...operatorFns: OperatorFnOutput<T>[]) => OccurrenceStream<T> = pipeFn(this);

  /** Convenience property for holding arbitrary data */
  data: D;

  readonly isInfinite: boolean;

  readonly hasDuration: boolean;

  readonly duration: number | undefined;

  readonly timezone: string | null;

  readonly options: IProvidedRuleOptions<T>;

  protected readonly [RULE_ID] = true;

  private readonly processedOptions!: INormalizedRuleOptions;

  constructor(
    options: IProvidedRuleOptions<T>,
    args: { data?: D; dateAdapter?: T; timezone?: string | null } = {},
  ) {
    super(args);

    this.options = cloneRuleOptions(options);
    this.processedOptions = normalizeRuleOptions(this.dateAdapter, this.options);
    this.timezone =
      args.timezone !== undefined ? args.timezone : this.processedOptions.start.timezone;
    this.data = args.data!;
    this.hasDuration = !!options.duration;

    if (this.hasDuration) this.duration = options.duration;

    this.isInfinite =
      this.processedOptions.end === undefined && this.processedOptions.count === undefined;
  }

  /**
   * Allows you to change the timezone that dates are output in.
   *
   * ### Important!
   * This does not change the *options* associated with this
   * `Rule`, so the rule is still processed using whatever timezone is
   * associated with the rule's `start` time. When the rule is run, and
   * a date is found to be valid, that date is only then converted to
   * the timezone you specify here and returned to you.
   */
  set(_: 'timezone', value: string | null) {
    if (value === this.timezone) return this;

    return new Rule(this.options, {
      data: this.data,
      dateAdapter: this.dateAdapter,
      timezone: value,
    });
  }

  /**  @private use `occurrences()` instead */
  *_run(rawArgs: IRunArgs = {}): IterableIterator<DateTime> {
    const args = this.normalizeRunArgs(rawArgs);

    const controller = new PipeController(this.processedOptions, args);

    const iterator = controller._run();

    let date = iterator.next().value;

    let index = 0;

    while (date && (args.take === undefined || index < args.take)) {
      index++;

      date.generators.push(this);

      const yieldArgs = yield this.normalizeRunOutput(date);

      date = iterator.next(yieldArgs).value;
    }
  }
}

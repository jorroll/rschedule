import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { Dates } from '../dates';
import { DateInput, IRunArgs, OccurrenceGenerator } from '../interfaces';
import { OccurrenceIterator } from '../iterators';
import { add, OccurrenceStream, subtract, unique } from '../operators';
import { IProvidedRuleOptions, Rule } from '../rule';

const SCHEDULE_ID = Symbol.for('35d5d3f8-8924-43d2-b100-48e04b0cf500');

export class Schedule<T extends typeof DateAdapter, D = any> extends OccurrenceGenerator<T> {
  /**
   * Similar to `Array.isArray`, `isSchedule` provides a surefire method
   * of determining if an object is a `Schedule` by checking against the
   * global symbol registry.
   */
  static isSchedule(object: any): object is Schedule<any> {
    return !!(object && typeof object === 'object' && (object as any)[SCHEDULE_ID]);
  }

  // For some reason, error is thrown if typed as `readonly Rule<T>[]`
  readonly rrules: ReadonlyArray<Rule<T>> = [];
  readonly exrules: ReadonlyArray<Rule<T>> = [];
  readonly rdates: Dates<T>;
  readonly exdates: Dates<T>;

  /** Convenience property for holding arbitrary data */
  data!: D;

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  protected readonly [SCHEDULE_ID] = true;

  private readonly occurrenceStream: OccurrenceStream<T>;

  constructor(
    args: {
      dateAdapter?: T;
      timezone?: string | null;
      data?: D;
      rrules?: ReadonlyArray<IProvidedRuleOptions<T> | Rule<T>>;
      exrules?: ReadonlyArray<IProvidedRuleOptions<T> | Rule<T>>;
      rdates?: DateInput<T>[] | Dates<T>;
      exdates?: DateInput<T>[] | Dates<T>;
    } = {},
  ) {
    super(args);

    if (args.data) {
      this.data = args.data;
    }

    if (args.rrules) {
      this.rrules = args.rrules.map(ruleArgs => {
        if (Rule.isRule(ruleArgs)) {
          return ruleArgs.set('timezone', this.timezone);
        } else {
          return new Rule(ruleArgs, {
            dateAdapter: this.dateAdapter as any,
            timezone: this.timezone,
          });
        }
      });
    }

    if (args.exrules) {
      this.exrules = args.exrules.map(ruleArgs => {
        if (Rule.isRule(ruleArgs)) {
          return ruleArgs.set('timezone', this.timezone);
        } else {
          return new Rule(ruleArgs, {
            dateAdapter: this.dateAdapter as any,
            timezone: this.timezone,
          });
        }
      });
    }

    if (args.rdates) {
      this.rdates = Dates.isDates(args.rdates)
        ? args.rdates.set('timezone', this.timezone)
        : new Dates({
            dates: args.rdates,
            dateAdapter: this.dateAdapter as any,
            timezone: this.timezone,
          });
    } else {
      this.rdates = new Dates({ dateAdapter: this.dateAdapter as any, timezone: this.timezone });
    }

    if (args.exdates) {
      this.exdates = Dates.isDates(args.exdates)
        ? args.exdates.set('timezone', this.timezone)
        : new Dates({
            dates: args.exdates,
            dateAdapter: this.dateAdapter as any,
            timezone: this.timezone,
          });
    } else {
      this.exdates = new Dates({ dateAdapter: this.dateAdapter as any, timezone: this.timezone });
    }

    this.hasDuration =
      this.rrules.every(rule => rule.hasDuration) &&
      this.exrules.every(rule => rule.hasDuration) &&
      this.rdates.hasDuration &&
      this.exdates.hasDuration;

    this.isInfinite = this.rrules.some(rule => rule.isInfinite);

    this.occurrenceStream = new OccurrenceStream({
      operators: [
        add<T>(...this.rrules),
        subtract<T>(...this.exrules),
        add<T>(this.rdates),
        subtract<T>(this.exdates),
        unique<T>(),
      ],
      dateAdapter: this.dateAdapter,
      timezone: this.timezone,
    });
  }

  add(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): Schedule<T, D>;
  add(prop: 'rdate' | 'exdate', value: DateInput<T>): Schedule<T, D>;
  add(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: Rule<T, unknown> | DateInput<T>) {
    const rrules = this.rrules.slice();
    const exrules = this.exrules.slice();
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'rrule':
        rrules.push(value as Rule<T, unknown>);
        break;
      case 'exrule':
        exrules.push(value as Rule<T, unknown>);
        break;
      case 'rdate':
        rdates = this.rdates.add(value as DateInput<T>);
        break;
      case 'exdate':
        exdates = this.exdates.add(value as DateInput<T>);
        break;
    }

    return new Schedule({
      dateAdapter: this.dateAdapter,
      timezone: this.timezone,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  remove(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): Schedule<T, D>;
  remove(prop: 'rdate' | 'exdate', value: DateInput<T>): Schedule<T, D>;
  remove(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: Rule<T, unknown> | DateInput<T>) {
    let rrules = this.rrules;
    let exrules = this.exrules;
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'rrule':
        rrules = rrules.filter(rule => rule !== value);
        break;
      case 'exrule':
        exrules = exrules.filter(rule => rule !== value);
        break;
      case 'rdate':
        rdates = this.rdates.remove(value as DateInput<T>);
        break;
      case 'exdate':
        exdates = this.exdates.remove(value as DateInput<T>);
        break;
    }

    return new Schedule({
      dateAdapter: this.dateAdapter,
      timezone: this.timezone,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  set(prop: 'timezone', value: string | null): Schedule<T, D>;
  set(prop: 'rrules' | 'exrules', value: Rule<T, unknown>[]): Schedule<T, D>;
  set(prop: 'rdates' | 'exdates', value: Dates<T, unknown>): Schedule<T, D>;
  set(
    prop: 'timezone' | 'rrules' | 'exrules' | 'rdates' | 'exdates',
    value: string | null | Rule<T, unknown>[] | Dates<T, unknown>,
  ) {
    let timezone = this.timezone;
    let rrules = this.rrules;
    let exrules = this.exrules;
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'timezone':
        if (value === this.timezone) return this;
        timezone = value as string | null;
        break;
      case 'rrules':
        rrules = value as Rule<T, unknown>[];
        break;
      case 'exrules':
        exrules = value as Rule<T, unknown>[];
        break;
      case 'rdates':
        rdates = value as Dates<T, unknown>;
        break;
      case 'exdates':
        exdates = value as Dates<T, unknown>;
        break;
    }

    return new Schedule({
      dateAdapter: this.dateAdapter,
      timezone,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  /**  @private use occurrences() instead */
  *_run(args: IRunArgs = {}): IterableIterator<DateTime> {
    const count = args.take;

    delete args.take;

    const iterator = this.occurrenceStream._run(args);

    let date = iterator.next().value;
    let index = 0;

    while (date && (count === undefined || count > index)) {
      date.generators.push(this);

      const yieldArgs = yield this.normalizeRunOutput(date);

      date = iterator.next(yieldArgs).value;

      index++;
    }
  }
}

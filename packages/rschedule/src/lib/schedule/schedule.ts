import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { Dates } from '../dates';
import { DateInput, HasOccurrences, IOccurrencesArgs, IRunArgs } from '../interfaces';
import { OccurrenceIterator } from '../iterators';
import { add, OccurrenceStream, subtract, unique } from '../operators';
import { IProvidedRuleOptions, Rule } from '../rule';

const SCHEDULE_ID = Symbol.for('35d5d3f8-8924-43d2-b100-48e04b0cf500');

export class Schedule<T extends typeof DateAdapter, D = any> extends HasOccurrences<T> {
  /**
   * Similar to `Array.isArray`, `isSchedule` provides a surefire method
   * of determining if an object is a `Schedule` by checking against the
   * global symbol registry.
   */
  static isSchedule(object: any): object is Schedule<any> {
    return !!(object && typeof object === 'object' && (object as any)[SCHEDULE_ID]);
  }

  rrules: Rule<T>[] = [];
  exrules: Rule<T>[] = [];
  rdates: Dates<T>;
  exdates: Dates<T>;

  /** Convenience property for holding arbitrary data */
  data!: D;

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  protected readonly [SCHEDULE_ID] = true;

  private occurrenceStream: OccurrenceStream<T>;

  constructor(
    args: {
      dateAdapter?: T;
      timezone?: string | null;
      data?: D;
      rrules?: Array<IProvidedRuleOptions<T> | Rule<T>>;
      exrules?: Array<IProvidedRuleOptions<T> | Rule<T>>;
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

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  occursOn(rawArgs: { date: DateInput<T> }): boolean;
  /**
   * **DOES NOT CURRENTLY TAKE INTO ACCOUNT EXRULES.**
   *
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  // tslint:disable-next-line: unified-signatures
  occursOn(rawArgs: {
    weekday: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean;

  occursOn(rawArgs: {
    date?: DateInput<T>;
    weekday?: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean {
    const args = this.processOccursOnArgs(rawArgs);

    if (args.weekday) {
      const before =
        args.before && (args.excludeEnds ? args.before.subtract(1, 'day') : args.before);
      const after = args.after && (args.excludeEnds ? args.after.add(1, 'day') : args.after);

      // Filter to get relevant exdates
      const excludeDates = this.exdates.adapters.filter(adapter => {
        const date = adapter.toDateTime();

        return (
          date.get('weekday') === args.weekday &&
          (!after || date.isAfterOrEqual(after)) &&
          (!before || date.isBeforeOrEqual(before))
        );
      });

      const rules: Array<Rule<T> | Dates<T>> = this.rrules.slice();

      rules.push(this.rdates);

      return rules.some(rule =>
        rule.occursOn({
          ...(args as { weekday: IDateAdapter.Weekday }),
          excludeDates,
        }),
      );
    }

    for (const day of this._run({ start: args.date, end: args.date })) {
      return !!day;
    }

    return false;
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

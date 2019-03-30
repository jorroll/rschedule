import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { DateInput, HasOccurrences, IOccurrencesArgs, IRunArgs } from '../interfaces';
import { OccurrenceIterator } from '../iterators';
import { PipeController } from './pipes';
import {
  INormalizedRuleOptions,
  IProvidedRuleOptions,
  normalizeRuleOptions,
  RuleOption,
} from './rule-options';

const RULE_ID = Symbol.for('c551fc52-0d8c-4fa7-a199-0ac417565b45');

export class Rule<T extends typeof DateAdapter, D = unknown> extends HasOccurrences<T> {
  /**
   * Similar to `Array.isArray()`, `isRule()` provides a surefire method
   * of determining if an object is a `Rule` by checking against the
   * global symbol registry.
   */
  static isRule(object: unknown): object is Rule<any> {
    return !!(object && typeof object === 'object' && (object as any)[RULE_ID]);
  }

  /** Convenience property for holding arbitrary data */
  data: D;

  readonly isInfinite: boolean;

  readonly hasDuration: boolean;

  readonly duration: number | undefined;

  readonly timezone: string | undefined;

  readonly options: IProvidedRuleOptions<T>;

  protected readonly [RULE_ID] = true;

  private readonly processedOptions!: INormalizedRuleOptions;

  constructor(
    options: IProvidedRuleOptions<T>,
    args: { data?: D; dateAdapter?: T; timezone?: string } = {},
  ) {
    super(args);

    this.options = Object.freeze({ ...options });
    this.processedOptions = normalizeRuleOptions(this.dateAdapter, this.options);
    this.timezone = args.hasOwnProperty('timezone')
      ? args.timezone
      : this.processedOptions.start.timezone;
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
   * the timezone you specify here and returned to you. If you want to actually change
   * the rule options, you must create a new rule manually.
   */
  set(_: 'timezone', value: string | undefined) {
    if (value === this.timezone) return this;

    return new Rule(this.options, {
      data: this.data,
      dateAdapter: this.dateAdapter,
      timezone: value,
    });
  }

  occurrences(args: IOccurrencesArgs<T> = {}): OccurrenceIterator<T> {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args));
  }

  /**
   *   Checks to see if an occurrence exists which equals the given date.
   */
  occursOn(rawArgs: { date: DateInput<T> }): boolean;
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   * - `excludeDates` argument can be provided which limits the possible occurrences
   *   to ones not equal to a date in the `excludeDates` array.
   */
  // tslint:disable-next-line: unified-signatures
  occursOn(rawArgs: {
    weekday: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
    excludeDates?: DateInput<T>[];
  }): boolean;
  occursOn(rawArgs: {
    date?: DateInput<T>;
    weekday?: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
    excludeDates?: DateInput<T>[];
  }): boolean {
    const args = this.processOccursOnArgs(rawArgs);

    if (args.weekday) {
      return this.occursOnWeekday(args);
    }

    if (this.hasDuration) {
      const duration = this.processedOptions.duration!;

      for (const day of this._run({
        start: args.date!.subtract(duration, 'millisecond'),
        end: args.date,
      })) {
        return !!day;
      }
    } else {
      for (const day of this._run({ start: args.date, end: args.date })) {
        return !!day;
      }
    }

    return false;
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

  private occursOnWeekday(args: {
    weekday?: IDateAdapter.Weekday;
    after?: DateTime;
    before?: DateTime;
    excludeEnds?: boolean;
    excludeDates?: DateTime[];
  }) {
    const weekday = args.weekday!;

    if (
      this.processedOptions.byDayOfWeek &&
      !this.processedOptions.byDayOfWeek.some(day =>
        typeof day === 'string' ? day === weekday : day[0] === weekday,
      )
    ) {
      // The rule specificly does not occur on the given day
      return false;
    }

    let end: DateTime | undefined;

    const before = args.before && (args.excludeEnds ? args.before.subtract(1, 'day') : args.before);

    const after = args.after && (args.excludeEnds ? args.after.add(1, 'day') : args.after);

    if (this.processedOptions.end && before) {
      end = before.isBefore(this.processedOptions.end) ? before : this.processedOptions.end;
    } else if (this.processedOptions.end) {
      end = this.processedOptions.end;
    } else if (before) {
      end = before;
    }

    if (
      end &&
      (end.isBefore(this.processedOptions.start) || end.isBefore(this.processedOptions.start))
    ) {
      return false;
    }

    if (!end) {
      end = this.processedOptions.start.add(
        this.processedOptions.frequency === 'YEARLY' ? this.processedOptions.interval * 11 : 11,
        'year',
      );
    }

    // This function allows for an "intelligent" brute forcing of occurrences.
    // For rules with a frequency less than a day, it only checks one
    // iteration on any given day.
    const bruteForceCheck = () => {
      let date = getNextDateNotInExdates(args.excludeDates, after, end);

      if (date && date.get('weekday') === weekday) {
        return true;
      }

      while (date) {
        date = date.granularity('day').add(24, 'hour');

        date = getNextDateNotInExdates(args.excludeDates, date, end);

        if (date && date.get('weekday') === weekday) {
          return true;
        }
      }

      return false;
    };

    const getNextDateNotInExdates = (
      exdates?: Array<DateTime>,
      start?: DateTime,
      end?: DateTime,
    ) => {
      let date = this._run({ start, end }).next().value;

      if (!exdates || exdates.length === 0) {
        return date;
      }

      while (date && exdates.some(exdate => exdate.isEqual(date))) {
        date = date.granularity('day').add(24, 'hour');

        date = this._run({ start: date, end }).next().value;
      }

      return date;
    };

    return bruteForceCheck();
  }

  private normalizeRunArgs(args: IRunArgs) {
    return {
      ...args,
      start: this.normalizeDateInput(args.start),
      end: this.normalizeDateInput(args.end),
    };
  }
}

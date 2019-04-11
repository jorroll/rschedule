import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { OccurrenceIterator } from '../iterators/occurrence.iterator';
import { RScheduleConfig } from '../rschedule-config';
import { RuleOption } from '../rule';
import { ConstructorReturnType } from '../utilities';
import { IRunArgs, IRunnable } from './runnable';

export interface IHasOccurrences<T extends typeof DateAdapter> extends IRunnable<T> {
  readonly dateAdapter: T;
  readonly timezone: string | null;

  occurrences(args: IOccurrencesArgs<T>): OccurrenceIterator<T>;
  occursBetween(
    start: DateInput<T>,
    end: DateInput<T>,
    options: { excludeEnds?: boolean },
  ): boolean;
  occursOn(args: { date: DateInput<T> }): boolean;
  // tslint:disable-next-line: unified-signatures
  occursOn(args: {
    weekday: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean;
  occursAfter(date: DateInput<T>, options: { excludeStart?: boolean }): boolean;
  occursBefore(date: DateInput<T>, options: { excludeStart?: boolean }): boolean;

  set(prop: 'timezone', value: string | null): IHasOccurrences<T>;
}

export abstract class HasOccurrences<T extends typeof DateAdapter>
  implements IRunnable<T>, IHasOccurrences<T> {
  abstract readonly isInfinite: boolean;
  abstract readonly hasDuration: boolean;

  readonly timezone: string | null;
  readonly dateAdapter: T;

  /** Returns the first occurrence or, if there are no occurrences, null. */
  get firstDate(): ConstructorReturnType<T> | null {
    const start = this._run().next().value;

    if (!start) return null;

    return this.dateAdapter.fromJSON(start.toJSON()) as ConstructorReturnType<T>;
  }

  /** If generator is infinite, returns `null`. Otherwise returns the end date */
  get lastDate(): ConstructorReturnType<T> | null {
    if (this.isInfinite) return null;

    const end = this._run({ reverse: true }).next().value;

    if (!end) return null;

    return this.dateAdapter.fromJSON(end.toJSON()) as ConstructorReturnType<T>;
  }

  constructor(args: { dateAdapter?: T; timezone?: string | null }) {
    if (args.dateAdapter) {
      this.dateAdapter = args.dateAdapter as any;
    } else {
      this.dateAdapter = RScheduleConfig.defaultDateAdapter as any;
    }

    if (!this.dateAdapter) {
      throw new Error("Oops! You've initialized an occurrences object without a dateAdapter.");
    }

    this.timezone = args.timezone !== undefined ? args.timezone : RScheduleConfig.defaultTimezone;
  }

  /**
   * Processes object and returns an iterable for the occurrences.
   *
   * Options object:
   * - `start` the date to begin iteration on
   * - `end` the date to end iteration on
   * - `take` the max number of dates to take before ending iteration
   * - `reverse` whether to iterate in reverse or not
   * 
   * Examples:
   * 
   ```
   const iterator = schedule.occurrences()
   
   for (const date of iterator) {
     // do stuff
   }

   iterator.toArray()
   iterator.next().value
   ```
   *
   * @param arg `OccurrencesArgs` options object
   */
  occurrences(args: IOccurrencesArgs<T> = {}): OccurrenceIterator<T> {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args));
  }

  occursBetween(
    startInput: DateInput<T>,
    endInput: DateInput<T>,
    options: { excludeEnds?: boolean } = {},
  ) {
    const start = this.normalizeDateInput(startInput);
    const end = this.normalizeDateInput(endInput);

    for (const day of this._run({ start, end })) {
      if (options.excludeEnds) {
        if (day.isEqual(start)) {
          continue;
        }

        if (day.isEqual(end)) {
          break;
        }
      }

      return true;
    }
    return false;
  }

  abstract set(prop: 'timezone', value: string | null): HasOccurrences<T>;

  abstract _run(args?: IRunArgs): IterableIterator<DateTime>;

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  abstract occursOn(args: { date: DateInput<T> }): boolean;
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  abstract occursOn(args: {
    weekday: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean;

  occursAfter(date: DateInput<T>, options: { excludeStart?: boolean } = {}) {
    const adapter = this.normalizeDateInput(date);

    for (const day of this._run({ start: adapter })) {
      if (options.excludeStart && day.isEqual(adapter)) {
        continue;
      }
      return true;
    }

    return false;
  }

  occursBefore(date: DateInput<T>, options: { excludeStart?: boolean } = {}) {
    const adapter = this.normalizeDateInput(date);

    for (const day of this._run({ start: adapter, reverse: true })) {
      if (options.excludeStart && day.isEqual(adapter)) {
        continue;
      }
      return true;
    }

    return false;
  }

  protected processOccurrencesArgs(rawArgs: IOccurrencesArgs<T>) {
    return {
      ...rawArgs,
      start: this.normalizeDateInput(rawArgs.start),
      end: this.normalizeDateInput(rawArgs.end),
    };
  }

  protected processOccursOnArgs(
    rawArgs: {
      date?: DateInput<T>;
      duration?: RuleOption.Duration;
      weekday?: IDateAdapter.Weekday;
      after?: DateInput<T>;
      before?: DateInput<T>;
      excludeEnds?: boolean;
      excludeDates?: Array<DateInput<T>>;
    } = {},
  ): {
    date?: DateTime;
    duration?: RuleOption.Duration;
    weekday?: IDateAdapter.Weekday;
    after?: DateTime;
    before?: DateTime;
    excludeEnds?: boolean;
    excludeDates?: DateTime[];
  } {
    return {
      ...rawArgs,
      date: this.normalizeDateInput(rawArgs.date),
      after: this.normalizeDateInput(rawArgs.after),
      before: this.normalizeDateInput(rawArgs.before),
      excludeDates:
        rawArgs.excludeDates &&
        rawArgs.excludeDates.map(date => this.normalizeDateInput(date) as DateTime),
    };
  }

  protected normalizeDateInput(date: DateInput<T>): DateTime;
  protected normalizeDateInput(date?: DateInput<T>): undefined;
  protected normalizeDateInput(date?: DateInput<T>) {
    if (!date) {
      return;
    } else if (DateTime.isInstance(date)) {
      if (date.timezone !== this.timezone) {
        return this.dateAdapter
          .fromJSON(date.toJSON())
          .set('timezone', this.timezone)
          .toDateTime();
      }

      return date;
    }

    return DateAdapter.isInstance(date)
      ? date.set('timezone', this.timezone).toDateTime()
      : new this.dateAdapter(date).set('timezone', this.timezone).toDateTime();
  }

  protected normalizeRunOutput(date: DateTime) {
    if (date.timezone !== this.timezone) {
      return this.dateAdapter
        .fromJSON(date.toJSON())
        .set('timezone', this.timezone)
        .toDateTime();
    }

    return date;
  }
}

export type DateInput<T extends typeof DateAdapter> =
  | T['date']
  | ConstructorReturnType<T>
  | DateTime;

export interface IOccurrencesArgs<T extends typeof DateAdapter> {
  start?: DateInput<T>;
  end?: DateInput<T>;
  take?: number;
  reverse?: boolean;
  datetime?: boolean;
}

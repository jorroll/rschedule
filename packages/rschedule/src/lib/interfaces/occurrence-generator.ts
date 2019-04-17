import { ArgumentError, ConstructorReturnType } from '../basic-utilities';
import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import {
  CollectionIterator,
  ICollectionsArgs,
  IOccurrencesArgs,
  OccurrenceIterator,
} from '../iterators';
import { RScheduleConfig } from '../rschedule-config';
import { getDifferenceBetweenWeekdays } from '../rule/pipes';
import {
  DateInput,
  dateInputToDateAdapter,
  dateInputToDateTime,
  normalizeDateTimeTimezone,
} from '../utilities';
import { IRunArgs, IRunnable } from './runnable';

export interface IOccurrenceGenerator<T extends typeof DateAdapter> extends IRunnable<T> {
  readonly dateAdapter: T;
  readonly timezone: string | null;

  occurrences(args: IOccurrencesArgs<T>): OccurrenceIterator<T>;

  collections(args: ICollectionsArgs<T>): CollectionIterator<T>;

  occursBetween(
    start: DateInput<T>,
    end: DateInput<T>,
    options: { excludeEnds?: boolean },
  ): boolean;

  occursOn(args: { date: DateInput<T> }): boolean;
  occursOn(args: {
    weekday: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean;

  occursAfter(date: DateInput<T>, options: { excludeStart?: boolean }): boolean;

  occursBefore(date: DateInput<T>, options: { excludeStart?: boolean }): boolean;

  pipe(...operators: unknown[]): IOccurrenceGenerator<T>;

  set(prop: 'timezone', value: string | null): IOccurrenceGenerator<T>;
}

export abstract class OccurrenceGenerator<T extends typeof DateAdapter>
  implements IRunnable<T>, IOccurrenceGenerator<T> {
  abstract readonly isInfinite: boolean;
  abstract readonly hasDuration: boolean;

  readonly timezone: string | null;
  readonly dateAdapter: T;

  /** Returns the first occurrence or, if there are no occurrences, null. */
  get firstDate(): ConstructorReturnType<T> | null {
    const start = this._run().next().value;

    if (!start) return null;

    return this.dateAdapter.fromDateTime(start) as ConstructorReturnType<T>;
  }

  /** If generator is infinite, returns `null`. Otherwise returns the end date */
  get lastDate(): ConstructorReturnType<T> | null {
    if (this.isInfinite) return null;

    const end = this._run({ reverse: true }).next().value;

    if (!end) return null;

    return this.dateAdapter.fromDateTime(end) as ConstructorReturnType<T>;
  }

  constructor(args: { dateAdapter?: T; timezone?: string | null }) {
    this.dateAdapter = args.dateAdapter || (RScheduleConfig.defaultDateAdapter as any);

    if (!this.dateAdapter) {
      throw new ArgumentError(
        "Oops! You've initialized an `OccurrenceGenerator` without a dateAdapter.",
      );
    }

    this.timezone = args.timezone !== undefined ? args.timezone : RScheduleConfig.defaultTimezone;
  }

  abstract pipe(...operators: unknown[]): OccurrenceGenerator<T>;

  abstract set(prop: 'timezone', value: string | null): OccurrenceGenerator<T>;

  abstract _run(args?: IRunArgs): IterableIterator<DateTime>;

  /**
   * Processes the object's rules/dates and returns an iterable for the occurrences.
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
   const iterator = schedule.occurrences({ start: new Date(), take: 5 })
   
   for (const date of iterator) {
     // do stuff
   }

   iterator.toArray() // returns Date array
   iterator.next().value // returns next Date
   ```
   * 
   */
  occurrences(args: IOccurrencesArgs<T> = {}): OccurrenceIterator<T> {
    return new OccurrenceIterator(this, this.normalizeOccurrencesArgs(args));
  }

  /**
   * Iterates over the object's occurrences and bundles them into collections
   * with a specified granularity (default is `"INSTANTANIOUS"`). Make sure to
   * read about each option & combination of options below.
   *
   * Options object:
   *   - start?: DateAdapter
   *   - end?: DateAdapter
   *   - take?: number
   *   - reverse?: NOT SUPPORTED
   *   - granularity?: CollectionsGranularity
   *   - weekStart?: IDateAdapter.Weekday
   *   - incrementLinearly?: boolean
   *
   * Returned `Collection` object:
   *
   *   - `dates` property containing an array of DateAdapter objects.
   *   - `granularity` property containing the granularity.
   *     - `CollectionsGranularity` type extends `RuleOptions.Frequency` type by adding
   *       `"INSTANTANIOUS"`.
   *   - `periodStart` property containing a DateAdapter equal to the period's
   *     start time.
   *   - `periodEnd` property containing a DateAdapter equal to the period's
   *     end time.
   *
   * #### Details:
   *
   * `collections()` always returns full periods. This means that the `start` argument is
   * transformed to be the start of whatever period the `start` argument is in, and the
   * `end` argument is transformed to be the end of whatever period the `end` argument is
   * in.
   *
   * - Example: with granularity `"YEARLY"`, the `start` argument will be transformed to be the
   *   start of the year passed in the `start` argument, and the `end` argument will be transformed
   *   to be the end of the year passed in the `end` argument.
   *
   * By default, the `periodStart` value of `Collection` objects produced by this method does not
   * necessarily increment linearly. A collection will *always* contain at least one date,
   * so the `periodStart` from one collection to the next can "jump". This can be changed by
   * passing the `incrementLinearly: true` option. With this argument, `collections()` will
   * return `Collection` objects for each period in linear succession, even if a collection object
   * has no dates associated with it, so long as the object generating occurrences still has upcoming occurrences.
   *
   * - Example 1: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({granularity: 'DAILY', start: new Date(2019,0,1)})`
   *   (so starting on January 1st), the first Collection produced will have a `periodStart` in February.
   *
   * - Example 2: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({incrementLinearly: true, granularity: 'DAILY', start: new Date(2019,0,1)})`
   *   (so starting on January 1st), the first collection produced will have a `Collection#periodStart`
   *   of January 1st and have `Collection#dates === []`. Similarly, the next 30 collections produced
   *   (Jan 2nd - 31st) will all contain an empty array for the `dates` property. Then the February 1st
   *   `Collection` will contain dates.
   *
   * When giving a `take` argument to `collections()`, you are specifying
   * the number of `Collection` objects to return (rather than occurrences).
   *
   * When choosing a granularity of `"WEEKLY"`, the `weekStart` option is required.
   *
   * When choosing a granularity of `"MONTHLY"`:
   *
   * - If the `weekStart` option *is not* present, will generate collections with
   *   the `periodStart` and `periodEnd` at the beginning and end of each month.
   *
   * - If the `weekStart` option *is* present, will generate collections with the
   *   `periodStart` equal to the start of the first week of the month, and the
   *   `periodEnd` equal to the end of the last week of the month. This behavior could be
   *   desired when rendering opportunities in a calendar view, where the calendar renders
   *   full weeks (which may result in the calendar displaying dates in the
   *   previous or next months).
   *
   */
  collections(args: ICollectionsArgs<T> = {}): CollectionIterator<T> {
    return new CollectionIterator(this, this.normalizeCollectionsArgs(args));
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

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  occursOn(args: { date: DateInput<T> }): boolean;
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * **If there are infinite occurrences, you must include a `before` argument with
   * the `weekday` argument.**
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  occursOn(args: {
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
    const args = this.normalizeOccursOnArgs(rawArgs);

    if (args.weekday) {
      if (this.isInfinite && !args.before) {
        throw new ArgumentError(
          'When calling `occursOn()` with a `weekday` argument ' +
            'and an occurrence object that has infinite occurrences, ' +
            'you must include a `before` argument as well.',
        );
      }

      const start = args.after && (args.excludeEnds ? args.after.add(1, 'day') : args.after);
      const end = args.before && (args.excludeEnds ? args.before.subtract(1, 'day') : args.before);
      const iterator = this._run({ start, end });

      let date = iterator.next().value;

      if (!date) return false;

      while (date) {
        if (date.get('weekday') === args.weekday) {
          return true;
        }

        date = iterator.next({
          skipToDate: date
            .add(getDifferenceBetweenWeekdays(date.get('weekday'), args.weekday), 'day')
            .granularity('day'),
        }).value;
      }

      return false;
    }

    for (const day of this._run({ start: args.date, end: args.date })) {
      return !!day;
    }

    return false;
  }

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

  protected normalizeOccurrencesArgs(rawArgs: IOccurrencesArgs<T>) {
    return {
      ...rawArgs,
      start: this.normalizeDateInput(rawArgs.start),
      end: this.normalizeDateInput(rawArgs.end),
    };
  }

  protected normalizeCollectionsArgs(rawArgs: ICollectionsArgs<T>) {
    if (rawArgs.reverse !== undefined) {
      throw new ArgumentError(
        '`collections()` does not support the `reverse` option at this time.',
      );
    }

    return {
      ...rawArgs,
      start: this.normalizeDateInput(rawArgs.start),
      end: this.normalizeDateInput(rawArgs.end),
    };
  }

  protected normalizeOccursOnArgs(
    rawArgs: {
      date?: DateInput<T>;
      weekday?: IDateAdapter.Weekday;
      after?: DateInput<T>;
      before?: DateInput<T>;
      excludeEnds?: boolean;
      excludeDates?: Array<DateInput<T>>;
    } = {},
  ) {
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

  protected normalizeRunArgs(args: IRunArgs) {
    return {
      ...args,
      start: this.normalizeDateInput(args.start),
      end: this.normalizeDateInput(args.end),
    };
  }

  protected normalizeDateInput(date: DateInput<T>): DateTime;
  protected normalizeDateInput(date?: DateInput<T>): undefined;
  protected normalizeDateInput(date?: DateInput<T>) {
    if (!date) return;

    return dateInputToDateTime(date, this.timezone, this.dateAdapter);
  }

  protected normalizeDateInputToAdapter(date: DateInput<T>): ConstructorReturnType<T>;
  protected normalizeDateInputToAdapter(date?: DateInput<T>): undefined;
  protected normalizeDateInputToAdapter(date?: DateInput<T>) {
    if (!date) return;

    return dateInputToDateAdapter(date, this.dateAdapter);
  }

  protected normalizeRunOutput(date: DateTime) {
    return normalizeDateTimeTimezone(date, this.timezone, this.dateAdapter);
  }
}

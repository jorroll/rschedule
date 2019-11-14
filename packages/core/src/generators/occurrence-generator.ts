import {
  ArgumentError,
  DateAdapter,
  DateAdapterBase,
  DateInput,
  dateInputToDateAdapter,
  dateInputToDateTime,
  DateTime,
  getDifferenceBetweenWeekdays,
  InfiniteLoopError,
  normalizeDateTimeTimezone,
} from '@rschedule/core';

export interface IRunArgs {
  start?: DateTime;
  end?: DateTime;
  take?: number;
  reverse?: boolean;
}

export type OccurrenceGeneratorRunResult = IterableIterator<DateTime>;

export abstract class OccurrenceGenerator {
  abstract readonly isInfinite: boolean;
  abstract readonly hasDuration: boolean;

  /**
   * The maximum duration of this generators occurrences. Necessary
   * as part of the logic processing. By default it is 0.
   */
  readonly maxDuration: number;
  readonly timezone: string | null;

  private _firstDate?: DateAdapter | null;

  /** Returns the first occurrence or, if there are no occurrences, null. */
  get firstDate(): DateAdapter | null {
    if (this._firstDate !== undefined) return this._firstDate;

    const start = this._run().next().value;

    this._firstDate = start ? this.dateAdapter.fromDateTime(start) : null;

    return this._firstDate!;
  }

  private _lastDate?: DateAdapter | null;

  /** If generator is infinite, returns `null`. Otherwise returns the end date */
  get lastDate(): DateAdapter | null {
    if (this._lastDate !== undefined) return this._lastDate;

    if (this.isInfinite) {
      this._lastDate = null;
      return null;
    }

    const end = this._run({ reverse: true }).next().value;

    this._lastDate = end ? this.dateAdapter.fromDateTime(end) : null;

    return this._lastDate!;
  }

  constructor(
    args: {
      timezone?: string | null;
      maxDuration?: number;
    } = {},
  ) {
    this.timezone = args.timezone !== undefined ? args.timezone : null;
    this.maxDuration = args.maxDuration || 0;
  }

  pipe(...operators: OperatorFnOutput[]): OccurrenceGenerator {
    return operators.reduce(
      (prev, curr) => curr({ base: prev, timezone: this.timezone }),
      this as OccurrenceGenerator,
    );
  }

  abstract set(
    prop: 'timezone',
    value: string | null,
    options?: { keepLocalTime?: boolean },
  ): OccurrenceGenerator;

  /**
   * **!!Advanced Use Only!!**
   *
   * use `occurrences()` instead
   */
  abstract _run(args?: IRunArgs): OccurrenceGeneratorRunResult;

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
   * ```
   * const iterator = schedule.occurrences({ start: new Date(), take: 5 });
   
   * for (const date of iterator) {
   *   // do stuff
   * }

   * iterator.toArray() // returns Date array
   * iterator.next().value // returns next Date
   * ```
   * 
   */
  occurrences(args: IOccurrencesArgs = {}): OccurrenceIterator {
    return new OccurrenceIterator(this, this.normalizeOccurrencesArgs(args));
  }

  /**
   * Iterates over the object's occurrences and bundles them into collections
   * with a specified granularity (default is `"YEARLY"`). Make sure to
   * read about each option & combination of options below.
   *
   * Options object:
   *   - start?: DateAdapter
   *   - end?: DateAdapter
   *   - take?: number
   *   - reverse?: NOT SUPPORTED
   *   - granularity?: CollectionsGranularity
   *   - weekStart?: DateAdapter.Weekday
   *   - skipEmptyPeriods?: boolean
   *
   * Returned `Collection` object:
   *
   *   - `dates` property containing an array of DateAdapter objects.
   *   - `granularity` property containing the granularity.
   *     - `CollectionsGranularity` === `RuleOptions.Frequency`.
   *     - default is `"YEARLY"`
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
   * By default, the `periodStart` value of `Collection` objects produced by this method increments linearly.
   * This means the returned `Collection#dates` property may have length 0. This can be changed by
   * passing the `skipEmptyPeriods: true` option, in which case the `periodStart` from one collection to the
   * next can "jump".
   *
   * - Example 1: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({skipEmptyPeriods: true, granularity: 'DAILY', start: new Date(2019,0,1)})`
   *   (so starting on January 1st), the first Collection produced will have a `periodStart` in February.
   *
   * - Example 2: if your object's first occurrence is 2019/2/1 (February 1st) and you call
   *   `collection({granularity: 'DAILY', start: new Date(2019,0,1)})`
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
  collections(args: ICollectionsArgs = {}): CollectionIterator {
    return new CollectionIterator(this, this.normalizeCollectionsArgs(args));
  }

  /**
   * Returns true if an occurrence starts on or between the provided start/end
   * datetimes. If the `excludeEnds` option is provided, then occurrences
   * equal to the start/end times are ignored.
   *
   * If the occurrence generator has a duration, and `excludeEnds !== true`,
   * and a `maxDuration` argument is supplied (either in the constructor or
   * here), then any occurrence that's time overlaps with the start/end times
   * return true.
   */
  occursBetween(
    startInput: DateInput,
    endInput: DateInput,
    options: { excludeEnds?: boolean; maxDuration?: number } = {},
  ) {
    const start = this.normalizeDateInput(startInput);
    const end = this.normalizeDateInput(endInput);

    if (this.hasDuration && !options.excludeEnds) {
      const maxDuration = this.getMaxDuration('occursBetween', options);

      const iterator = this._run({
        start: start.subtract(maxDuration, 'millisecond'),
        end,
        reverse: true,
      });

      for (const day of iterator) {
        if (day.end!.isBefore(start)) continue;

        return true;
      }

      return false;
    }

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
   *
   * If this occurrence generator has a duration, and a `maxDuration`
   * argument is supplied (either in the constructor or here),
   * then `occursOn()` will check to see if an occurrence is happening
   * during the given datetime.
   *
   * Additionally, if this occurrence generator has a duration, then a maxDuration
   * argument must be provided. This argument should be the max number of milliseconds
   * that an occurrence's duration can be. When you create an occurrence
   * generator, you can specify the maxDuration at that time.
   */
  occursOn(args: { date: DateInput; maxDuration?: number }): boolean;
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * **If there are infinite occurrences, you must include a `before` argument with
   * the `weekday` argument.** Does not currently consider occurrence duration.
   *
   * Optional arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  occursOn(args: {
    weekday: DateAdapter.Weekday;
    after?: DateInput;
    before?: DateInput;
    excludeEnds?: boolean;
  }): boolean;
  occursOn(rawArgs: {
    date?: DateInput;
    weekday?: DateAdapter.Weekday;
    after?: DateInput;
    before?: DateInput;
    excludeEnds?: boolean;
    maxDuration?: number;
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

    if (!args.date) {
      throw new ArgumentError(
        `"occursOn()" must be called with either a "date" or "weekday" argument`
      );
    }

    if (this.hasDuration) {
      const maxDuration = this.getMaxDuration('occursOn', args);

      const iterator = this._run({
        start: args.date.subtract(maxDuration, 'millisecond'),
        end: args.date,
      });

      for (const date of iterator) {
        if (date.end!.isBefore(args.date)) continue;
        if (date.isAfter(args.date)) return false;

        return true;
      }

      return false;
    }

    for (const day of this._run({ start: args.date, end: args.date })) {
      return !!day;
    }

    return false;
  }

  /**
   * Returns true if an occurrence starts after the provided datetime.
   * If the `excludeStart` option is provided, then occurrences
   * equal to the provided datetime are ignored.
   *
   * If the occurrence generator has a duration, and `excludeStart !== true`,
   * and a `maxDuration` argument is supplied (either in the constructor or
   * here), then any occurrence that's end time is after/equal to the provided
   * datetime return true.
   */
  occursAfter(date: DateInput, options: { excludeStart?: boolean; maxDuration?: number } = {}) {
    const adapter = this.normalizeDateInput(date);

    if (this.hasDuration && !options.excludeStart) {
      const maxDuration = this.getMaxDuration('occursAfter', options);

      const iterator = this._run({
        start: adapter.subtract(maxDuration, 'millisecond'),
      });

      for (const date of iterator) {
        if (date.end!.isBefore(adapter)) continue;
        return true;
      }

      return false;
    }

    for (const day of this._run({ start: adapter })) {
      if (options.excludeStart && day.isEqual(adapter)) {
        continue;
      }

      return true;
    }

    return false;
  }

  /**
   * Returns true if an occurrence starts before the provided datetime.
   * If the `excludeStart` option is provided, then occurrences
   * equal to the provided datetime are ignored.
   *
   * If the occurrence generator has a duration, and `excludeStart` is
   * also provided, then this will only return true if an occurrence
   * both starts and ends before the provided datetime.
   */
  occursBefore(date: DateInput, options: { excludeStart?: boolean } = {}) {
    const adapter = this.normalizeDateInput(date);

    if (this.hasDuration && options.excludeStart) {
      for (const day of this._run({ end: adapter, reverse: true })) {
        if (day.end!.isAfterOrEqual(adapter)) continue;

        return true;
      }

      return false;
    }

    for (const day of this._run({ end: adapter, reverse: true })) {
      if (options.excludeStart && day.isEqual(adapter)) {
        continue;
      }

      return true;
    }

    return false;
  }

  protected get dateAdapter() {
    return DateAdapterBase.adapter;
  }

  protected normalizeOccurrencesArgs(rawArgs: IOccurrencesArgs) {
    return {
      ...rawArgs,
      start: this.normalizeDateInput(rawArgs.start),
      end: this.normalizeDateInput(rawArgs.end),
    };
  }

  protected normalizeCollectionsArgs(rawArgs: ICollectionsArgs) {
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
      date?: DateInput;
      weekday?: DateAdapter.Weekday;
      after?: DateInput;
      before?: DateInput;
      excludeEnds?: boolean;
      excludeDates?: Array<DateInput>;
      maxDuration?: number;
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

  protected normalizeDateInput<T extends DateInput | undefined>(
    date: T,
  ): T extends undefined ? undefined : DateTime {
    return date ? dateInputToDateTime(date!, this.timezone) : (undefined as any);
  }

  protected normalizeDateInputToAdapter(date: DateInput): DateAdapter;
  protected normalizeDateInputToAdapter(date?: DateInput): undefined;
  protected normalizeDateInputToAdapter(date?: DateInput) {
    if (!date) return;

    return dateInputToDateAdapter(date);
  }

  protected normalizeRunOutput(date: DateTime) {
    return normalizeDateTimeTimezone(date, this.timezone);
  }

  private getMaxDuration(method: string, options: { maxDuration?: number }) {
    const maxDuration = options.maxDuration || this.maxDuration;

    if (!Number.isInteger(maxDuration!)) {
      throw new ArgumentError(
        `When an occurrence generator ` +
          `has a duration, a 'maxDuration' argument must be supplied ` +
          `to ${method}().`,
      );
    }

    return maxDuration!;
  }
}

export interface IOccurrencesArgs {
  start?: DateInput;
  end?: DateInput;
  take?: number;
  reverse?: boolean;
}

export class OccurrenceIterator<
  G extends ReadonlyArray<OccurrenceGenerator> = ReadonlyArray<OccurrenceGenerator>
> {
  private readonly iterator: OccurrenceGeneratorRunResult;
  private readonly isInfinite: boolean;

  constructor(private iterable: OccurrenceGenerator, private args: IRunArgs) {
    this.iterator = iterable._run(args);
    this.isInfinite = iterable.isInfinite;
  }

  // Need to assert the return type of these methods to prevent typescript from
  // incorrectly reducing them to `DateAdapterBase & { generators: G }`.
  [Symbol.iterator]: () => IterableIterator<DateAdapter & { generators: G }> = () =>
    this.occurrenceIterator();

  next(args?: { skipToDate?: DateInput }): IteratorResult<DateAdapter & { generators: G }> {
    return this.occurrenceIterator(args).next();
  }

  toArray(): Array<DateAdapter & { generators: G }> {
    if (this.args.end || this.args.take || !this.isInfinite) {
      return Array.from(this.occurrenceIterator());
    }

    throw new InfiniteLoopError(
      'OccurrenceIterator#toArray() can only be called if the iterator ' +
        'is not infinite, or you provide and `end` argument, or you provide ' +
        'a `take` argument.',
    );
  }

  private *occurrenceIterator(rawArgs?: { skipToDate?: DateInput }) {
    let args = this.normalizeRunArgs(rawArgs);

    let date = this.iterator.next(args).value;

    while (date) {
      const yieldArgs = yield this.normalizeDateOutput(date);

      args = this.normalizeRunArgs(yieldArgs);

      date = this.iterator.next(args).value;
    }
  }

  private normalizeRunArgs(args?: { skipToDate?: DateInput }) {
    return {
      skipToDate: this.normalizeDateInput(args && args.skipToDate),
    };
  }

  private normalizeDateInput(date?: DateInput) {
    return date ? dateInputToDateTime(date, this.iterable.timezone) : undefined;
  }

  private normalizeDateOutput(date: DateTime): DateAdapter & { generators: G };
  private normalizeDateOutput(date?: DateTime): undefined;
  private normalizeDateOutput(date?: DateTime) {
    if (!date) return;

    return date ? DateAdapterBase.adapter.fromDateTime(date) : undefined;
  }
}

export type CollectionsGranularity =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

export class Collection<
  G extends ReadonlyArray<OccurrenceGenerator> = ReadonlyArray<OccurrenceGenerator>
> {
  constructor(
    readonly dates: (DateAdapter & { generators: G })[] = [],
    readonly granularity: CollectionsGranularity,
    readonly periodStart: DateAdapter & { generators: G },
    readonly periodEnd: DateAdapter & { generators: G },
  ) {}
}

export interface ICollectionsArgs extends IOccurrencesArgs {
  granularity?: CollectionsGranularity;
  weekStart?: DateAdapter.Weekday;
  skipEmptyPeriods?: boolean;
}

export interface ICollectionsRunArgs extends IRunArgs {
  granularity?: CollectionsGranularity;
  weekStart?: DateAdapter.Weekday;
  skipEmptyPeriods?: boolean;
}

export class CollectionIterator<
  G extends ReadonlyArray<OccurrenceGenerator> = ReadonlyArray<OccurrenceGenerator>
> {
  readonly granularity: CollectionsGranularity = 'year';
  readonly weekStart?: DateAdapter.Weekday;
  readonly startDate: DateAdapter | null;

  private iterator: IterableIterator<Collection<G>>;

  constructor(private iterable: OccurrenceGenerator, private args: ICollectionsRunArgs) {
    if (args.granularity) {
      this.granularity = args.granularity;

      if (this.granularity === 'week' && !args.weekStart) {
        throw new Error('"week" granularity requires `weekStart` arg');
      }
    }

    if (args.weekStart) {
      this.weekStart = args.weekStart;
    }

    if (args.reverse) {
      throw new Error(
        '`OccurrenceGenerator#collections()` does not support iterating in reverse. ' +
          'Though `OccurrenceGenerator#occurrences()` does support iterating in reverse.',
      );
    }

    // Set the end arg, if present, to the end of the period.
    this.args = {
      ...args,
      start: args.start || iterable._run().next().value,
      end: args.end && this.getPeriod(args.end).end,
    };

    this.startDate =
      (this.args.start && this.normalizeDateOutput(this.getPeriod(this.args.start).start)) || null;

    this.iterator = this.collectionIterator();
  }

  [Symbol.iterator] = () => this.iterator;

  next() {
    return this.iterator.next();
  }

  /**
   * While `next()` and `[Symbol.iterator]` both share state,
   * `toArray()` does not share state and always returns the whole
   * collections array.
   */
  toArray() {
    if (this.args.end || this.args.take || !this.iterable.isInfinite) {
      const collections: Collection<G>[] = [];

      for (const collection of this.collectionIterator()) {
        collections.push(collection);
      }

      return collections;
    }

    throw new InfiniteLoopError(
      'CollectionIterator#toArray() can only be called if the iterator ' +
        'is not infinite, or you provide and `end` argument, or you provide ' +
        'a `take` argument.',
    );
  }

  private normalizeDateOutput(date: DateTime): DateAdapter & { generators: G };
  private normalizeDateOutput(date?: DateTime): undefined;
  private normalizeDateOutput(date?: DateTime) {
    if (!date) return;

    return DateAdapterBase.adapter.fromDateTime(date);
  }

  private *collectionIterator() {
    if (!this.startDate) return;

    let iterator = this.occurrenceIterator();

    let date = iterator.next().value;

    if (!date) return;

    // `period` === `periodStart` unless the granularity
    // is `MONTHLY` and a `weekStart` param was provided. In this case,
    // period holds a date === the first of the current month while
    // periodStart holds a date === the beginning of the first week of the month
    // (which might be in the the previous month). Read the
    // `OccurrenceGenerator#collections()` description for more info.
    let period = this.getPeriod(this.args.start!);

    let dates: DateTime[] = [];
    let index = 0;

    while (date && (this.args.take === undefined || this.args.take > index)) {
      while (date && date.isBeforeOrEqual(period.end)) {
        dates.push(date);

        date = iterator.next().value;
      }

      yield new Collection<G>(
        dates.map(date => this.normalizeDateOutput(date)),
        this.granularity,
        this.normalizeDateOutput(period.start),
        this.normalizeDateOutput(period.end),
      );

      if (!date) return;

      dates = [];

      period = !this.args.skipEmptyPeriods
        ? this.getPeriod(this.incrementPeriod(period.period))
        : this.getPeriod(date);

      // With these args, periods may overlap and the same date may show up
      // in two periods. Because of this, we need to reset the iterator
      // (otherwise it won't return a date it has already returned).
      if (this.granularity === 'month' && this.weekStart) {
        iterator = this.iterable._run({
          start: period.start,
          end: this.args.end,
        });

        date = iterator.next().value;
      }

      index++;
    }
  }

  private getPeriod(date: DateTime) {
    let start: DateTime;
    let end: DateTime;
    let period: DateTime;

    if (this.granularity === 'month' && this.weekStart) {
      start = date.granularity('month').granularity('week', { weekStart: this.weekStart });
      end = date.endGranularity('month').endGranularity('week', { weekStart: this.weekStart });
      period = date.granularity('month');
    } else {
      start = date.granularity(this.granularity, { weekStart: this.weekStart });
      end = date.endGranularity(this.granularity, { weekStart: this.weekStart });
      period = start;
    }

    return { start, end, period };
  }

  private incrementPeriod(date: DateTime) {
    return date.add(1, this.granularity);
  }

  private occurrenceIterator(): IterableIterator<DateTime> {
    let start = this.args.start || this.iterable._run().next().value;

    if (!start) return this.iterable._run(this.args);

    start = this.getPeriod(start).start;

    return this.iterable._run({
      start,
      end: this.args.end,
    });
  }
}

export type OperatorFn = () => OperatorFnOutput;

export type OperatorFnOutput = (options: IOperatorConfig) => Operator;

export interface IOperatorConfig {
  readonly timezone: string | null;
  readonly base?: OccurrenceGenerator;
}

export abstract class Operator extends OccurrenceGenerator {
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  readonly timezone: string | null;

  constructor(
    readonly streams: ReadonlyArray<OccurrenceGenerator>,
    readonly config: IOperatorConfig,
  ) {
    super(config);

    this.timezone = config.timezone;

    this.streams = streams.map(stream =>
      stream instanceof Operator ? stream : stream.set('timezone', this.timezone),
    );

    this.isInfinite = this.calculateIsInfinite();
    this.hasDuration = this.calculateHasDuration();
  }

  protected abstract calculateIsInfinite(): boolean;
  protected abstract calculateHasDuration(): boolean;

  protected normalizeDateInput(date: DateInput): DateTime;
  protected normalizeDateInput(date?: DateInput): undefined;
  protected normalizeDateInput(date?: DateInput) {
    if (!date) return;

    return dateInputToDateTime(date, this.timezone);
  }

  protected normalizeRunOutput(date: DateTime) {
    return normalizeDateTimeTimezone(date, this.timezone);
  }
}

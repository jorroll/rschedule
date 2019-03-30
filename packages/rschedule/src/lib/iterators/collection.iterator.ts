import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { DateInput, IHasOccurrences, IOccurrencesArgs, IRunArgs, IRunnable } from '../interfaces';
import { RuleOption } from '../rule';
import { ArgumentError, freqToGranularity } from '../utilities';

export class CollectionIterator<T extends typeof DateAdapter> {
  readonly granularity: CollectionsGranularity = 'INSTANTANIOUSLY';
  readonly weekStart?: IDateAdapter.Weekday;
  readonly startDate: ConstructorReturnType<T> | null;

  private iterator: IterableIterator<Collection<T>>;

  constructor(private iterable: IHasOccurrences<T>, private args: ICollectionsRunArgs) {
    if (args.granularity) {
      this.granularity = args.granularity;
    }

    if (args.weekStart) {
      this.weekStart = args.weekStart;
    }

    if (args.reverse) {
      throw new Error(
        '`Calendar#collections()` does not support iterating in reverse. ' +
          'Though `Calendar#occurrences()` does support iterating in reverse.',
      );
    }

    // Set the end arg, if present, to the end of the period.
    this.args = {
      ...args,
      start: args.start || iterable._run().next().value,
      end: args.end && this.getPeriod(args.end).end,
    };

    this.startDate =
      (this.args.start &&
        (this.normalizeDateOutput(this.getPeriod(this.args.start).start) as ConstructorReturnType<
          T
        >)) ||
      null;

    this.iterator = this._run();
  }

  [Symbol.iterator] = () => this.iterator;

  next() {
    return this.iterator.next();
  }

  /**
   * While `next()` and `[Symbol.iterator]` both share state,
   * `toArray()` does not share state and always returns the whole
   * collections array (or `undefined`, in the case of collection of
   * infinite length)
   */
  toArray() {
    if (this.args.end || this.args.take || !this.iterable.isInfinite) {
      const collections: Collection<T>[] = [];

      for (const collection of this._run()) {
        collections.push(collection);
      }

      return collections;
    }
  }

  private normalizeRunArgs(args?: { skipToDate?: DateInput<T> }) {
    return {
      skipToDate: this.normalizeDateInput(args && args.skipToDate),
    };
  }

  private normalizeDateInput(date?: DateInput<T>) {
    if (!date) {
      return;
    }

    return DateAdapter.isInstance(date)
      ? date.set('timezone', this.iterable.timezone).toDateTime()
      : new this.iterable.dateAdapter(date).set('timezone', this.iterable.timezone).toDateTime();
  }

  private normalizeDateOutput(date?: DateTime) {
    if (!date) return;

    return this.iterable.dateAdapter.fromJSON(date.toJSON());
  }

  private *_run() {
    if (!this.startDate) return;

    let iterator = this.occurrenceIterator(this.iterable, this.args);

    let date = iterator.next().value;

    if (!date) return;

    // `period` === `periodStart` unless the granularity
    // is `MONTHLY` and a `weekStart` param was provided. In this case,
    // period holds a date === the first of the current month while
    // periodStart holds a date === the beginning of the first week of the month
    // (which might be in the the previous month). Read the
    // `Calendar#collections()` description for more info.
    let period = this.getPeriod(this.args.start!);

    let dates: DateTime[] = [];
    let index = 0;

    while (date && (this.args.take === undefined || this.args.take > index)) {
      while (date && date.isBeforeOrEqual(period.end)) {
        dates.push(date);

        date = iterator.next().value;
      }

      yield new Collection(
        dates.map(date => this.normalizeDateOutput(date)!),
        this.granularity,
        this.normalizeDateOutput(period.start)!,
        this.normalizeDateOutput(period.end)!,
      );

      if (!date) return;

      dates = [];

      period = this.args.incrementLinearly
        ? this.getPeriod(this.incrementPeriod(period.period))
        : this.getPeriod(date);

      // With these args, periods may overlap and the same date may show up
      // in two periods. Because of this, we need to reset the iterator
      // (otherwise it won't spit out a date it has already spit out).
      if (this.granularity === 'MONTHLY' && this.weekStart) {
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
    const granularity = freqToGranularity(this.granularity);
    let start: DateTime;
    let end: DateTime;
    let period: DateTime;

    if (this.granularity === 'MONTHLY' && this.weekStart) {
      start = date.granularity('month').granularity('week', { weekStart: this.weekStart });
      end = date.endGranularity('month').endGranularity('week', { weekStart: this.weekStart });
      period = start;
    } else if (this.granularity === 'WEEKLY') {
      if (!this.weekStart) {
        throw new ArgumentError('"WEEKLY" granularity requires `weekStart` arg');
      }

      start = date.granularity('week', { weekStart: this.weekStart });
      end = date.endGranularity('week', { weekStart: this.weekStart });
      period = start;
    } else {
      start = date.granularity(granularity);
      end = date.endGranularity(granularity);
      period = start;
    }

    return { start, end, period };
  }

  private incrementPeriod(date: DateTime) {
    switch (this.granularity) {
      case 'YEARLY':
        return date.add(1, 'year');
      case 'MONTHLY':
        return date.add(1, 'month');
      case 'WEEKLY':
        return date.add(1, 'week');
      case 'DAILY':
        return date.add(1, 'day');
      case 'HOURLY':
        return date.add(1, 'hour');
      case 'MINUTELY':
        return date.add(1, 'minute');
      case 'SECONDLY':
        return date.add(1, 'second');
      case 'INSTANTANIOUSLY':
      default:
        return date.add(1, 'millisecond');
    }
  }

  private occurrenceIterator(
    iterable: IRunnable<T>,
    args: ICollectionsRunArgs,
  ): IterableIterator<DateTime> {
    let start = args.start || iterable._run().next().value;

    if (!start) return iterable._run(args);

    start = this.getPeriod(start).start;

    return iterable._run({
      start,
      end: args.end,
    });
  }
}

export class Collection<T extends typeof DateAdapter> {
  constructor(
    readonly dates: ConstructorReturnType<T>[] = [],
    readonly granularity: CollectionsGranularity,
    readonly periodStart: ConstructorReturnType<T>,
    readonly periodEnd: ConstructorReturnType<T>,
  ) {}
}

export type CollectionsGranularity = 'INSTANTANIOUSLY' | RuleOption.Frequency;

export interface ICollectionsArgs<T extends typeof DateAdapter> extends IOccurrencesArgs<T> {
  granularity?: CollectionsGranularity;
  weekStart?: IDateAdapter.Weekday;
  incrementLinearly?: boolean;
}

export interface ICollectionsRunArgs extends IRunArgs {
  granularity?: CollectionsGranularity;
  weekStart?: IDateAdapter.Weekday;
  incrementLinearly?: boolean;
}

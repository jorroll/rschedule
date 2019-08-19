import { ArgumentError, freqToGranularity, InfiniteLoopError } from '../basic-utilities';
import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { IOccurrenceGenerator, IRunArgs, IRunnable } from '../interfaces';
import { RuleOption } from '../rule';
import { IOccurrencesArgs } from './occurrence.iterator';

export class CollectionIterator<
  T extends typeof DateAdapter,
  G extends ReadonlyArray<IOccurrenceGenerator<T>> = ReadonlyArray<IOccurrenceGenerator<T>>
> {
  readonly granularity: CollectionsGranularity = 'YEARLY';
  readonly weekStart?: IDateAdapter.Weekday;
  readonly startDate: InstanceType<T> | null;

  private iterator: IterableIterator<Collection<T, G>>;

  constructor(private iterable: IOccurrenceGenerator<T>, private args: ICollectionsRunArgs) {
    if (args.granularity) {
      this.granularity = args.granularity;

      if (this.granularity === 'WEEKLY' && !args.weekStart) {
        throw new ArgumentError('"WEEKLY" granularity requires `weekStart` arg');
      }
    }

    if (args.weekStart) {
      this.weekStart = args.weekStart;
    }

    if (args.reverse) {
      throw new ArgumentError(
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

    this.iterator = this._run();
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
      const collections: Collection<T>[] = [];

      for (const collection of this._run()) {
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

  private normalizeDateOutput(date: DateTime): InstanceType<T> & { generators: G };
  private normalizeDateOutput(date?: DateTime): undefined;
  private normalizeDateOutput(date?: DateTime) {
    if (!date) return;

    return this.iterable.dateAdapter.fromDateTime(date);
  }

  private *_run() {
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

      yield new Collection<T, G>(
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
      period = date.granularity('month');
    } else if (this.granularity === 'WEEKLY') {
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
      case 'MILLISECONDLY':
        return date.add(1, 'millisecond');
      default:
        throw new ArgumentError(`Unknown CollectionIterator granularity "${this.granularity}"`);
    }
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

export class Collection<
  T extends typeof DateAdapter,
  G extends ReadonlyArray<IOccurrenceGenerator<T>> = ReadonlyArray<IOccurrenceGenerator<T>>
> {
  constructor(
    readonly dates: (InstanceType<T> & { generators: G })[] = [],
    readonly granularity: CollectionsGranularity,
    readonly periodStart: InstanceType<T> & { generators: G },
    readonly periodEnd: InstanceType<T> & { generators: G },
  ) {}
}

export type CollectionsGranularity = RuleOption.Frequency;

export interface ICollectionsArgs<T extends typeof DateAdapter> extends IOccurrencesArgs<T> {
  granularity?: CollectionsGranularity;
  weekStart?: IDateAdapter.Weekday;
  skipEmptyPeriods?: boolean;
}

export interface ICollectionsRunArgs extends IRunArgs {
  granularity?: CollectionsGranularity;
  weekStart?: IDateAdapter.Weekday;
  skipEmptyPeriods?: boolean;
}

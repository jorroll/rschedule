import { DateAdapter } from '../date-adapter';
import { DateTime, dateTimeSortComparer, IDateAdapter } from '../date-time';
import { DateInput, HasOccurrences, IOccurrencesArgs, IRunArgs } from '../interfaces';
import { OccurrenceIterator } from '../iterators';
import { ArgumentError, ConstructorReturnType } from '../utilities';

const DATES_ID = Symbol.for('1a872780-b812-4991-9ca7-00c47cfdeeac');

/**
 * This base class provides a `HasOccurrences` API wrapper around arrays of dates
 */
export class Dates<T extends typeof DateAdapter, D = unknown> extends HasOccurrences<T> {
  get length() {
    return this.datetimes.length;
  }

  /**
   * Convenience getter for returning the dates in DateAdapter format.
   */
  get adapters(): ConstructorReturnType<T>[] {
    return this.datetimes.map(date =>
      this.dateAdapter.fromJSON(date.toJSON()),
    ) as ConstructorReturnType<T>[];
  }

  /** Returns the first occurrence or, if there are no occurrences, null. */
  get firstDate(): ConstructorReturnType<T> | null {
    return (this.adapters[0] as ConstructorReturnType<T>) || null;
  }

  /** Returns the last occurrence or, if there are no occurrences, null. */
  get lastDate(): ConstructorReturnType<T> | null {
    return (this.adapters[this.length - 1] as ConstructorReturnType<T>) || null;
  }

  /**
   * Similar to `Array.isArray()`, `isDates()` provides a surefire method
   * of determining if an object is a `Dates` by checking against the
   * global symbol registry.
   */
  static isDates(object: any): object is Dates<any> {
    return !!(object && typeof object === 'object' && (object as any)[DATES_ID]);
  }

  readonly isInfinite = false;
  readonly hasDuration: boolean;
  readonly timezone: string | undefined;

  data?: D;

  protected readonly [DATES_ID] = true;

  /** @private - use `adapters` instead */
  private readonly datetimes: DateTime[] = [];

  constructor(args: { timezone?: string; dates?: DateInput<T>[]; data?: D; dateAdapter?: T }) {
    super(args);

    this.data = args.data;

    if (args.dates) {
      this.datetimes = args.dates.map(date => this.normalizeDateInput(date)!);
    }

    this.hasDuration = this.datetimes.every(date => !!date.duration);
  }

  add(value: DateInput<T>) {
    return new Dates({
      dates: [...this.datetimes, this.normalizeDateInput(value)!],
      timezone: this.timezone,
      data: this.data,
      dateAdapter: this.dateAdapter,
    });
  }

  remove(value: DateInput<T>) {
    const dates = this.datetimes.slice();
    const input = this.normalizeDateInput(value)!;
    const index = dates.findIndex(date => date.isEqual(input));

    if (index >= 0) {
      dates.splice(index, 1);
    }

    return new Dates({
      dates,
      timezone: this.timezone,
      data: this.data,
      dateAdapter: this.dateAdapter,
    });
  }

  set(prop: 'timezone', value: string | undefined): Dates<T, D>;
  set(prop: 'dates', value: DateInput<T>[]): Dates<T, D>;
  set(prop: 'timezone' | 'dates', value: DateInput<T>[] | string | undefined) {
    let timezone = this.timezone;
    let dates: DateAdapter[] | DateTime[] = this.datetimes;

    if (prop === 'timezone') {
      if (value === this.timezone) return this;
      timezone = value as string | undefined;
      dates = this.adapters.map(adapter => adapter.set('timezone', timezone));
    } else if (prop === 'dates') {
      dates = (value as DateInput<T>[]).map(date => this.normalizeDateInput(date)!);
    } else {
      throw new ArgumentError(
        `Unexpected prop argument "${prop}". ` + `Accepted values are "timezone" or "dates"`,
      );
    }

    return new Dates({
      dates,
      data: this.data,
      dateAdapter: this.dateAdapter,
      timezone,
    });
  }

  occurrences(args: IOccurrencesArgs<T> = {}): OccurrenceIterator<T> {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args));
  }

  occursOn(rawArgs: { date: DateInput<T> }): boolean;

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
      const before =
        args.before && (args.excludeEnds ? args.before.subtract(1, 'day') : args.before);

      const after = args.after && (args.excludeEnds ? args.after.add(1, 'day') : args.after);

      return this.datetimes.some(date => {
        return (
          date.get('weekday') === args.weekday &&
          (!args.excludeDates || !args.excludeDates.some(exdate => exdate.isEqual(date))) &&
          (!after || date.isAfterOrEqual(after)) &&
          (!before || date.isBeforeOrEqual(before))
        );
      });
    }

    if (this.hasDuration) {
      return this.datetimes.some(date => date.isOccurring(args.date!));
    } else {
      for (const day of this._run({ start: args.date, end: args.date })) {
        return !!day;
      }
    }

    return false;
  }

  *_run(args: IRunArgs = {}) {
    let dates = this.datetimes.sort(dateTimeSortComparer);

    if (args.reverse) {
      if (args.start) {
        dates = dates.filter(date => date.isBeforeOrEqual(args.start!));
      }

      if (args.end) {
        dates = dates.filter(date => date.isAfterOrEqual(args.end!));
      }

      dates.reverse();
    } else {
      if (args.start) {
        dates = dates.filter(date => date.isAfterOrEqual(args.start!));
      }

      if (args.end) {
        dates = dates.filter(date => date.isBeforeOrEqual(args.end!));
      }
    }

    if (args.take) {
      dates = dates.slice(0, args.take);
    }

    let dateCache = dates.slice();
    let date = dateCache.shift();
    let yieldArgs: { skipToDate?: DateTime } | undefined;

    while (date) {
      if (yieldArgs) {
        if (
          yieldArgs.skipToDate &&
          (args.reverse ? yieldArgs.skipToDate.isBefore(date) : yieldArgs.skipToDate.isAfter(date))
        ) {
          date = dateCache.shift();
          continue;
        }

        yieldArgs = undefined;
      }

      date.generators.push(this);

      yieldArgs = yield this.normalizeRunOutput(date);

      if (yieldArgs && yieldArgs.skipToDate) {
        // need to reset the date cache to allow the same date to be picked again.
        // Also, I suppose it's possible someone might want to go back in time,
        // which this allows.
        dateCache = dates.slice();
      }

      date = dateCache.shift();
    }
  }
}

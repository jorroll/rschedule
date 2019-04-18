import { ArgumentError, Include } from '../basic-utilities';
import { DateAdapter } from '../date-adapter';
import { DateTime, dateTimeSortComparer } from '../date-time';
import { IRunArgs, OccurrenceGenerator } from '../interfaces';
import {
  CollectionIterator,
  ICollectionsArgs,
  IOccurrencesArgs,
  OccurrenceIterator,
} from '../iterators';
import { OccurrenceStream, OperatorFnOutput, pipeFn } from '../operators';
import { DateInput } from '../utilities';

const DATES_ID = Symbol.for('1a872780-b812-4991-9ca7-00c47cfdeeac');

type GetDatesType<T> = Include<T, Dates<any, any>> extends never
  ? Dates<any, any>
  : Include<T, Dates<any, any>>;

export class Dates<T extends typeof DateAdapter, D = any> extends OccurrenceGenerator<T> {
  /**
   * Similar to `Array.isArray()`, `isDates()` provides a surefire method
   * of determining if an object is a `Dates` by checking against the
   * global symbol registry.
   */
  // @ts-ignore the check is working as intended but typescript doesn't like it for some reason
  static isDates<T>(object: T): object is GetDatesType<T> {
    return !!(object && typeof object === 'object' && (object as any)[DATES_ID]);
  }

  get length() {
    return this.adapters.length;
  }

  readonly adapters: ReadonlyArray<InstanceType<T>> = [];

  /** Returns the first occurrence or, if there are no occurrences, null. */
  get firstDate(): InstanceType<T> | null {
    const first = this.adapters[0];

    return (first && (first.set('timezone', this.timezone) as InstanceType<T>)) || null;
  }

  /** Returns the last occurrence or, if there are no occurrences, null. */
  get lastDate(): InstanceType<T> | null {
    const last = this.adapters[this.length - 1];

    return (last && (last.set('timezone', this.timezone) as InstanceType<T>)) || null;
  }

  readonly isInfinite = false;
  readonly hasDuration: boolean;
  readonly timezone!: string | null; // set by `OccurrenceGenerator`

  pipe: (...operatorFns: OperatorFnOutput<T>[]) => OccurrenceStream<T> = pipeFn(this);

  data?: D;

  protected readonly [DATES_ID] = true;

  private readonly datetimes: DateTime[] = [];

  constructor(
    args: {
      timezone?: string | null;
      dates?: ReadonlyArray<DateInput<T>>;
      data?: D;
      dateAdapter?: T;
    } = {},
  ) {
    super(args);

    this.data = args.data;

    if (args.dates) {
      this.adapters = args.dates.map(date => this.normalizeDateInputToAdapter(date));
      this.datetimes = this.adapters.map(adapter =>
        adapter.set('timezone', this.timezone).toDateTime(),
      );
    }

    this.hasDuration = this.datetimes.every(date => !!date.duration);
  }

  occurrences(args: IOccurrencesArgs<T> = {}): OccurrenceIterator<T, [this]> {
    return new OccurrenceIterator(this, this.normalizeOccurrencesArgs(args));
  }

  collections(args: ICollectionsArgs<T> = {}): CollectionIterator<T, [this]> {
    return new CollectionIterator(this, this.normalizeCollectionsArgs(args));
  }

  add(value: DateInput<T>) {
    return new Dates({
      dates: [...this.adapters, value],
      timezone: this.timezone,
      data: this.data,
      dateAdapter: this.dateAdapter,
    });
  }

  remove(value: DateInput<T>) {
    const dates = this.adapters.slice();
    const input = this.normalizeDateInputToAdapter(value);
    const index = dates.findIndex(date => date.valueOf() === input.valueOf());

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

  /**
   * Dates are immutable. This allows you to create a new Dates with an updated timezone
   * or `dates` property.
   *
   * ### Important!
   * When updating the dates' timezone, this does not change the *`dates`* associated with this
   * `Dates`. Instead, when the `Dates` object is processed and a specific date is found to be
   * valid, only then is that date converted to the timezone you specify here are returned to
   * you. This distinction might matter when viewing the timezone associated with
   * `Dates#adapters`. If you wish to update the timezone associated with the `date` objects
   * this `Dates` is wrapping, you must update the `dates` property.
   *
   */
  set(prop: 'timezone', value: string | null): Dates<T, D>;
  set(prop: 'dates', value: DateInput<T>[]): Dates<T, D>;
  set(prop: 'timezone' | 'dates', value: DateInput<T>[] | string | null) {
    let timezone = this.timezone;
    let dates: DateInput<T>[] = this.adapters.slice();

    if (prop === 'timezone') {
      if (value === this.timezone) return this;
      timezone = value as string | null;
    } else if (prop === 'dates') {
      dates = value as DateInput<T>[];
    } else {
      throw new ArgumentError(
        `Unexpected prop argument "${prop}". Accepted values are "timezone" or "dates"`,
      );
    }

    return new Dates({
      dates,
      data: this.data,
      dateAdapter: this.dateAdapter,
      timezone,
    });
  }

  filter(
    fn: (date: InstanceType<T>, index: number, array: ReadonlyArray<InstanceType<T>>) => boolean,
  ) {
    return new Dates({
      dates: this.adapters.filter(fn),
      data: this.data,
      dateAdapter: this.dateAdapter,
      timezone: this.timezone,
    });
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

      date.generators.unshift(this);

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

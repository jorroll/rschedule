import {
  ArgumentError,
  DateAdapter,
  DateTime,
  IDateAdapter,
  InvalidDateAdapterError,
} from '@rschedule/rschedule';
import moment from 'moment-timezone';

const MOMENT_TZ_DATE_ADAPTER_ID = Symbol.for('4796ecb9-5ad7-4fdf-9a8f-13f926546576');

/**
 * The `MomentTZDateAdapter` is for using with `momentjs` with it's optional
 * `moment-timezone` package. It supports robust timezone handling.
 *
 * If you are not using the optional `moment-timezone` package, you should
 * use the `MomentDateAdapter` by installing `@rschedule/moment-date-adapter`.
 */
export class MomentTZDateAdapter extends DateAdapter implements IDateAdapter<moment.Moment> {
  static readonly date: moment.Moment;
  static readonly hasTimezoneSupport = true;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `MomentTZDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: unknown): object is MomentTZDateAdapter {
    return !!(super.isInstance(object) && (object as any)[MOMENT_TZ_DATE_ADAPTER_ID]);
  }

  /**
   * Checks if object is an instance of `DateTime`
   */
  static isDate(object: any): object is moment.Moment {
    return moment.isMoment(object);
  }

  static fromJSON(json: IDateAdapter.JSON): MomentTZDateAdapter {
    const args = [
      json.year,
      json.month - 1,
      json.day,
      json.hour,
      json.minute,
      json.second,
      json.millisecond,
    ];

    switch (json.timezone) {
      case null:
        return new MomentTZDateAdapter(moment(args), { duration: json.duration });
      default:
        return new MomentTZDateAdapter(moment.tz(args, json.timezone), { duration: json.duration });
    }
  }

  static fromDateTime(datetime: DateTime) {
    const date = MomentTZDateAdapter.fromJSON(datetime.toJSON());
    date.generators.push(...datetime.generators);
    return date;
  }

  get date() {
    return this._date.clone();
  }
  readonly timezone: string | null;
  readonly generators: unknown[] = [];

  protected readonly [MOMENT_TZ_DATE_ADAPTER_ID] = true;

  private _end: moment.Moment | undefined;
  private _date: moment.Moment;

  constructor(date: moment.Moment, options: { duration?: number } = {}) {
    super(undefined, options);

    this._date = date.clone();
    this.timezone = date.tz() || null;

    this.assertIsValid();
  }

  get end(): moment.Moment | undefined {
    if (!this.duration) return;

    if (this._end) return this._end;

    this._end = MomentTZDateAdapter.fromDateTime(
      this.toDateTime().add(this.duration, 'millisecond'),
    ).date;

    return this._end;
  }

  set(prop: 'timezone', value: string | null): MomentTZDateAdapter;
  set(prop: 'duration', value: number): MomentTZDateAdapter;
  set(prop: 'timezone' | 'duration', value: number | string | null) {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else {
        const date = this._date.clone();

        if (value === null) {
          // work around for https://github.com/moment/moment-timezone/issues/738
          date.utc().local();
        } else {
          date.tz(value as string);
        }

        return new MomentTZDateAdapter(date, {
          duration: this.duration,
        });
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new MomentTZDateAdapter(this._date, {
          duration: value as number,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for MomentTZDateAdapter#set()`);
  }

  valueOf() {
    return this._date.valueOf();
  }

  toISOString() {
    return this._date.toISOString();
  }

  toJSON(): IDateAdapter.JSON {
    const json: IDateAdapter.JSON = {
      timezone: this.timezone,
      year: this._date.get('year'),
      month: this._date.get('month') + 1,
      day: this._date.get('date'),
      hour: this._date.get('hour'),
      minute: this._date.get('minute'),
      second: this._date.get('second'),
      millisecond: this._date.get('millisecond'),
    };

    if (this.duration) {
      json.duration = this.duration;
    }

    return json;
  }

  assertIsValid() {
    if (!this._date.isValid()) {
      throw new InvalidDateAdapterError();
    } else if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

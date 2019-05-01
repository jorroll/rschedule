import {
  DateAdapter,
  DateTime,
  IDateAdapter,
  InvalidDateAdapterError,
  OccurrenceGenerator,
} from '@rschedule/rschedule';
import moment from 'moment';

const MOMENT_DATE_ADAPTER_ID = Symbol.for('9f60d072-15b6-453c-be71-5c8f9c04fbbd');

/**
 * The `MomentDateAdapter` is for using with momentjs *without* the
 * `moment-timezone` package. It only supports `"UTC"` and local
 * timezones.
 *
 * If you want timezone support, you'll need to install the
 * `moment-timezone` package along with `@rschedule/moment-tz-date-adapter`.
 */
export class MomentDateAdapter extends DateAdapter implements IDateAdapter<moment.Moment> {
  static readonly date: moment.Moment;
  static readonly hasTimezoneSupport = false;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `MomentDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is MomentDateAdapter {
    return !!(super.isInstance(object) && (object as any)[MOMENT_DATE_ADAPTER_ID]);
  }

  /**
   * Checks if object is an instance of `DateTime`
   */
  static isDate(object: any): object is moment.Moment {
    return moment.isMoment(object);
  }

  static fromJSON(json: IDateAdapter.JSON): MomentDateAdapter {
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
      case 'UTC':
        return new MomentDateAdapter(moment.utc(args), { duration: json.duration });
      case null:
        return new MomentDateAdapter(moment(args), { duration: json.duration });
      default:
        throw new InvalidDateAdapterError(
          'The `MomentDateAdapter` only supports datetimes in ' +
            `'UTC' or local (null) time. You attempted to parse an ICAL ` +
            `string with a "${json.timezone}" timezone. ` +
            'Timezones are supported by the `MomentTZDateAdapter` ' +
            'with the `moment-timezone` package installed.',
        );
    }
  }

  static fromDateTime(datetime: DateTime) {
    const date = MomentDateAdapter.fromJSON(datetime.toJSON());
    date.generators.push(...datetime.generators);
    return date;
  }

  get date() {
    return this._date.clone();
  }
  readonly timezone: string | null;
  readonly duration: number | undefined;
  readonly generators: unknown[] = [];

  protected readonly [MOMENT_DATE_ADAPTER_ID] = true;

  private _end: moment.Moment | undefined;
  private _date: moment.Moment;

  constructor(date: moment.Moment, options: { duration?: number } = {}) {
    super(undefined);

    this._date = date.clone();
    this.timezone = date.isUTC() ? 'UTC' : null;
    this.duration = options.duration;

    this.assertIsValid();
  }

  get end(): moment.Moment | undefined {
    if (!this.duration) return;

    if (this._end) return this._end;

    this._end = MomentDateAdapter.fromDateTime(
      this.toDateTime().add(this.duration, 'millisecond'),
    ).date;

    return this._end;
  }

  set(_: 'timezone', value: string | null) {
    if (this.timezone === value) return this;

    if (value === 'UTC') {
      return new MomentDateAdapter(this._date.clone().utc(), { duration: this.duration });
    } else if (value === null) {
      return new MomentDateAdapter(this._date.clone().local(), { duration: this.duration });
    }

    throw new InvalidDateAdapterError(
      `MomentDateAdapter only supports "UTC" and undefined ` +
        `(local) timezones but "${value}" was provided. ` +
        `Seperately, use can use the MomentTZDateAdapter for timezone support`,
    );
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
    } else if (![null, 'UTC'].includes(this.timezone)) {
      throw new InvalidDateAdapterError(
        `MomentDateAdapter only supports 'UTC' and local (null) timezones but ` +
          `"${this.timezone}" was specified.`,
      );
    } else if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

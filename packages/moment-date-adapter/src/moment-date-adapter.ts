import {
  ArgumentError,
  DateAdapter,
  DateAdapterBase,
  DateTime,
  InvalidDateAdapterError,
} from '@rschedule/core';
import moment from 'moment';

/**
 * The `MomentDateAdapter` is for using with momentjs *without* the
 * `moment-timezone` package. It only supports `"UTC"` and local
 * timezones.
 *
 * If you want timezone support, you'll need to install the
 * `moment-timezone` package along with `@rschedule/moment-tz-date-adapter`.
 */
export class MomentDateAdapter extends DateAdapterBase {
  static readonly date: moment.Moment;
  static readonly hasTimezoneSupport = false;

  /**
   * Checks if object is an instance of `DateTime`
   */
  static isDate(object: any): object is moment.Moment {
    return moment.isMoment(object);
  }

  static fromDate(date: moment.Moment, options?: { duration?: number }): MomentDateAdapter {
    return new MomentDateAdapter(date, options);
  }

  static fromJSON(json: DateAdapter.JSON): MomentDateAdapter {
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

  static fromDateTime(datetime: DateTime): MomentDateAdapter {
    const date = MomentDateAdapter.fromJSON(datetime.toJSON());
    (date.generators as any).push(...datetime.generators);
    return date;
  }

  get date(): moment.Moment {
    return this._date.clone();
  }

  readonly timezone: string | null;

  private _end: moment.Moment | undefined;
  private _date: moment.Moment;

  constructor(
    date: moment.Moment,
    options: { duration?: number; generators?: ReadonlyArray<unknown> } = {},
  ) {
    super(undefined, options);

    this._date = date.clone();
    this.timezone = date.isUTC() ? 'UTC' : null;

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

  set(prop: 'timezone', value: string | null): this;
  set(prop: 'duration', value: number): this;
  set(prop: 'timezone' | 'duration', value: number | string | null): MomentDateAdapter {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else {
        const date = this._date.clone();

        if (value === 'UTC') {
          date.utc();
        } else if (value === null) {
          date.local();
        } else {
          throw new InvalidDateAdapterError(
            `MomentDateAdapter only supports "UTC" and undefined ` +
              `(local) timezones but "${value}" was provided. ` +
              `Seperately, use can use the MomentTZDateAdapter for timezone support`,
          );
        }

        return new MomentDateAdapter(date, {
          duration: this.duration,
          generators: this.generators,
        });
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new MomentDateAdapter(this._date, {
          duration: value as number,
          generators: this.generators,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for MomentDateAdapter#set()`);
  }

  valueOf(): number {
    return this._date.valueOf();
  }

  toISOString(): string {
    return this._date.toISOString();
  }

  toJSON(): DateAdapter.JSON {
    const json: DateAdapter.JSON = {
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

  assertIsValid(): true {
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

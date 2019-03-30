import { DateAdapter, DateTime, IDateAdapter, InvalidDateAdapterError } from '@rschedule/rschedule';
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
      case undefined:
        return new MomentDateAdapter(moment(args), { duration: json.duration });
      default:
        throw new InvalidDateAdapterError(
          'The `MomentDateAdapter` only supports datetimes in ' +
            `UTC or LOCAL time. You attempted to parse an ICAL ` +
            `string with a "${json.timezone}" timezone. ` +
            'Timezones are supported by the `MomentTZDateAdapter` ' +
            'with the `moment-timezone` package installed.',
        );
    }
  }

  readonly timezone: string | undefined;
  readonly duration: number | undefined;

  protected readonly [MOMENT_DATE_ADAPTER_ID] = true;

  constructor(readonly date: moment.Moment, options: { duration?: number } = {}) {
    super(undefined);

    this.date = date.clone();
    this.timezone = this.date.isUTC() ? 'UTC' : undefined;
    this.duration = options.duration;

    this.assertIsValid();
  }

  set(_: 'timezone', value: string | undefined) {
    if (this.timezone === value) return this;

    if (value === 'UTC') {
      return new MomentDateAdapter(this.date.clone().utc(), { duration: this.duration });
    } else if (value === undefined) {
      return new MomentDateAdapter(this.date.clone().local(), { duration: this.duration });
    }

    throw new InvalidDateAdapterError(
      `MomentDateAdapter only supports "UTC" and undefined ` +
        `(local) timezones but "${value}" was provided. ` +
        `Seperately, use can use the MomentTZDateAdapter for timezone support`,
    );
  }

  valueOf() {
    return this.date.valueOf();
  }

  toISOString() {
    return this.date.toISOString();
  }

  toDateTime(): DateTime {
    return DateTime.fromJSON(this.toJSON());
  }

  toJSON(): IDateAdapter.JSON {
    return {
      timezone: this.timezone,
      duration: this.duration,
      year: this.date.get('year'),
      month: this.date.get('month') + 1,
      day: this.date.get('date'),
      hour: this.date.get('hour'),
      minute: this.date.get('minute'),
      second: this.date.get('second'),
      millisecond: this.date.get('millisecond'),
    };
  }

  assertIsValid() {
    if (!this.date.isValid()) {
      throw new InvalidDateAdapterError();
    } else if (![undefined, 'UTC'].includes(this.timezone)) {
      throw new InvalidDateAdapterError(
        'MomentDateAdapter only supports local and UTC timezones but ' +
          `"${this.timezone}" was specified.`,
      );
    } else if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

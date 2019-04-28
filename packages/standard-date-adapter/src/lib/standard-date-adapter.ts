import {
  DateAdapter,
  DateTime,
  IDateAdapter,
  InvalidDateAdapterError,
  OccurrenceGenerator,
  RScheduleConfig,
} from '@rschedule/rschedule';

const STANDARD_DATE_ADAPTER_ID = Symbol.for('09e206a9-a8b2-4c85-b2c6-6442bb895153');

export class StandardDateAdapter extends DateAdapter implements IDateAdapter<Date> {
  static readonly date: Date;
  static readonly hasTimezoneSupport = false;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `DateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: unknown): object is StandardDateAdapter {
    return !!(super.isInstance(object) && (object as any)[STANDARD_DATE_ADAPTER_ID]);
  }

  static isDate(object: unknown): object is Date {
    return Object.prototype.toString.call(object) === '[object Date]';
  }

  static fromJSON(json: IDateAdapter.JSON): StandardDateAdapter {
    const args: [number, number, number, number, number, number, number] = [
      json.year,
      json.month - 1,
      json.day,
      json.hour,
      json.minute,
      json.second,
      json.millisecond,
    ];

    switch (json.timezone) {
      case 'UTC': {
        return new StandardDateAdapter(new Date(Date.UTC(...args)), {
          timezone: 'UTC',
          duration: json.duration,
        });
      }
      case null: {
        return new StandardDateAdapter(new Date(...args), {
          timezone: null,
          duration: json.duration,
        });
      }
      default:
        throw new InvalidDateAdapterError(
          'The `StandardDateAdapter` only supports datetimes in ' +
            `UTC or LOCAL (null) time. You provided a JSON object ` +
            `with timezone "${json.timezone}".`,
        );
    }
  }

  static fromDateTime(datetime: DateTime) {
    return StandardDateAdapter.fromJSON(datetime.toJSON());
  }

  get date() {
    return new Date(this._date);
  }

  readonly timezone: string | null;
  readonly duration: number | undefined;
  readonly generators: unknown[] = [];

  protected readonly [STANDARD_DATE_ADAPTER_ID] = true;

  private _end: Date | undefined;
  private _date: Date;

  constructor(date: Date, options: { timezone?: string | null; duration?: number } = {}) {
    super(undefined);

    this._date = new Date(date);
    this.timezone = options.timezone !== undefined ? options.timezone : null;
    this.duration = options.duration;

    this.assertIsValid();
  }

  get end(): Date | undefined {
    if (!this.duration) return;

    if (this._end) return this._end;

    this._end = StandardDateAdapter.fromDateTime(
      this.toDateTime().add(this.duration, 'millisecond'),
    ).date;

    return this._end;
  }

  set(_: 'timezone', value: string | null) {
    if (this.timezone === value) return this;

    if (value === 'UTC') {
      return new StandardDateAdapter(this._date, { timezone: 'UTC', duration: this.duration });
    } else if (value === null) {
      return new StandardDateAdapter(this._date, { timezone: null, duration: this.duration });
    }

    throw new InvalidDateAdapterError(
      `StandardDateAdapter only supports "UTC" and local ` +
        `(null) timezones but "${value}" was provided.`,
    );
  }

  valueOf() {
    return this._date.valueOf();
  }

  toISOString() {
    return this._date.toISOString();
  }

  toDateTime(): DateTime {
    return DateTime.fromJSON(this.toJSON());
  }

  toJSON(): IDateAdapter.JSON {
    if (this.timezone === 'UTC') {
      return {
        timezone: this.timezone,
        duration: this.duration,
        year: this._date.getUTCFullYear(),
        month: this._date.getUTCMonth() + 1,
        day: this._date.getUTCDate(),
        hour: this._date.getUTCHours(),
        minute: this._date.getUTCMinutes(),
        second: this._date.getUTCSeconds(),
        millisecond: this._date.getUTCMilliseconds(),
      };
    }

    return {
      timezone: this.timezone,
      duration: this.duration,
      year: this._date.getFullYear(),
      month: this._date.getMonth() + 1,
      day: this._date.getDate(),
      hour: this._date.getHours(),
      minute: this._date.getMinutes(),
      second: this._date.getSeconds(),
      millisecond: this._date.getMilliseconds(),
    };
  }

  assertIsValid() {
    if (!StandardDateAdapter.isDate(this._date) || isNaN(this._date.valueOf())) {
      throw new InvalidDateAdapterError('StandardDateAdapter has invalid date.');
    } else if (![null, 'UTC'].includes(this.timezone)) {
      throw new InvalidDateAdapterError(
        'StandardDateAdapter only supports local (null) and UTC timezones but ' +
          `"${this.timezone}" was specified.`,
      );
    } else if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

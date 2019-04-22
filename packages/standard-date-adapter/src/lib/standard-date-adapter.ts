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

  readonly date: Date;
  readonly timezone: string | null;
  readonly duration: number | undefined;
  readonly generators: unknown[] = [];

  protected readonly [STANDARD_DATE_ADAPTER_ID] = true;

  private _end: Date | undefined;

  constructor(date: Date, options: { timezone?: string | null; duration?: number } = {}) {
    super(undefined);

    this.date = new Date(date);
    this.timezone =
      options.timezone !== undefined ? options.timezone : RScheduleConfig.defaultTimezone;
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
      return new StandardDateAdapter(this.date, { timezone: 'UTC', duration: this.duration });
    } else if (value === null) {
      return new StandardDateAdapter(this.date, { timezone: null, duration: this.duration });
    }

    throw new InvalidDateAdapterError(
      `StandardDateAdapter only supports "UTC" and local ` +
        `(null) timezones but "${value}" was provided.`,
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
    if (this.timezone === 'UTC') {
      return {
        timezone: this.timezone,
        duration: this.duration,
        year: this.date.getUTCFullYear(),
        month: this.date.getUTCMonth() + 1,
        day: this.date.getUTCDate(),
        hour: this.date.getUTCHours(),
        minute: this.date.getUTCMinutes(),
        second: this.date.getUTCSeconds(),
        millisecond: this.date.getUTCMilliseconds(),
      };
    }

    return {
      timezone: this.timezone,
      duration: this.duration,
      year: this.date.getFullYear(),
      month: this.date.getMonth() + 1,
      day: this.date.getDate(),
      hour: this.date.getHours(),
      minute: this.date.getMinutes(),
      second: this.date.getSeconds(),
      millisecond: this.date.getMilliseconds(),
    };
  }

  assertIsValid() {
    if (!StandardDateAdapter.isDate(this.date) || isNaN(this.date.valueOf())) {
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

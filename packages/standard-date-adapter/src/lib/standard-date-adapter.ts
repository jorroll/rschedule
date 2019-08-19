import {
  ArgumentError,
  DateAdapter,
  DateTime,
  IDateAdapter,
  InvalidDateAdapterError,
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
    const date = StandardDateAdapter.fromJSON(datetime.toJSON());
    date.generators.push(...datetime.generators);
    return date;
  }

  get date() {
    return new Date(this._date);
  }

  readonly timezone: string | null;
  readonly generators: unknown[] = [];

  protected readonly [STANDARD_DATE_ADAPTER_ID] = true;

  private _end: Date | undefined;
  private _date: Date;

  constructor(date: Date, options: { timezone?: string | null; duration?: number } = {}) {
    super(undefined, options);

    if (!['UTC', null, undefined].includes(options.timezone)) {
      throw new InvalidDateAdapterError(
        `StandardDateAdapter only supports "UTC" and ` +
          `local time zones but "${options.timezone}" was provided.`,
      );
    }

    this._date = new Date(date);
    this.timezone = options.timezone !== undefined ? (options.timezone as 'UTC') : null;

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

  set(prop: 'timezone', value: string | null): StandardDateAdapter;
  set(prop: 'duration', value: number): StandardDateAdapter;
  set(prop: 'timezone' | 'duration', value: number | string | null) {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else {
        return new StandardDateAdapter(this._date, {
          timezone: value as string | null,
          duration: this.duration,
        });
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new StandardDateAdapter(this._date, {
          timezone: this.timezone,
          duration: value as number,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for StandardDateAdapter#set()`);
  }

  valueOf() {
    return this._date.valueOf();
  }

  toISOString() {
    return this._date.toISOString();
  }

  toJSON(): IDateAdapter.JSON {
    let json: IDateAdapter.JSON;

    if (this.timezone === 'UTC') {
      json = {
        timezone: this.timezone,
        year: this._date.getUTCFullYear(),
        month: this._date.getUTCMonth() + 1,
        day: this._date.getUTCDate(),
        hour: this._date.getUTCHours(),
        minute: this._date.getUTCMinutes(),
        second: this._date.getUTCSeconds(),
        millisecond: this._date.getUTCMilliseconds(),
      };
    } else {
      json = {
        timezone: this.timezone,
        year: this._date.getFullYear(),
        month: this._date.getMonth() + 1,
        day: this._date.getDate(),
        hour: this._date.getHours(),
        minute: this._date.getMinutes(),
        second: this._date.getSeconds(),
        millisecond: this._date.getMilliseconds(),
      };
    }

    if (this.duration) {
      json.duration = this.duration;
    }

    return json;
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

import {
  ArgumentError,
  DateAdapter,
  DateAdapterBase,
  DateTime,
  InvalidDateAdapterError,
} from '@rschedule/core';

export class StandardDateAdapter extends DateAdapterBase {
  static readonly date: Date;
  static readonly hasTimezoneSupport: false = false;

  static isDate(object: unknown): object is Date {
    return Object.prototype.toString.call(object) === '[object Date]';
  }

  static fromDate(
    date: Date,
    options?: { timezone?: string | null; duration?: number },
  ): StandardDateAdapter {
    return new StandardDateAdapter(date, options);
  }

  static fromJSON(json: DateAdapter.JSON): StandardDateAdapter {
    const args: [number, number, number, number, number, number, number] = [
      json.year,
      json.month - 1,
      json.day,
      json.hour,
      json.minute,
      json.second,
      json.millisecond,
    ];

    let date: StandardDateAdapter;

    switch (json.timezone) {
      case 'UTC': {
        date = new StandardDateAdapter(new Date(Date.UTC(...args)), {
          timezone: 'UTC',
          duration: json.duration,
        });

        break;
      }
      case null: {
        date = new StandardDateAdapter(new Date(...args), {
          timezone: null,
          duration: json.duration,
        });

        break;
      }
      default:
        throw new InvalidDateAdapterError(
          'The `StandardDateAdapter` only supports datetimes in ' +
            `UTC or LOCAL (null) time. You provided a JSON object ` +
            `with timezone "${json.timezone}".`,
        );
    }

    if (json.metadata) {
      Object.assign(date.metadata, json.metadata);
    }

    return date;
  }

  static fromDateTime(datetime: DateTime): StandardDateAdapter {
    const date = StandardDateAdapter.fromJSON(datetime.toJSON());
    (date.generators as any).push(...datetime.generators);
    if (datetime.metadata) {
      Object.assign(date.metadata, datetime.metadata);
    }
    return date;
  }

  get date(): Date {
    return new Date(this._date);
  }

  readonly timezone: string | null;

  private _end: Date | undefined;
  private _date: Date;

  constructor(
    date: Date,
    options: {
      timezone?: string | null;
      duration?: number;
      generators?: ReadonlyArray<unknown>;
      metadata?: DateAdapterBase['metadata'];
    } = {},
  ) {
    super(undefined, options);

    if (!['UTC', null, undefined].includes(options.timezone)) {
      throw new InvalidDateAdapterError(
        `StandardDateAdapter only supports "UTC" and ` +
          `local time zones but "${options.timezone}" was provided.`,
      );
    }

    this._date = new Date(date);
    this.timezone = options.timezone !== undefined ? (options.timezone as 'UTC') : null;

    if (options.metadata) {
      Object.assign(this.metadata, options.metadata);
    }

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

  set(prop: 'timezone', value: string | null): this;
  set(prop: 'duration', value: number): this;
  set(prop: 'timezone' | 'duration', value: number | string | null): StandardDateAdapter {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else {
        return new StandardDateAdapter(this._date, {
          timezone: value as string | null,
          duration: this.duration,
          generators: this.generators,
        });
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new StandardDateAdapter(this._date, {
          timezone: this.timezone,
          duration: value as number,
          generators: this.generators,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for StandardDateAdapter#set()`);
  }

  valueOf(): number {
    return this._date.valueOf();
  }

  toJSON(): DateAdapter.JSON {
    let json: DateAdapter.JSON;

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

  assertIsValid(): true {
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

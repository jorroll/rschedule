import {
  ArgumentError,
  DateAdapter,
  DateAdapterBase,
  DateTime,
  InvalidDateAdapterError,
} from '@rschedule/core';

import dayjs from 'dayjs';
// tslint:disable-next-line: no-submodule-imports
import type utc from 'dayjs/plugin/utc';

/**
 * The `DayjsDateAdapter` is intended for usage with `dayjs`.
 * It supports `"UTC"` and local timezones.
 */
export class DayjsDateAdapter extends DateAdapterBase {
  static readonly date: dayjs.Dayjs;
  static readonly hasTimezoneSupport: false = false;

  /**
   * Checks if object is an instance of `DateTime`
   */
  static isDate(object: any): object is dayjs.Dayjs {
    return dayjs.isDayjs(object);
  }

  static fromDate(date: dayjs.Dayjs, options?: { duration?: number }): DayjsDateAdapter {
    return new DayjsDateAdapter(date, options);
  }

  static fromJSON(json: DateAdapter.JSON): DayjsDateAdapter {
    const args = [
      json.year,
      json.month - 1,
      json.day,
      json.hour,
      json.minute,
      json.second,
      json.millisecond,
    ];

    let date: DayjsDateAdapter;

    switch (json.timezone) {
      case 'UTC':
        date = new DayjsDateAdapter(dayjs.utc(Date.UTC(...(args as [any, any]))), { duration: json.duration });
        break;
      case null:
        date = new DayjsDateAdapter(dayjs(new Date(...(args as [any, any]))), { duration: json.duration });
        break;
      default:
        throw new InvalidDateAdapterError(
          'The `DayjsDateAdapter` only supports datetimes in ' +
          `'UTC' or local (null) time. You attempted to parse an ICAL ` +
          `string with a "${json.timezone}" timezone. ` +
          'Timezones are supported by the `MomentTZDateAdapter` ' +
          'with the `dayjs-timezone` package installed.',
        );
    }
    
    if (json.metadata) {
      Object.assign(date.metadata, json.metadata);
    }

    return date;
  }

  static fromDateTime(datetime: DateTime): DayjsDateAdapter {
    const date = DayjsDateAdapter.fromJSON(datetime.toJSON());
    (date.generators as any).push(...datetime.generators);
    
    if (datetime.metadata) {
      Object.assign(date.metadata, datetime.metadata);
    }

    return date;
  }

  get date(): dayjs.Dayjs {
    return this._date;
  }

  readonly timezone: string | null;

  private _end: dayjs.Dayjs | undefined;
  private _date: dayjs.Dayjs;

  constructor(
    date: dayjs.Dayjs,
    options: { 
      duration?: number; 
      generators?: ReadonlyArray<unknown>; 
      metadata?: DateAdapterBase['metadata'];
    } = {},
  ) {
    super(undefined, options);

    if (typeof dayjs.utc === 'undefined') {
      throw new Error(
        `The "DayjsDateAdapter" requires the dayjs "UTC" plugin to be loaded.`
      );
    }

    this._date = date;
    this.timezone = date.isUTC() ? 'UTC' : null;

    if (options.metadata) {
      Object.assign(this.metadata, options.metadata);
    }

    this.assertIsValid();
  }

  get end(): dayjs.Dayjs | undefined {
    if (!this.duration) return;

    if (this._end) return this._end;

    this._end = DayjsDateAdapter.fromDateTime(
      this.toDateTime().add(this.duration, 'millisecond'),
    ).date;

    return this._end;
  }

  set(prop: 'timezone', value: string | null): this;
  set(prop: 'duration', value: number): this;
  set(prop: 'timezone' | 'duration', value: number | string | null): DayjsDateAdapter {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else {
        if (!(value === 'UTC' || value === null)) {
          throw new InvalidDateAdapterError(
            `DayjsDateAdapter only supports "UTC" and undefined ` +
            `(local) timezones but "${value}" was provided. ` +
            `Seperately, use can use the MomentTZDateAdapter for timezone support`,
          );
        }

        // dayjs is immutable
        return new DayjsDateAdapter(value === 'UTC' ? this._date.utc() : this._date.local(), {
          duration: this.duration,
          generators: this.generators,
        });
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new DayjsDateAdapter(this._date, {
          duration: value as number,
          generators: this.generators,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for DayjsDateAdapter#set()`);
  }

  valueOf(): number {
    return this._date.valueOf();
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
        `DayjsDateAdapter only supports 'UTC' and local (null) timezones but ` +
        `"${this.timezone}" was specified.`,
      );
    } else if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

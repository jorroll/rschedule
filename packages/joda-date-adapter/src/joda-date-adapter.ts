import { DateTimeFormatter, ZonedDateTime, ZoneId } from '@js-joda/core';
import {
  ArgumentError,
  DateAdapter,
  DateAdapterBase,
  DateTime,
  InvalidDateAdapterError,
} from '@rschedule/core';

/**
 * The `JodaDateAdapter` is a DateAdapter for "@js-joda/core" `ZonedDateTime`
 * objects.
 *
 * It supports timezone handling in so far as js-joda supports
 * timezone handling. That is, it only supports the SYSTEM and UTC
 * time zones unless you have loaded the optional @js-joda/timezone
 * package.
 */
export class JodaDateAdapter extends DateAdapterBase {
  static readonly date: ZonedDateTime;
  static readonly hasTimezoneSupport = true;

  /**
   * Checks if object is an instance of `ZonedDateTime`
   */
  static isDate(object: any): object is ZonedDateTime {
    return object instanceof ZonedDateTime;
  }

  static fromDate(date: ZonedDateTime, options?: { duration?: number }): JodaDateAdapter {
    return new JodaDateAdapter(date, options);
  }

  static fromJSON(json: DateAdapter.JSON): JodaDateAdapter {
    const zone = json.timezone === null ? ZoneId.SYSTEM : ZoneId.of(json.timezone);

    return new JodaDateAdapter(
      ZonedDateTime.of(
        json.year,
        json.month,
        json.day,
        json.hour,
        json.minute,
        json.second,
        json.millisecond * 1_000_000,
        zone,
      ),
      { duration: json.duration },
    );
  }

  static fromDateTime(datetime: DateTime): JodaDateAdapter {
    const date = JodaDateAdapter.fromJSON(datetime.toJSON());
    (date.generators as any).push(...datetime.generators);
    return date;
  }

  readonly date: ZonedDateTime;
  readonly timezone: string | null;

  private _end: ZonedDateTime | undefined;

  constructor(
    date: ZonedDateTime,
    options: { duration?: number; generators?: ReadonlyArray<unknown> } = {},
  ) {
    super(undefined, options);

    this.date = date;
    this.timezone = this.date.zone() === ZoneId.SYSTEM ? null : this.date.zone().toString();

    if (this.timezone === 'Z') {
      this.timezone = 'UTC';
    }

    this.assertIsValid();
  }

  get end(): ZonedDateTime | undefined {
    if (!this.duration) return;

    if (this._end) return this._end;

    this._end = this.date.plusNanos(this.duration * 1_000_000);

    return this._end;
  }

  set(prop: 'timezone', value: string | null): this;
  set(prop: 'duration', value: number): this;
  set(prop: 'timezone' | 'duration', value: number | string | null): JodaDateAdapter {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else {
        return new JodaDateAdapter(
          this.date.withZoneSameInstant(
            value === null ? ZoneId.SYSTEM : ZoneId.of(value as string),
          ),
          {
            duration: this.duration,
            generators: this.generators,
          },
        );
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new JodaDateAdapter(this.date, {
          duration: value as number,
          generators: this.generators,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for JodaDateAdapter#set()`);
  }

  valueOf(): number {
    return this.date.toInstant().toEpochMilli();
  }

  toJSON(): DateAdapter.JSON {
    const json: DateAdapter.JSON = {
      timezone: this.timezone,
      year: this.date.year(),
      month: this.date.monthValue(),
      day: this.date.dayOfMonth(),
      hour: this.date.hour(),
      minute: this.date.minute(),
      second: this.date.second(),
      millisecond: this.date.nano() / 1_000_000,
    };

    if (this.duration) {
      json.duration = this.duration;
    }

    return json;
  }

  assertIsValid(): true {
    if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

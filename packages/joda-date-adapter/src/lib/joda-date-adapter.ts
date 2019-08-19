import { DateTimeFormatter, ZonedDateTime, ZoneId } from '@js-joda/core';
import {
  ArgumentError,
  DateAdapter,
  DateTime,
  IDateAdapter,
  InvalidDateAdapterError,
} from '@rschedule/rschedule';

const JODA_DATE_ADAPTER_ID = Symbol.for('a422fb72-ee66-498c-9972-03ff797cbe64');

/**
 * The `JodaDateAdapter` is a DateAdapter for "@js-joda/core" `ZonedDateTime`
 * objects.
 *
 * It supports timezone handling in so far as js-joda supports
 * timezone handling. That is, it only supports the SYSTEM and UTC
 * time zones unless you have loaded the optional @js-joda/timezone
 * package.
 */
export class JodaDateAdapter extends DateAdapter implements IDateAdapter<ZonedDateTime> {
  static readonly date: ZonedDateTime;
  static readonly hasTimezoneSupport = true;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `JodaDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is JodaDateAdapter {
    return !!(super.isInstance(object) && (object as any)[JODA_DATE_ADAPTER_ID]);
  }

  /**
   * Checks if object is an instance of `ZonedDateTime`
   */
  static isDate(object: any): object is ZonedDateTime {
    return object instanceof ZonedDateTime;
  }

  static fromJSON(json: IDateAdapter.JSON): JodaDateAdapter {
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

  static fromDateTime(datetime: DateTime) {
    const date = JodaDateAdapter.fromJSON(datetime.toJSON());
    date.generators.push(...datetime.generators);
    return date;
  }

  readonly date: ZonedDateTime;
  readonly timezone: string | null;
  readonly generators: unknown[] = [];

  protected readonly [JODA_DATE_ADAPTER_ID] = true;

  private _end: ZonedDateTime | undefined;

  constructor(date: ZonedDateTime, options: { duration?: number } = {}) {
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

  set(prop: 'timezone', value: string | null): JodaDateAdapter;
  set(prop: 'duration', value: number): JodaDateAdapter;
  set(prop: 'timezone' | 'duration', value: number | string | null) {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else {
        return new JodaDateAdapter(
          this.date.withZoneSameInstant(
            value === null ? ZoneId.SYSTEM : ZoneId.of(value as string),
          ),
          {
            duration: this.duration,
          },
        );
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new JodaDateAdapter(this.date, {
          duration: value as number,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for JodaDateAdapter#set()`);
  }

  valueOf() {
    return this.date.toInstant().toEpochMilli();
  }

  toISOString() {
    return this.date.format(DateTimeFormatter.ISO_INSTANT);
  }

  toJSON(): IDateAdapter.JSON {
    const json: IDateAdapter.JSON = {
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

  assertIsValid() {
    if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

import {
  ArgumentError,
  DateAdapter,
  DateTime,
  IDateAdapter,
  InvalidDateAdapterError,
} from '@rschedule/rschedule';
import { DateTime as LuxonDateTime, LocalZone } from 'luxon';

const LUXON_DATE_ADAPTER_ID = Symbol.for('9689fd66-841f-4a75-8ee0-f0515571779b');

/**
 * The `LuxonDateAdapter` is a DateAdapter for `luxon` DateTime
 * objects.
 *
 * It supports timezone handling in so far as luxon supports
 * timezone handling. Note: that, if able, luxon always adds
 * a timezone to a DateTime (i.e. timezone may never be undefined).
 *
 * At the moment, that means that serializing to/from iCal will
 * always apply a specific timezone (which may or may not be what
 * you want). If this is a problem for you, you can try opening
 * an issue in the rSchedule monorepo.
 */
export class LuxonDateAdapter extends DateAdapter implements IDateAdapter<LuxonDateTime> {
  static readonly date: LuxonDateTime;
  static readonly hasTimezoneSupport = true;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `LuxonDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is LuxonDateAdapter {
    return !!(super.isInstance(object) && (object as any)[LUXON_DATE_ADAPTER_ID]);
  }

  /**
   * Checks if object is an instance of `LuxonDateTime`
   */
  static isDate(object: any): object is LuxonDateTime {
    return LuxonDateTime.isDateTime(object);
  }

  static fromJSON(json: IDateAdapter.JSON): LuxonDateAdapter {
    const zone = json.timezone === null ? 'local' : json.timezone === 'UTC' ? 'utc' : json.timezone;

    return new LuxonDateAdapter(
      LuxonDateTime.fromObject({
        zone,
        year: json.year,
        month: json.month,
        day: json.day,
        hour: json.hour,
        minute: json.minute,
        second: json.second,
        millisecond: json.millisecond,
      }),
      { duration: json.duration },
    );
  }

  /**
   * ### Important!!!
   *
   * This method expects an *rSchedule* `DateTime` object which bares
   * *no relation* to a luxon `DateTime` object. This method is largely
   * meant for private, internal rSchedule use.
   *
   * @param datetime rSchedule DateTime object
   */
  static fromDateTime(datetime: DateTime) {
    const date = LuxonDateAdapter.fromJSON(datetime.toJSON());
    date.generators.push(...datetime.generators);
    return date;
  }

  readonly date: LuxonDateTime;
  readonly timezone: string | null;
  readonly generators: unknown[] = [];

  protected readonly [LUXON_DATE_ADAPTER_ID] = true;

  private _end: LuxonDateTime | undefined;

  constructor(date: LuxonDateTime, options: { duration?: number } = {}) {
    super(undefined, options);

    this.date = date;
    this.timezone = date.zone instanceof LocalZone ? null : date.zoneName;

    this.assertIsValid();
  }

  get end(): LuxonDateTime | undefined {
    if (!this.duration) return;

    if (this._end) return this._end;

    this._end = LuxonDateAdapter.fromDateTime(
      this.toDateTime().add(this.duration, 'millisecond'),
    ).date;

    return this._end;
  }

  set(prop: 'timezone', value: string | null): LuxonDateAdapter;
  set(prop: 'duration', value: number): LuxonDateAdapter;
  set(prop: 'timezone' | 'duration', value: number | string | null) {
    if (prop === 'timezone') {
      if (this.timezone === value) return this;
      else if (value === null) {
        return new LuxonDateAdapter(this.date.toLocal(), { duration: this.duration });
      } else {
        return new LuxonDateAdapter(this.date.setZone(value as string), {
          duration: this.duration,
        });
      }
    } else if (prop === 'duration') {
      if (this.duration === value) return this;
      else {
        return new LuxonDateAdapter(this.date, {
          duration: value as number,
        });
      }
    }

    throw new ArgumentError(`Unknown prop "${prop}" for LuxonDateAdapter#set()`);
  }

  valueOf() {
    return this.date.valueOf();
  }

  toISOString() {
    return this.date.toUTC().toISO();
  }

  toJSON(): IDateAdapter.JSON {
    const json: IDateAdapter.JSON = {
      timezone: this.timezone,
      year: this.date.get('year'),
      month: this.date.get('month'),
      day: this.date.get('day'),
      hour: this.date.get('hour'),
      minute: this.date.get('minute'),
      second: this.date.get('second'),
      millisecond: this.date.get('millisecond'),
    };

    if (this.duration) {
      json.duration = this.duration;
    }

    return json;
  }

  assertIsValid() {
    if (!this.date.isValid) {
      throw new InvalidDateAdapterError();
    } else if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

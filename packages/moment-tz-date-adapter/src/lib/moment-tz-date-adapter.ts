import {
  DateAdapter,
  DateTime,
  IDateAdapter,
  InvalidDateAdapterError,
  OccurrenceGenerator,
} from '@rschedule/rschedule';
import moment from 'moment-timezone';

const MOMENT_TZ_DATE_ADAPTER_ID = Symbol.for('4796ecb9-5ad7-4fdf-9a8f-13f926546576');

/**
 * The `MomentTZDateAdapter` is for using with `momentjs` with it's optional
 * `moment-timezone` package. It supports robust timezone handling.
 *
 * If you are not using the optional `moment-timezone` package, you should
 * use the `MomentDateAdapter` by installing `@rschedule/moment-date-adapter`.
 */
export class MomentTZDateAdapter extends DateAdapter implements IDateAdapter<moment.Moment> {
  static readonly date: moment.Moment;
  static readonly hasTimezoneSupport = true;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `MomentTZDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is MomentTZDateAdapter {
    return !!(super.isInstance(object) && (object as any)[MOMENT_TZ_DATE_ADAPTER_ID]);
  }

  /**
   * Checks if object is an instance of `DateTime`
   */
  static isDate(object: any): object is moment.Moment {
    return moment.isMoment(object);
  }

  static fromJSON(json: IDateAdapter.JSON): MomentTZDateAdapter {
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
      case null:
        return new MomentTZDateAdapter(moment(args), { duration: json.duration });
      default:
        return new MomentTZDateAdapter(moment.tz(args, json.timezone), { duration: json.duration });
    }
  }

  static fromDateTime(datetime: DateTime) {
    return MomentTZDateAdapter.fromJSON(datetime.toJSON());
  }

  readonly date: moment.Moment;
  readonly timezone: string | null;
  readonly duration: number | undefined;
  readonly generators: OccurrenceGenerator<typeof MomentTZDateAdapter>[] = [];

  protected readonly [MOMENT_TZ_DATE_ADAPTER_ID] = true;

  constructor(date: moment.Moment, options: { duration?: number } = {}) {
    super(undefined);

    this.date = date.clone();
    this.timezone = this.date.tz() || null;
    this.duration = options.duration;

    this.assertIsValid();
  }

  set(_: 'timezone', value: string | null) {
    if (this.timezone === value) return this;

    const date = this.date.clone();

    if (value === null) {
      // work around for https://github.com/moment/moment-timezone/issues/738
      date.utc().local();
    } else {
      date.tz(value);
    }

    return new MomentTZDateAdapter(date, { duration: this.duration });
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
    } else if (this.duration && this.duration <= 0) {
      throw new InvalidDateAdapterError('If provided, duration must be greater than 0.');
    }

    return true;
  }
}

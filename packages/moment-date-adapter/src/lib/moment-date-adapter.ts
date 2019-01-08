import {
  DateAdapterBase,
  IDateAdapter,
  IDateAdapterJSON,
  ParsedDatetime,
  Utils,
} from '@rschedule/rschedule';
import moment from 'moment';

const MOMENT_DATE_ADAPTER_ID = Symbol.for(
  '9f60d072-15b6-453c-be71-5c8f9c04fbbd',
);

/**
 * The `MomentDateAdapter` is for using with momentjs *without* the
 * `moment-timezone` package. It only supports `"UTC"` and local
 * timezones.
 *
 * If you want timezone support, you'll need to install the
 * `moment-timezone` package, and use it with the
 * `MomentTZDateAdapter`.
 */
export class MomentDateAdapter extends DateAdapterBase<moment.Moment> {
  public static date: moment.Moment;

  public static fromJSON(input: IDateAdapterJSON): MomentDateAdapter {
    const args = [
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
      input.second,
      input.millisecond,
    ];

    switch (input.zone) {
      case 'UTC':
        return new MomentDateAdapter(moment.utc(args));
      case undefined:
      case 'DATE':
        return new MomentDateAdapter(moment(args));
      default:
        throw new IDateAdapter.InvalidDateError(
          'The `MomentDateAdapter` only supports datetimes in ' +
            `UTC or LOCAL time. You attempted to parse an ICAL ` +
            `string with a "${input.zone}" timezone. ` +
            'Timezones are supported by the `MomentTZDateAdapter` ' +
            'with the `moment-timezone` package installed.',
        );
    }
  }

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `MomentDateAdapter` by checking against the
   * global symbol registry.
   */
  public static isInstance(object: any): object is MomentDateAdapter {
    return !!(
      object &&
      object[MOMENT_DATE_ADAPTER_ID] &&
      super.isInstance(object)
    );
  }

  /**
   * Checks if object is an instance of `Moment`
   */
  public static isDate(object: any): object is moment.Moment {
    return moment.isMoment(object);
  }

  public date: moment.Moment;

  // @ts-ignore used by static method
  private readonly [MOMENT_DATE_ADAPTER_ID] = true;

  constructor(date?: moment.Moment, args: {} = {}) {
    super();

    if (moment.isMoment(date)) {
      this.date = date.clone();
    } else if (date) {
      throw new IDateAdapter.InvalidDateError(
        'The `MomentDateAdapter` constructor only accepts `moment()` dates. ' +
          `Received: ${date}`,
      );
    } else {
      this.date = moment();
    }

    this.assertIsValid();
  }

  /**
   * Returns a clone of the date adapter including a cloned
   * date property. Does not clone the `rule`, `schedule`,
   * or `calendar` properties, but does copy them over to the
   * new object.
   */
  public clone(): MomentDateAdapter {
    const adapter = new MomentDateAdapter(this.date);
    adapter.generators = this.generators.slice();
    return adapter;
  }

  public get(unit: IDateAdapter.Unit | 'yearday'): number;
  public get(unit: 'weekday'): IDateAdapter.Weekday;
  public get(unit: 'timezone'): 'UTC' | undefined;
  public get(unit: IDateAdapter.Unit | 'yearday' | 'weekday' | 'timezone') {
    switch (unit) {
      case 'year':
        return this.date.get('year');
      case 'month':
        return this.date.get('month') + 1;
      case 'yearday':
        return Utils.getYearDay(
          this.get('year'),
          this.get('month'),
          this.get('day'),
        );
      case 'weekday':
        return Utils.WEEKDAYS[this.date.get('weekday')];
      case 'day':
        return this.date.get('date');
      case 'hour':
        return this.date.get('hour');
      case 'minute':
        return this.date.get('minute');
      case 'second':
        return this.date.get('second');
      case 'millisecond':
        return this.date.get('millisecond');
      case 'timezone':
        return this.date.isUTC() ? 'UTC' : undefined;
      default:
        throw new Error('Invalid unit provided to `MomentDateAdapter#set`');
    }
  }

  public set(unit: IDateAdapter.Unit, value: number): this;
  public set(
    unit: 'timezone',
    value: 'UTC' | undefined,
    options?: { keepLocalTime?: boolean },
  ): this;
  public set(
    unit: IDateAdapter.Unit | 'timezone',
    value: number | 'UTC' | undefined,
    options: { keepLocalTime?: boolean } = {},
  ): this {
    if (unit !== 'timezone') {
      return super.set(unit, value);
    }

    if (!['UTC', undefined].includes(value as 'UTC' | undefined)) {
      throw new IDateAdapter.InvalidDateError(
        `MomentDateAdapter does not support "${value}" timezone.`,
      );
    }

    value === 'UTC'
      ? this.date.utc(options.keepLocalTime)
      : this.date.local(options.keepLocalTime);

    this.assertIsValid();

    return this;
  }

  public valueOf() {
    return this.date.valueOf();
  }

  public assertIsValid() {
    if (!this.date.isValid()) {
      throw new IDateAdapter.InvalidDateError();
    }

    return true;
  }
}

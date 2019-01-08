import {
  DateAdapterBase,
  IDateAdapter,
  IDateAdapterJSON,
  ParsedDatetime,
  Utils,
} from '@rschedule/rschedule';

const STANDARD_DATE_ADAPTER_ID = Symbol.for(
  '09e206a9-a8b2-4c85-b2c6-6442bb895153',
);

export class StandardDateAdapter extends DateAdapterBase<Date> {
  public static date: Date;

  public static fromJSON(input: IDateAdapterJSON): StandardDateAdapter {
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
        // TS doesn't like my use of the spread operator
        // @ts-ignore
        return new StandardDateAdapter(new Date(Date.UTC(...args)), {
          timezone: 'UTC',
        });
      case undefined:
      case 'DATE':
        // TS doesn't like my use of the spread operator
        // @ts-ignore
        return new StandardDateAdapter(new Date(...args));
      default:
        throw new IDateAdapter.InvalidDateError(
          'The `StandardDateAdapter` only supports datetimes in ' +
            `UTC or LOCAL time. You attempted to parse an ICAL ` +
            `string with a "${input.zone}" timezone.`,
        );
    }
  }

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `StandardDateAdapter` by checking against the
   * global symbol registry.
   */
  public static isInstance(object: any): object is StandardDateAdapter {
    return !!(
      object &&
      object[STANDARD_DATE_ADAPTER_ID] &&
      super.isInstance(object)
    );
  }

  public static isDate(object: any): object is Date {
    return Object.prototype.toString.call(object) === '[object Date]';
  }

  public date: Date;

  // @ts-ignore used by static method
  private readonly [STANDARD_DATE_ADAPTER_ID] = true;

  private _timezone: 'UTC' | undefined;

  constructor(date?: Date, options: { timezone?: 'UTC' } = {}) {
    super();

    if (date) {
      this.date = new Date(date);
    } else {
      this.date = new Date();
    }

    this._timezone = options.timezone;
    this.assertIsValid([date, 'constructing']);
  }

  /**
   * Returns a clone of the date adapter including a cloned
   * date property. Does not clone the `rule`, `schedule`,
   * or `calendar` properties, but does copy them over to the
   * new object.
   */
  public clone(): StandardDateAdapter {
    const adapter = new StandardDateAdapter(this.date, {
      timezone: this.get('timezone'),
    });
    adapter.generators = this.generators.slice();
    return adapter;
  }

  public get(unit: IDateAdapter.Unit | 'yearday'): number;
  public get(unit: 'weekday'): IDateAdapter.Weekday;
  public get(unit: 'timezone'): 'UTC' | undefined;
  public get(unit: IDateAdapter.Unit | 'yearday' | 'weekday' | 'timezone') {
    if (this._timezone === undefined) {
      switch (unit) {
        case 'year':
          return this.date.getFullYear();
        case 'month':
          return this.date.getMonth() + 1;
        case 'yearday':
          return Utils.getYearDay(
            this.get('year'),
            this.get('month'),
            this.get('day'),
          );
        case 'weekday':
          return Utils.WEEKDAYS[this.date.getDay()];
        case 'day':
          return this.date.getDate();
        case 'hour':
          return this.date.getHours();
        case 'minute':
          return this.date.getMinutes();
        case 'second':
          return this.date.getSeconds();
        case 'millisecond':
          return this.date.getMilliseconds();
        case 'timezone':
          return this._timezone;
        default:
          throw new Error('Invalid unit provided to `StandardDateAdapter#get`');
      }
    }

    switch (unit) {
      case 'year':
        return this.date.getUTCFullYear();
      case 'month':
        return this.date.getUTCMonth() + 1;
      case 'yearday':
        return Utils.getYearDay(
          this.get('year'),
          this.get('month'),
          this.get('day'),
        );
      case 'weekday':
        return Utils.WEEKDAYS[this.date.getUTCDay()];
      case 'day':
        return this.date.getUTCDate();
      case 'hour':
        return this.date.getUTCHours();
      case 'minute':
        return this.date.getUTCMinutes();
      case 'second':
        return this.date.getUTCSeconds();
      case 'millisecond':
        return this.date.getUTCMilliseconds();
      case 'timezone':
        return this._timezone;
      default:
        throw new Error('Invalid unit provided to `StandardDateAdapter#set`');
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

    if (value === this._timezone) {
      return this;
    }

    if (!['UTC', undefined].includes(value as 'UTC' | undefined)) {
      throw new IDateAdapter.InvalidDateError(
        `StandardDateAdapter does not support "${value}" timezone.`,
      );
    }

    if (options.keepLocalTime) {
      if (this._timezone === undefined) {
        this.date = new Date(
          Date.UTC(
            this.get('year'),
            this.get('month') - 1,
            this.get('day'),
            this.get('hour'),
            this.get('minute'),
            this.get('second'),
            this.get('millisecond'),
          ),
        );
      } else {
        this.date = new Date(
          this.get('year'),
          this.get('month') - 1,
          this.get('day'),
          this.get('hour'),
          this.get('minute'),
          this.get('second'),
          this.get('millisecond'),
        );
      }
    }

    this._timezone = value as 'UTC' | undefined;

    return this;
  }

  public valueOf() {
    return this.date.valueOf();
  }

  public assertIsValid(context?: any) {
    if (isNaN(this.valueOf()) || !['UTC', undefined].includes(this._timezone)) {
      const was = context.shift();
      const change = context.map((val: any) => `"${val}"`).join(' ');

      throw new IDateAdapter.InvalidDateError(
        'IDateAdapter has invalid date. ' +
          `Was "${was}". ` +
          (change ? `Change ${change}.` : ''),
      );
    }

    return true;
  }
}

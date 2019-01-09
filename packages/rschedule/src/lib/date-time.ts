import { IDateAdapter } from './date-adapter';
// import { Rule } from './rule'
// import { Dates } from './dates'
// import { Schedule } from './schedule'
// import { Calendar } from './calendar'
import { Utils } from './utilities';

export const DATETIME_ID = Symbol.for('b1231462-3560-4770-94f0-d16295d5965c');

interface ComparisonObject {
  valueOf: () => number;
  get: (unit: 'timezone') => string | undefined;
}

export class DateTime implements IDateAdapter {
  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `DateTime` by checking against the
   * global symbol registry.
   */
  public static isInstance(object: any): object is DateTime {
    return !!(
      object && object[Symbol.for('b1231462-3560-4770-94f0-d16295d5965c')]
    );
  }
  public date: Date;

  /**
   * This property contains an ordered array of the generator objects
   * responsible for producing this DateAdapter.
   *
   * - If this DateAdapter was produced by a `RRule` object, this array
   *   will just contain the `RRule` object.
   * - If this DateAdapter was produced by a `Schedule` object, this
   *   array will contain the `Schedule` object as well as the `RRule`
   *   or `RDates` object which generated it.
   * - If this DateAdapter was produced by a `Calendar` object, this
   *   array will contain, at minimum, the `Calendar`, `Schedule`, and
   *   `RRule`/`RDates` objects which generated it.
   */
  public generators: any[] = [];

  public readonly [DATETIME_ID] = true;
  private timezone: string | undefined;

  constructor(adapter: IDateAdapter | DateTime) {
    if (DateTime.isInstance(adapter)) {
      this.date = new Date(adapter.valueOf());
      this.generators = adapter.generators.slice();
      this.timezone = adapter.timezone;
      return;
    }

    this.date = new Date(
      Date.UTC(
        adapter.get('year'),
        adapter.get('month') - 1,
        adapter.get('day'),
        adapter.get('hour'),
        adapter.get('minute'),
        adapter.get('second'),
        adapter.get('millisecond'),
      ),
    );

    this.timezone = adapter.get('timezone');
  }

  /**
   * Returns a clone of the date adapter including a cloned
   * date property. Does not clone the `rule`, `schedule`,
   * or `calendar` properties, but does copy them over to the
   * new object.
   */
  public clone(): DateTime {
    return new DateTime(this);
  }

  // While we constrain the argument to be another DateAdapter in typescript
  // we handle the case of someone passing in another type of object in javascript
  public isEqual(object?: ComparisonObject): boolean {
    if (!object) {
      return false;
    }

    if (object.get('timezone') !== this.get('timezone')) {
      throw new DateTime.ComparisonError();
    }

    return object.valueOf() === this.valueOf();
  }
  public isBefore(object: ComparisonObject): boolean {
    if (object.get('timezone') !== this.get('timezone')) {
      throw new DateTime.ComparisonError();
    }

    return this.valueOf() < object.valueOf();
  }
  public isBeforeOrEqual(object: ComparisonObject): boolean {
    if (object.get('timezone') !== this.get('timezone')) {
      throw new DateTime.ComparisonError();
    }

    return this.valueOf() <= object.valueOf();
  }
  public isAfter(object: ComparisonObject): boolean {
    if (object.get('timezone') !== this.get('timezone')) {
      throw new DateTime.ComparisonError();
    }

    return this.valueOf() > object.valueOf();
  }
  public isAfterOrEqual(object: ComparisonObject): boolean {
    if (object.get('timezone') !== this.get('timezone')) {
      throw new DateTime.ComparisonError();
    }

    return this.valueOf() >= object.valueOf();
  }

  public add(amount: number, unit: DateTime.Unit | 'week'): this {
    const context = [this.date.toISOString(), 'add', amount, unit];

    switch (unit) {
      case 'year':
        this.date = addUTCYears(this.date, amount);
        break;
      case 'month':
        this.date = addUTCMonths(this.date, amount);
        break;
      case 'week':
        this.date = addUTCWeeks(this.date, amount);
        break;
      case 'day':
        this.date = addUTCDays(this.date, amount);
        break;
      case 'hour':
        this.date = addUTCHours(this.date, amount);
        break;
      case 'minute':
        this.date = addUTCMinutes(this.date, amount);
        break;
      case 'second':
        this.date = addUTCSeconds(this.date, amount);
        break;
      case 'millisecond':
        this.date = addUTCMilliseconds(this.date, amount);
        break;
      default:
        throw new Error('Invalid unit provided to `DateTime#add`');
    }

    this.assertIsValid(context);

    return this;
  }

  public subtract(amount: number, unit: DateTime.Unit | 'week'): this {
    const context = [this.date.toISOString(), 'subtract', amount, unit];

    switch (unit) {
      case 'year':
        this.date = subUTCYears(this.date, amount);
        break;
      case 'month':
        this.date = subUTCMonths(this.date, amount);
        break;
      case 'week':
        this.date = subUTCWeeks(this.date, amount);
        break;
      case 'day':
        this.date = subUTCDays(this.date, amount);
        break;
      case 'hour':
        this.date = subUTCHours(this.date, amount);
        break;
      case 'minute':
        this.date = subUTCMinutes(this.date, amount);
        break;
      case 'second':
        this.date = subUTCSeconds(this.date, amount);
        break;
      case 'millisecond':
        this.date = subUTCMilliseconds(this.date, amount);
        break;
      default:
        throw new Error('Invalid unit provided to `DateTime#subtract`');
    }

    this.assertIsValid(context);

    return this;
  }

  public get(unit: 'weekday'): DateTime.Weekday;
  public get(unit: 'timezone'): string | undefined;
  public get(unit: DateTime.Unit | 'yearday'): number;
  public get(unit: DateTime.Unit | 'yearday' | 'weekday' | 'timezone'): any {
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
        return this.timezone;
      default:
        throw new Error('Invalid unit provided to `DateTime#set`');
    }
  }

  public set(
    unit: 'timezone',
    value: string | undefined,
    options?: { keepLocalTime?: boolean },
  ): this;
  public set(unit: DateTime.Unit, value: number): this;
  public set(
    unit: DateTime.Unit | 'timezone',
    value: number | string | undefined,
  ): this {
    const context = [this.date.toISOString(), 'set', value, unit];

    switch (unit) {
      case 'year':
        this.date.setUTCFullYear(value as number);
        break;
      case 'month':
        this.date.setUTCMonth((value as number) - 1);
        break;
      case 'day':
        this.date.setUTCDate(value as number);
        break;
      case 'hour':
        this.date.setUTCHours(value as number);
        break;
      case 'minute':
        this.date.setUTCMinutes(value as number);
        break;
      case 'second':
        this.date.setUTCSeconds(value as number);
        break;
      case 'millisecond':
        this.date.setUTCMilliseconds(value as number);
        break;
      default:
        throw new Error('Invalid unit provided to `DateTime#set`');
    }

    this.assertIsValid(context);

    return this;
  }

  public toISOString() {
    return this.date.toISOString();
  }

  public toJSON() {
    return {
      zone: this.get('timezone'),
      year: this.get('year'),
      month: this.get('month'),
      day: this.get('day'),
      hour: this.get('hour'),
      minute: this.get('minute'),
      second: this.get('second'),
      millisecond: this.get('millisecond'),
    };
  }

  public toDateTime() {
    return this;
  }

  public valueOf() {
    return this.date.valueOf();
  }

  public assertIsValid(context?: any) {
    if (isNaN(this.valueOf())) {
      const was = context.shift();
      const change = context.map((val: any) => `"${val}"`).join(' ');

      throw new Error(
        'DateTime has invalid date. ' +
          `Was "${was}". ` +
          (change ? `Change ${change}.` : ''),
      );
    }

    return true;
  }
}

export namespace DateTime {
  export class ComparisonError extends Error {
    constructor(message = "Cannot compare DateTime's in different timezones") {
      super(message);
    }
  }

  export type Unit = IDateAdapter.Unit;

  export type Weekday = IDateAdapter.Weekday;

  export type Month = IDateAdapter.Month;

  export type IMonth = IDateAdapter.IMonth;
}

/**
 * These functions are basically lifted from `date-fns`, but changed
 * to use the UTC date methods, which `date-fns` doesn't support.
 */

export function toInteger(input: any) {
  if (input === null || input === true || input === false) {
    return NaN;
  }

  const int = Number(input);

  if (isNaN(int)) {
    return int;
  }

  return int < 0 ? Math.ceil(int) : Math.floor(int);
}

export function addMilliseconds(dirtyDate: Date, dirtyAmount: number) {
  if (arguments.length < 2) {
    throw new TypeError(
      '2 arguments required, but only ' + arguments.length + ' present',
    );
  }

  const timestamp = dirtyDate.getTime();
  const amount = toInteger(dirtyAmount);
  return new Date(timestamp + amount);
}

export function addUTCYears(date: Date, input: number) {
  const amount = toInteger(input);
  return addUTCMonths(date, amount * 12);
}

export function addUTCMonths(date: Date, input: number) {
  const amount = toInteger(input);
  date = new Date(date);
  const desiredMonth = date.getUTCMonth() + amount;
  const dateWithDesiredMonth = new Date(0);
  dateWithDesiredMonth.setUTCFullYear(date.getUTCFullYear(), desiredMonth, 1);
  dateWithDesiredMonth.setUTCHours(0, 0, 0, 0);
  const daysInMonth = Utils.getDaysInMonth(
    dateWithDesiredMonth.getUTCMonth() + 1,
    dateWithDesiredMonth.getUTCFullYear(),
  );
  // Set the last day of the new month
  // if the original date was the last day of the longer month
  date.setUTCMonth(desiredMonth, Math.min(daysInMonth, date.getUTCDate()));
  return date;
}

export function addUTCWeeks(date: Date, input: number) {
  const amount = toInteger(input);
  const days = amount * 7;
  return addUTCDays(date, days);
}

export function addUTCDays(date: Date, input: number) {
  // by adding milliseconds rather than days, we supress the native Date object's automatic
  // daylight savings time conversions which we don't want in UTC mode
  return addUTCMilliseconds(date, toInteger(input) * Utils.MILLISECONDS_IN_DAY);
}

export function addUTCHours(date: Date, input: number) {
  const amount = toInteger(input);
  return addMilliseconds(date, amount * Utils.MILLISECONDS_IN_HOUR);
}

export function addUTCMinutes(date: Date, input: number) {
  const amount = toInteger(input);
  return addMilliseconds(date, amount * Utils.MILLISECONDS_IN_MINUTE);
}

export function addUTCSeconds(date: Date, input: number) {
  const amount = toInteger(input);
  return addMilliseconds(date, amount * Utils.MILLISECONDS_IN_SECOND);
}

export function addUTCMilliseconds(date: Date, input: number) {
  const amount = toInteger(input);
  const timestamp = date.getTime();
  return new Date(timestamp + amount);
}

export function subUTCYears(date: Date, amount: number) {
  return addUTCYears(date, -amount);
}

export function subUTCMonths(date: Date, amount: number) {
  return addUTCMonths(date, -amount);
}

export function subUTCWeeks(date: Date, amount: number) {
  return addUTCWeeks(date, -amount);
}

export function subUTCDays(date: Date, amount: number) {
  return addUTCDays(date, -amount);
}

export function subUTCHours(date: Date, amount: number) {
  return addUTCHours(date, -amount);
}

export function subUTCMinutes(date: Date, amount: number) {
  return addUTCMinutes(date, -amount);
}

export function subUTCSeconds(date: Date, amount: number) {
  return addUTCSeconds(date, -amount);
}

export function subUTCMilliseconds(date: Date, amount: number) {
  return addUTCMilliseconds(date, -amount);
}

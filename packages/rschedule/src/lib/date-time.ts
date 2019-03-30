import { ArgumentError } from './utilities';

export const WEEKDAYS: Array<'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'> = [
  'SU',
  'MO',
  'TU',
  'WE',
  'TH',
  'FR',
  'SA',
];

export const MILLISECONDS_IN_SECOND = 1000;
export const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
export const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;
export const MILLISECONDS_IN_DAY = MILLISECONDS_IN_HOUR * 24;
export const MILLISECONDS_IN_WEEK = MILLISECONDS_IN_DAY * 7;

export interface IDateAdapter<D = unknown> {
  /** Returns the date object this DateAdapter is wrapping */
  readonly date: unknown;
  readonly timezone: string | undefined;
  readonly duration: number | undefined;

  /**
   * This property contains an ordered array of the generator objects
   * responsible for producing this IDateAdapter.
   *
   * - If this IDateAdapter was produced by a `RRule` object, this array
   *   will just contain the `RRule` object.
   * - If this IDateAdapter was produced by a `Schedule` object, this
   *   array will contain the `Schedule` object as well as the `RRule`
   *   or `RDates` object which generated it.
   * - If this IDateAdapter was produced by a `Calendar` object, this
   *   array will contain, at minimum, the `Calendar`, `Schedule`, and
   *   `RRule`/`RDates` objects which generated it.
   */
  readonly generators: unknown[];

  valueOf(): number;

  toISOString(): string;

  isEqual(object?: IDateAdapter | DateTime): boolean;

  isBefore(object: IDateAdapter | DateTime): boolean;

  isBeforeOrEqual(object: IDateAdapter | DateTime): boolean;

  isAfter(object: IDateAdapter | DateTime): boolean;

  isAfterOrEqual(object: IDateAdapter | DateTime): boolean;

  toDateTime(): DateTime;

  toJSON(): IDateAdapter.JSON;

  assertIsValid(): boolean;
}

export namespace IDateAdapter {
  export type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

  export type TimeUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

  export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  export interface JSON {
    timezone: string | undefined;
    duration?: number;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
  }
}

export class InvalidDateTimeError extends Error {}

const DATETIME_ID = Symbol.for('b1231462-3560-4770-94f0-d16295d5965c');

export class DateTime implements IDateAdapter<unknown> {
  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `DateTime` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is DateTime {
    return !!(object && object[DATETIME_ID]);
  }

  static fromJSON(json: IDateAdapter.JSON) {
    const date = new Date(
      Date.UTC(
        json.year,
        json.month - 1,
        json.day,
        json.hour,
        json.minute,
        json.second,
        json.millisecond,
      ),
    );

    return new DateTime(date, json.timezone, json.duration);
  }

  readonly date: Date;

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
  readonly generators: unknown[] = [];

  readonly [DATETIME_ID] = true;

  readonly timezone: string | undefined;

  readonly duration: number | undefined;

  private constructor(date: Date, timezone?: string, duration?: number) {
    this.date = new Date(date);
    this.timezone = timezone;
    this.duration = duration;

    this.assertIsValid();
  }

  // While we constrain the argument to be another DateAdapter in typescript
  // we handle the case of someone passing in another type of object in javascript
  isEqual(object?: DateTime | IDateAdapter): boolean {
    if (!object) {
      return false;
    }

    assertSameTimeZone(this, object);

    return this.valueOf() === object.valueOf();
  }

  isBefore(object: DateTime | IDateAdapter): boolean {
    assertSameTimeZone(this, object);

    return this.valueOf() < object.valueOf();
  }

  isBeforeOrEqual(object: DateTime | IDateAdapter): boolean {
    assertSameTimeZone(this, object);

    return this.valueOf() <= object.valueOf();
  }

  isAfter(object: DateTime | IDateAdapter): boolean {
    assertSameTimeZone(this, object);

    return this.valueOf() > object.valueOf();
  }

  isAfterOrEqual(object: DateTime | IDateAdapter): boolean {
    assertSameTimeZone(this, object);

    return this.valueOf() >= object.valueOf();
  }

  isOccurring(object: DateTime | IDateAdapter) {
    if (!this.duration) {
      throw new Error('DateTime#isOccurring() is only applicable to DateTimes with durations');
    }

    assertSameTimeZone(this, object);

    return (
      object.isAfterOrEqual(this) && object.isBeforeOrEqual(this.add(this.duration!, 'millisecond'))
    );
  }

  add(amount: number, unit: IDateAdapter.TimeUnit | 'week'): DateTime {
    switch (unit) {
      case 'year':
        return this.forkDateTime(addUTCYears(this.date, amount));
      case 'month':
        return this.forkDateTime(addUTCMonths(this.date, amount));
      case 'week':
        return this.forkDateTime(addUTCWeeks(this.date, amount));
      case 'day':
        return this.forkDateTime(addUTCDays(this.date, amount));
      case 'hour':
        return this.forkDateTime(addUTCHours(this.date, amount));
      case 'minute':
        return this.forkDateTime(addUTCMinutes(this.date, amount));
      case 'second':
        return this.forkDateTime(addUTCSeconds(this.date, amount));
      case 'millisecond':
        return this.forkDateTime(addUTCMilliseconds(this.date, amount));
      default:
        throw new ArgumentError('Invalid unit provided to `DateTime#add`');
    }
  }

  subtract(amount: number, unit: IDateAdapter.TimeUnit | 'week'): DateTime {
    switch (unit) {
      case 'year':
        return this.forkDateTime(subUTCYears(this.date, amount));
      case 'month':
        return this.forkDateTime(subUTCMonths(this.date, amount));
      case 'week':
        return this.forkDateTime(subUTCWeeks(this.date, amount));
      case 'day':
        return this.forkDateTime(subUTCDays(this.date, amount));
      case 'hour':
        return this.forkDateTime(subUTCHours(this.date, amount));
      case 'minute':
        return this.forkDateTime(subUTCMinutes(this.date, amount));
      case 'second':
        return this.forkDateTime(subUTCSeconds(this.date, amount));
      case 'millisecond':
        return this.forkDateTime(subUTCMilliseconds(this.date, amount));
      default:
        throw new ArgumentError('Invalid unit provided to `DateTime#subtract`');
    }
  }

  get(unit: 'weekday'): IDateAdapter.Weekday;
  get(unit: IDateAdapter.TimeUnit | 'yearday'): number;
  get(unit: IDateAdapter.TimeUnit | 'yearday' | 'weekday'): any {
    switch (unit) {
      case 'year':
        return this.date.getUTCFullYear();
      case 'month':
        return this.date.getUTCMonth() + 1;
      case 'yearday':
        return getUTCYearDay(this.date);
      case 'weekday':
        return WEEKDAYS[this.date.getUTCDay()];
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
      default:
        throw new ArgumentError('Invalid unit provided to `DateTime#set`');
    }
  }

  set(unit: IDateAdapter.TimeUnit | 'duration', value: number): DateTime {
    if (unit === 'duration') {
      return new DateTime(this.date, this.timezone, value);
    }

    const date = new Date(this.date);

    switch (unit) {
      case 'year':
        date.setUTCFullYear(value as number);
        break;
      case 'month':
        date.setUTCMonth((value as number) - 1);
        break;
      case 'day':
        date.setUTCDate(value as number);
        break;
      case 'hour':
        date.setUTCHours(value as number);
        break;
      case 'minute':
        date.setUTCMinutes(value as number);
        break;
      case 'second':
        date.setUTCSeconds(value as number);
        break;
      case 'millisecond':
        date.setUTCMilliseconds(value as number);
        break;
      default:
        throw new ArgumentError('Invalid unit provided to `DateTime#set`');
    }

    return this.forkDateTime(date);
  }

  granularity(
    granularity: IDateAdapter.TimeUnit | 'week',
    opt: { weekStart?: IDateAdapter.Weekday } = {},
  ) {
    let date = this.forkDateTime(this.date);

    switch (granularity) {
      case 'year':
        date = date.set('month', 1);
      case 'month':
        date = date.set('day', 1);
        break;
      case 'week':
        date = setDateToStartOfWeek(date, opt.weekStart!);
    }

    switch (granularity) {
      case 'year':
      case 'month':
      case 'week':
      case 'day':
        date = date.set('hour', 0);
      case 'hour':
        date = date.set('minute', 0);
      case 'minute':
        date = date.set('second', 0);
      case 'second':
        date = date.set('millisecond', 0);
      case 'millisecond':
        return date;
      default:
        throw new ArgumentError(
          'Invalid granularity provided to `DateTime#granularity`: ' + granularity,
        );
    }
  }

  endGranularity(
    granularity: IDateAdapter.TimeUnit | 'week',
    opt: { weekStart?: IDateAdapter.Weekday } = {},
  ) {
    let date = this.forkDateTime(this.date);

    switch (granularity) {
      case 'year':
        date = date.set('month', 12);
      case 'month':
        date = date.set('day', monthLength(date.get('month'), date.get('year')));
        break;
      case 'week':
        date = setDateToEndOfWeek(date, opt.weekStart!);
    }

    switch (granularity) {
      case 'year':
      case 'month':
      case 'week':
      case 'day':
        date = date.set('hour', 23);
      case 'hour':
        date = date.set('minute', 59);
      case 'minute':
        date = date.set('second', 59);
      case 'second':
        date = date.set('millisecond', 999);
      case 'millisecond':
        return date;
      default:
        throw new ArgumentError(
          'Invalid granularity provided to `DateTime#granularity`: ' + granularity,
        );
    }
  }

  toISOString() {
    return this.date.toISOString();
  }

  toDateTime() {
    return this;
  }

  toJSON(): IDateAdapter.JSON {
    return {
      timezone: this.timezone,
      duration: this.duration,
      year: this.get('year'),
      month: this.get('month'),
      day: this.get('day'),
      hour: this.get('hour'),
      minute: this.get('minute'),
      second: this.get('second'),
      millisecond: this.get('millisecond'),
    };
  }

  valueOf() {
    return this.date.valueOf();
  }

  assertIsValid() {
    if (isNaN(this.valueOf())) {
      throw new InvalidDateTimeError('DateTime has invalid date.');
    }

    return true;
  }

  private forkDateTime(date: Date) {
    return new DateTime(date, this.timezone, this.duration);
  }
}

function assertSameTimeZone(x: DateTime | IDateAdapter, y: DateTime | IDateAdapter) {
  if (x.timezone !== y.timezone) {
    throw new InvalidDateTimeError(
      'Attempted to compare a datetime to another date in a different timezone: ' +
        JSON.stringify(x) +
        ' and ' +
        JSON.stringify(y),
    );
  }

  return true;
}

function setDateToStartOfWeek(date: DateTime, wkst: IDateAdapter.Weekday) {
  const index = orderedWeekdays(wkst).indexOf(date.get('weekday'));
  return date.subtract(index, 'day');
}

function setDateToEndOfWeek(date: DateTime, wkst: IDateAdapter.Weekday) {
  const index = orderedWeekdays(wkst).indexOf(date.get('weekday'));
  return date.add(6 - index, 'day');
}

export function dateTimeSortComparer(a: DateTime, b: DateTime) {
  if (a.isAfter(b)) return 1;
  if (a.isBefore(b)) return -1;
  return 0;
}

export function uniqDateTimes(dates: DateTime[]) {
  return Array.from(
    new Map(dates.map(date => [date.toISOString(), date]) as Array<[string, DateTime]>).values(),
  );
}

export function orderedWeekdays(wkst: IDateAdapter.Weekday = 'SU') {
  const wkdays = WEEKDAYS.slice();
  let index = wkdays.indexOf(wkst);

  while (index !== 0) {
    shiftArray(wkdays);
    index--;
  }

  return wkdays;
}

function shiftArray(array: any[], from: 'first' | 'last' = 'first') {
  if (array.length === 0) {
    return array;
  } else if (from === 'first') {
    array.push(array.shift());
  } else {
    array.unshift(array.pop());
  }

  return array;
}

/**
 * Returns the days in the given month.
 *
 * @param month base-1
 * @param year
 */
export function monthLength(month: number, year: number) {
  const block = {
    1: 31,
    2: getDaysInFebruary(year),
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31,
  };

  return (block as { [key: number]: number })[month];
}

function getDaysInFebruary(year: number) {
  return isLeapYear(year) ? 29 : 28;
}

// taken from date-fn
export function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function getDaysInYear(year: number) {
  return isLeapYear(year) ? 366 : 365;
}

function getUTCYearDay(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const diff = now.valueOf() - start.valueOf();

  return 1 + Math.floor(diff / MILLISECONDS_IN_DAY);
}

/**
 * These functions are basically lifted from `date-fns`, but changed
 * to use the UTC date methods, which `date-fns` doesn't support.
 */

function toInteger(input: any) {
  if (input === null || input === true || input === false) {
    return NaN;
  }

  const int = Number(input);

  if (isNaN(int)) {
    return int;
  }

  return int < 0 ? Math.ceil(int) : Math.floor(int);
}

function addMilliseconds(dirtyDate: Date, dirtyAmount: number) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  const timestamp = dirtyDate.valueOf();
  const amount = toInteger(dirtyAmount);
  return new Date(timestamp + amount);
}

function addUTCYears(date: Date, input: number) {
  const amount = toInteger(input);
  return addUTCMonths(date, amount * 12);
}

function addUTCMonths(date: Date, input: number) {
  const amount = toInteger(input);
  date = new Date(date);
  const desiredMonth = date.getUTCMonth() + amount;
  const dateWithDesiredMonth = new Date(0);
  dateWithDesiredMonth.setUTCFullYear(date.getUTCFullYear(), desiredMonth, 1);
  dateWithDesiredMonth.setUTCHours(0, 0, 0, 0);
  const daysInMonth = monthLength(
    dateWithDesiredMonth.getUTCMonth() + 1,
    dateWithDesiredMonth.getUTCFullYear(),
  );
  // Set the last day of the new month
  // if the original date was the last day of the longer month
  date.setUTCMonth(desiredMonth, Math.min(daysInMonth, date.getUTCDate()));
  return date;
}

function addUTCWeeks(date: Date, input: number) {
  const amount = toInteger(input);
  const days = amount * 7;
  return addUTCDays(date, days);
}

function addUTCDays(date: Date, input: number) {
  // by adding milliseconds rather than days, we supress the native Date object's automatic
  // daylight savings time conversions which we don't want in UTC mode
  return addUTCMilliseconds(date, toInteger(input) * MILLISECONDS_IN_DAY);
}

function addUTCHours(date: Date, input: number) {
  const amount = toInteger(input);
  return addMilliseconds(date, amount * MILLISECONDS_IN_HOUR);
}

function addUTCMinutes(date: Date, input: number) {
  const amount = toInteger(input);
  return addMilliseconds(date, amount * MILLISECONDS_IN_MINUTE);
}

function addUTCSeconds(date: Date, input: number) {
  const amount = toInteger(input);
  return addMilliseconds(date, amount * MILLISECONDS_IN_SECOND);
}

function addUTCMilliseconds(date: Date, input: number) {
  const amount = toInteger(input);
  const timestamp = date.getTime();
  return new Date(timestamp + amount);
}

function subUTCYears(date: Date, amount: number) {
  return addUTCYears(date, -amount);
}

function subUTCMonths(date: Date, amount: number) {
  return addUTCMonths(date, -amount);
}

function subUTCWeeks(date: Date, amount: number) {
  return addUTCWeeks(date, -amount);
}

function subUTCDays(date: Date, amount: number) {
  return addUTCDays(date, -amount);
}

function subUTCHours(date: Date, amount: number) {
  return addUTCHours(date, -amount);
}

function subUTCMinutes(date: Date, amount: number) {
  return addUTCMinutes(date, -amount);
}

function subUTCSeconds(date: Date, amount: number) {
  return addUTCSeconds(date, -amount);
}

function subUTCMilliseconds(date: Date, amount: number) {
  return addUTCMilliseconds(date, -amount);
}

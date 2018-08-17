import { ParsedDatetime } from "../ical/parser";

export interface DateAdapter<T, D=any> {
  /** The `Rule` which generated this `DateAdapter` */
  rule: any | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  schedule: any | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  calendar: any | undefined
  /** Returns a duplicate of original DateAdapter */
  clone(): T

  /** Returns the date object this DateAdapter is wrapping */
  date: D

  /**
   * Returns the date's timezone
   * 
   * - if "UTC" then `"UTC"`
   * - if local then `undefined`
   */
  timezone: string | undefined

  // in minutes
  utcOffset: number

  /** mutates original object */
  add(amount: number, unit: DateAdapter.Unit): T

  /** mutates original object */
  subtract(amount: number, unit: DateAdapter.Unit): T

  get(unit: 'year'): number
  get(unit: 'month'): number
  get(unit: 'yearday'): number
  get(unit: 'weekday'): DateAdapter.Weekday
  get(unit: 'day'): number
  get(unit: 'hour'): number
  get(unit: 'minute'): number
  get(unit: 'second'): number
  get(unit: 'millisecond'): number

  /** mutates original object */
  set(unit: DateAdapter.Unit, value: number): T

  /** same format as new Date().toISOString() */
  toISOString(): string

  // date formatted for ical string
  // if `format` option is present
  // - if `"UTC"`: format as utc time
  // - if `"local"`: format as local time
  // - else the value will contain a timezone. Convert the time to that timezone
  //   and format time in that timezone (don't mutate the DateAdapter though).
  toICal(options?: {format?: 'UTC' | 'local' | string}): string

  // returns the underlying date ordinal. The value in milliseconds.
  valueOf(): number

  isSameClass(object: any): object is T

  // Compares to `DateAdapter` objects using `valueOf()`
  // to see if they are occuring at the same time.
  isEqual<O extends DateAdapter<O>>(object?: O): boolean  
  isBefore<O extends DateAdapter<O>>(date: O): boolean
  isBeforeOrEqual<O extends DateAdapter<O>>(date: O): boolean
  isAfter<O extends DateAdapter<O>>(date: O): boolean
  isAfterOrEqual<O extends DateAdapter<O>>(date: O): boolean

  /**
   * If the DateAdapter object is valid, returns `true`.
   * Otherwise, throws `DateAdapter.InvalidDateError`
   */
  assertIsValid(): boolean
}

export interface Constructor {
  new (...args: any[]): any
}

export type DateAdapterConstructor<T extends Constructor> = new (
  ...args: any[]
) => DateAdapter<InstanceType<T>>

export interface IDateAdapterConstructor<T extends Constructor> {
  new (date?: any, options?: any): InstanceType<T>
  isInstance(object: any): object is InstanceType<T>
  fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone?: string
    raw: string
  }): Array<InstanceType<T>>
  hasTimezoneSupport: boolean
}

export namespace DateAdapter {
  export class InvalidDateError extends Error {
    constructor(public message = 'DateAdapter has invalid date') {
      super(message)
    }
  }

  export type Unit =
    | 'year'
    | 'month'
    | 'week'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second'
    | 'millisecond';

  export type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'

  export enum Month {
    JAN = 1,
    FEB,
    MAR,
    APR,
    MAY,
    JUN,
    JUL,
    AUG,
    SEP,
    OCT,
    NOV,
    DEC,
  }

  export type IMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
}

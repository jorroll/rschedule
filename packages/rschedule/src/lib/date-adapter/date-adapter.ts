import { ParsedDatetime } from "../ical/parser";

export interface DateAdapter<T> {

  /** The `Rule` which generated this `DateAdapter` */
  rule: any | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  schedule: any | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  calendar: any | undefined
  /** Returns a duplicate of original DateAdapter */
  clone(): T

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
  get(unit: 'ordinal'): number // in milliseconds (equivalent to new Date().valueOf())
  get(unit: 'tzoffset'): number // in seconds
  // if "UTC" then `"UTC"`
  // if local then `undefined`
  // else if a specific timezone, formatted per the ICal spec (e.g. `"America/New_York"`)
  get(unit: 'timezone'): string | undefined

  /** mutates original object */
  set(unit: DateAdapter.Unit, value: number): T
  set(unit: 'timezone', value: string | undefined): T

  /** same format as new Date().toISOString() */
  toISOString(): string

  // date formatted for ical string
  // if `utc` is true, must be formatted as UTC string
  toICal(utc?: boolean): string

  isSameClass(object: any): object is T

  // Compares to `DateAdapter` objects using `toISOString()`
  // to see if they are occuring at the same time.
  isEqual<T extends DateAdapter<T>>(object?: T): boolean

  isBefore(date: T): boolean
  isBeforeOrEqual(date: T): boolean
  isAfter(date: T): boolean
  isAfterOrEqual(date: T): boolean

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
  new (n: any): InstanceType<T>
  isInstance(object: any): object is InstanceType<T>
  fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone?: string
    raw: string
  }): Array<InstanceType<T>>
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
    | 'millisecond'
    | 'ordinal'

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

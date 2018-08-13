import { DateAdapter, Schedule, Rule, Calendar, ParsedDatetime, Utils } from '@rschedule/rschedule';

import {
  addDays,
  addWeeks,
  addMonths,
  addSeconds,
  addMinutes,
  addHours,
  addYears,
  subYears,
  subMonths,
  subWeeks,
  subDays,
  subHours,
  subMinutes,
  subSeconds,
  addMilliseconds,
  subMilliseconds,
} from 'date-fns'

export class StandardDateAdapter
  implements DateAdapter<StandardDateAdapter, Date> {
  public date: Date
  
  private _timezone: 'UTC' | undefined
  public get timezone() { return this._timezone }
  public set timezone(value) {
    switch (value) {
      case 'UTC':
      case undefined:
        this._timezone = value
        break
      default:
        throw new DateAdapter.InvalidDateError(
          `StandardDateAdapter does not support "${value}" timezone.`
        )
    }
  }

  public get utcOffset() {
    return this.timezone === 'UTC' ? 0 : this.date.getTimezoneOffset()
  }

  /** The `Rule` which generated this `DateAdapter` */
  public rule: Rule<StandardDateAdapter> | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  public schedule: Schedule<StandardDateAdapter> | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  public calendar: Calendar<StandardDateAdapter> | undefined

  constructor(date?: Date, args: {timezone?: 'UTC' | undefined} = {}) {
    this.date = date ? new Date(date) : new Date()
    this.timezone = args.timezone
    this.assertIsValid()
  }

  static isInstance(object: any): object is StandardDateAdapter {
    return object instanceof StandardDateAdapter
  }

  static fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone: string | undefined
    raw: string
  }): StandardDateAdapter[] {
    const dates = args.datetimes.map(datetime => {
      // adjust for `Date`'s base-0 months
      datetime[1] = datetime[1] - 1

      switch (args.timezone) {
        case 'UTC':
          // TS doesn't like my use of the spread operator
          // @ts-ignore
          return new StandardDateAdapter(new Date(Date.UTC(...datetime)), {timezone: 'UTC'})
        case undefined:
        case 'DATE':
          // TS doesn't like my use of the spread operator
          // @ts-ignore
          return new StandardDateAdapter(new Date(...datetime))
        default:
          throw new DateAdapter.InvalidDateError(
            'The `StandardDateAdapter` only supports datetimes in UTC or LOCAL time. ' +
              `You attempted to parse an ICAL string with a "${args.timezone}" timezone.`
          )
      }
    })

    return dates
  }

  clone(): StandardDateAdapter {
    return new StandardDateAdapter(this.date)
  }

  isSameClass(object: any): object is StandardDateAdapter {
    return StandardDateAdapter.isInstance(object)
  }

  // While we constrain the argument to be another DateAdapter in typescript
  // we handle the case of someone passing in another type of object in javascript
  isEqual<T extends DateAdapter<T>>(object?: T): boolean {
    return !!object && typeof object.valueOf === 'function' && object.valueOf() === this.valueOf()
  }
  isBefore<T extends DateAdapter<T>>(object: T): boolean {
    return this.valueOf() < object.valueOf()
  }
  isBeforeOrEqual<T extends DateAdapter<T>>(object: T): boolean {
    return this.valueOf() <= object.valueOf()
  }
  isAfter<T extends DateAdapter<T>>(object: T): boolean {
    return this.valueOf() > object.valueOf()
  }
  isAfterOrEqual<T extends DateAdapter<T>>(object: T): boolean {
    return this.valueOf() >= object.valueOf()
  }

  add(amount: number, unit: DateAdapter.Unit): StandardDateAdapter {
    switch (unit) {
      case 'year':
        this.date = addYears(this.date, amount)
        break
      case 'month':
        this.date = addMonths(this.date, amount)
        break
      case 'week':
        this.date = addWeeks(this.date, amount)
        break
      case 'day':
        this.date = addDays(this.date, amount)
        break
      case 'hour':
        this.date = addHours(this.date, amount)
        break
      case 'minute':
        this.date = addMinutes(this.date, amount)
        break
      case 'second':
        this.date = addSeconds(this.date, amount)
        break
      case 'millisecond':
        this.date = addMilliseconds(this.date, amount)
        break
      default:
        throw new Error('Invalid unit provided to `StandardDateAdapter#add`')
    }

    this.assertIsValid()

    return this
  }

  subtract(amount: number, unit: DateAdapter.Unit): StandardDateAdapter {
    switch (unit) {
      case 'year':
        this.date = subYears(this.date, amount)
        break
      case 'month':
        this.date = subMonths(this.date, amount)
        break
      case 'week':
        this.date = subWeeks(this.date, amount)
        break
      case 'day':
        this.date = subDays(this.date, amount)
        break
      case 'hour':
        this.date = subHours(this.date, amount)
        break
      case 'minute':
        this.date = subMinutes(this.date, amount)
        break
      case 'second':
        this.date = subSeconds(this.date, amount)
        break
      case 'millisecond':
        this.date = subMilliseconds(this.date, amount)
        break
      default:
        throw new Error('Invalid unit provided to `StandardDateAdapter#subtract`')
    }

    this.assertIsValid()

    return this
  }

  get(unit: 'year'): number
  get(unit: 'month'): number
  get(unit: 'yearday'): number
  get(unit: 'weekday'): DateAdapter.Weekday
  get(unit: 'day'): number
  get(unit: 'hour'): number
  get(unit: 'minute'): number
  get(unit: 'second'): number
  get(unit: 'millisecond'): number
  get(
    unit:
      | 'year'
      | 'month'
      | 'yearday'
      | 'weekday'
      | 'day'
      | 'hour'
      | 'minute'
      | 'second'
      | 'millisecond'
  ) {
    if (this.timezone === undefined) {
      switch (unit) {
        case 'year':
          return this.date.getFullYear()
        case 'month':
          return this.date.getMonth() + 1
        case 'yearday':
          return Utils.getYearDay(this.get('year'), this.get('month'), this.get('day'))
        case 'weekday':
          return Utils.WEEKDAYS[this.date.getDay()]
        case 'day':
          return this.date.getDate()
        case 'hour':
          return this.date.getHours()
        case 'minute':
          return this.date.getMinutes()
        case 'second':
          return this.date.getSeconds()
        case 'millisecond':
          return this.date.getMilliseconds()
        default:
          throw new Error('Invalid unit provided to `StandardDateAdapter#set`')
      }
    } else {
      switch (unit) {
        case 'year':
          return this.date.getUTCFullYear()
        case 'month':
          return this.date.getUTCMonth() + 1
        case 'yearday':
          return Utils.getYearDay(this.get('year'), this.get('month'), this.get('day'))
        case 'weekday':
          return Utils.WEEKDAYS[this.date.getUTCDay()]
        case 'day':
          return this.date.getUTCDate()
        case 'hour':
          return this.date.getUTCHours()
        case 'minute':
          return this.date.getUTCMinutes()
        case 'second':
          return this.date.getUTCSeconds()
        case 'millisecond':
          return this.date.getUTCMilliseconds()
        default:
          throw new Error('Invalid unit provided to `StandardDateAdapter#set`')
      }
    }
  }

  set(unit: DateAdapter.Unit, value: number): StandardDateAdapter {
    if (this.timezone === undefined) {
      switch (unit) {
        case 'year':
          this.date.setFullYear(value as number)
          break
        case 'month':
          this.date.setMonth((value as number) - 1)
          break
        case 'day':
          this.date.setDate(value as number)
          break
        case 'hour':
          this.date.setHours(value as number)
          break
        case 'minute':
          this.date.setMinutes(value as number)
          break
        case 'second':
          this.date.setSeconds(value as number)
          break
        case 'millisecond':
          this.date.setMilliseconds(value as number)
          break
        default:
          throw new Error('Invalid unit provided to `StandardDateAdapter#set`')
      }
    } else {
      switch (unit) {
        case 'year':
          this.date.setUTCFullYear(value as number)
          break
        case 'month':
          this.date.setUTCMonth((value as number) - 1)
          break
        case 'day':
          this.date.setUTCDate(value as number)
          break
        case 'hour':
          this.date.setUTCHours(value as number)
          break
        case 'minute':
          this.date.setUTCMinutes(value as number)
          break
        case 'second':
          this.date.setUTCSeconds(value as number)
          break
        case 'millisecond':
          this.date.setUTCMilliseconds(value as number)
          break
        default:
          throw new Error('Invalid unit provided to `StandardDateAdapter#set`')
      }
    }

    this.assertIsValid()

    return this
  }

  toISOString() {
    return this.date.toISOString()
  }

  toICal(utc?: boolean): string {
    if (utc || this.timezone === 'UTC')
      return `${Utils.dateToStandardizedString(this as StandardDateAdapter)}Z`
    else return `${Utils.dateToStandardizedString(this as StandardDateAdapter)}`
  }

  valueOf() { return this.date.valueOf() }

  assertIsValid() {
    if (isNaN(this.valueOf()) || !['UTC', undefined].includes(this.timezone)) {
      throw new DateAdapter.InvalidDateError()
    }

    return true
  }
}

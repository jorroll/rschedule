import { DateAdapter } from '@rschedule/rschedule';

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
  getDayOfYear,
  addMilliseconds,
  subMilliseconds,
} from 'date-fns'

const WEEKDAYS: Array<DateAdapter.Weekday> = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function toTwoCharString(int: number) {
  if (int < 10) return `0${int}`
  else return `${int}`
}

function dateToStandardizedString<T extends DateAdapter<T>>(date: T) {
  return `${date.get('year')}${toTwoCharString(date.get('month'))}${toTwoCharString(
    date.get('day')
  )}T${toTwoCharString(date.get('hour'))}${toTwoCharString(date.get('minute'))}${toTwoCharString(
    date.get('second')
  )}`
}

export class StandardDateAdapter<R = any, S = any, C = any>
  implements DateAdapter<StandardDateAdapter> {
  public date: Date
  public timezone: 'UTC' | undefined

  /** The `Rule` which generated this `DateAdapter` */
  public rule: R | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  public schedule: S | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  public calendar: C | undefined

  constructor(date?: Date) {
    this.date = date ? new Date(date) : new Date()
    this.assertIsValid()
  }

  static isInstance(object: any): object is StandardDateAdapter {
    return object instanceof StandardDateAdapter
  }

  static fromTimeObject(args: {
    datetimes: [
      number,
      number,
      number,
      number | undefined,
      number | undefined,
      number | undefined
    ][]
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
          return new StandardDateAdapter(new Date(Date.UTC(...datetime)))
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

  isEqual(object: any): object is StandardDateAdapter {
    return this.isSameClass(object) && object.date.valueOf() === this.date.valueOf()
  }
  isBefore(object: StandardDateAdapter): boolean {
    return this.date.valueOf() < object.date.valueOf()
  }
  isBeforeOrEqual(object: StandardDateAdapter): boolean {
    return this.date.valueOf() <= object.date.valueOf()
  }
  isAfter(object: StandardDateAdapter): boolean {
    return this.date.valueOf() > object.date.valueOf()
  }
  isAfterOrEqual(object: StandardDateAdapter): boolean {
    return this.date.valueOf() >= object.date.valueOf()
  }

  // clones date before manipulating it
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

  // clones date before manipulating it
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
  get(unit: 'ordinal'): number
  get(unit: 'tzoffset'): number
  get(unit: 'timezone'): 'UTC' | undefined
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
      | 'ordinal'
      | 'tzoffset'
      | 'timezone'
  ) {
    if (this.timezone === undefined) {
      switch (unit) {
        case 'year':
          return this.date.getFullYear()
        case 'month':
          return this.date.getMonth() + 1
        case 'yearday':
          return getDayOfYear(this.date)
        case 'weekday':
          return WEEKDAYS[this.date.getDay()]
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
        case 'ordinal':
          return this.date.valueOf()
        case 'tzoffset':
          return this.date.getTimezoneOffset() * 60
        case 'timezone':
          return this.timezone
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
          return getDayOfYear(
            new Date(
              Date.UTC(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate())
            )
          )
        case 'weekday':
          return WEEKDAYS[this.date.getUTCDay()]
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
        case 'ordinal':
          return this.date.valueOf()
        case 'tzoffset':
          return 0
        case 'timezone':
          return this.timezone
        default:
          throw new Error('Invalid unit provided to `StandardDateAdapter#set`')
      }
    }
  }

  set(unit: DateAdapter.Unit, value: number): StandardDateAdapter
  set(unit: 'timezone', value: 'UTC' | undefined): StandardDateAdapter
  set(unit: DateAdapter.Unit | 'timezone', value: number | 'UTC' | undefined): StandardDateAdapter {
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
        case 'timezone':
          this.timezone = value as 'UTC' | undefined
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
        case 'timezone':
          this.timezone = value as 'UTC' | undefined
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
      return `${dateToStandardizedString(this as StandardDateAdapter)}Z`
    else return `${dateToStandardizedString(this as StandardDateAdapter)}`
  }

  assertIsValid() {
    if (isNaN(this.date.valueOf()) || !['UTC', undefined].includes(this.timezone)) {
      throw new DateAdapter.InvalidDateError()
    }

    return true
  }
}

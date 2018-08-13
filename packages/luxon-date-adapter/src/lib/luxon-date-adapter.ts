import { DateAdapter, Rule, Schedule, Calendar, ParsedDatetime, Utils } from '@rschedule/rschedule';
import { DateTime } from 'luxon';

/**
 * The `LuxonDateAdapter` is for using with momentjs *without* the
 * `moment-timezone` package. It only supports `"UTC"` and local
 * timezones.
 * 
 * If you want timezone support, you'll need to install the
 * `moment-timezone` package, and use it with the
 * `MomentTZDateAdapter`.
 */
export class LuxonDateAdapter
implements DateAdapter<LuxonDateAdapter, DateTime> {
  public date: DateTime
  public get timezone(): string | undefined {
    return this.date.zoneName
  }
  public set timezone(value: string | undefined) {
    if (value === undefined) {
      this.date = DateTime.fromFormat(
        this.date.toFormat('YYYY-MM-DD-HH-mm-SS-mmm'),
        'YYYY-MM-DD-HH-mm-SS-mmm'
      )
    }
    else {
      this.date = this.date.setZone(value)
    }
  }
  public get utcOffset() { return this.date.offset }

  /** The `Rule` which generated this `DateAdapter` */
  public rule: Rule<LuxonDateAdapter> | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  public schedule: Schedule<LuxonDateAdapter> | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  public calendar: Calendar<LuxonDateAdapter> | undefined
  
  constructor(date?: DateTime, args: {} = {}) {
    if (date instanceof DateTime) {
      this.date = DateTime.fromISO(date.toISO())
    }
    else if (date) {
      throw new DateAdapter.InvalidDateError(
        'The `LuxonDateAdapter` constructor only accepts luxon `DateTime` dates.'
      )
    }
    else this.date = DateTime.local();
    
    this.assertIsValid()
  }

  static isInstance(object: any): object is LuxonDateAdapter {
    return object instanceof LuxonDateAdapter
  }

  static fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone: string | undefined
    raw: string
  }): LuxonDateAdapter[] {
    const dates = args.datetimes.map(datetime => {
      switch (args.timezone) {
        case 'UTC':
          return new LuxonDateAdapter(DateTime.utc(...datetime))
        case undefined:
        case 'DATE':
          return new LuxonDateAdapter(DateTime.local(...datetime))
        default:
          return new LuxonDateAdapter(
            DateTime.local(...datetime).setZone(args.timezone, {keepLocalTime: true})
          )
      }
    })

    return dates
  }

  clone(): LuxonDateAdapter {
    return new LuxonDateAdapter(this.date)
  }

  isSameClass(object: any): object is LuxonDateAdapter {
    return LuxonDateAdapter.isInstance(object)
  }

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

  add(amount: number, unit: DateAdapter.Unit): LuxonDateAdapter {
    switch (unit) {
      case 'year':
        this.date = this.date.plus({years: amount})
        break
      case 'month':
        this.date = this.date.plus({months: amount})
        break
      case 'week':
        this.date = this.date.plus({weeks: amount})
        break
      case 'day':
        this.date = this.date.plus({days: amount})
        break
      case 'hour':
        this.date = this.date.plus({hours: amount})
        break
      case 'minute':
        this.date = this.date.plus({minutes: amount})
        break
      case 'second':
        this.date = this.date.plus({seconds: amount})
        break
      case 'millisecond':
        this.date = this.date.plus({milliseconds: amount})
        break
      default:
        throw new Error('Invalid unit provided to `LuxonDateAdapter#add()`')
    }

    this.assertIsValid()

    return this
  }

  // clones date before manipulating it
  subtract(amount: number, unit: DateAdapter.Unit): LuxonDateAdapter {
    switch (unit) {
      case 'year':
        this.date = this.date.minus({years: amount})
        break
      case 'month':
        this.date = this.date.minus({months: amount})
        break
      case 'week':
        this.date = this.date.minus({weeks: amount})
        break
      case 'day':
        this.date = this.date.minus({days: amount})
        break
      case 'hour':
        this.date = this.date.minus({hours: amount})
        break
      case 'minute':
        this.date = this.date.minus({minutes: amount})
        break
      case 'second':
        this.date = this.date.minus({seconds: amount})
        break
      case 'millisecond':
        this.date = this.date.minus({milliseconds: amount})
        break
      default:
        throw new Error('Invalid unit provided to `LuxonDateAdapter#subtract()`')
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
    switch (unit) {
      case 'year':
        return this.date.get('year')
      case 'month':
        return this.date.get('month') + 1
      case 'yearday':
        return this.date.diff(this.date.startOf('year'), 'days')
      case 'weekday':
        return Utils.WEEKDAYS[this.date.get('weekday')]
      case 'day':
        return this.date.get('day')
      case 'hour':
        return this.date.get('hour')
      case 'minute':
        return this.date.get('minute')
      case 'second':
        return this.date.get('second')
      case 'millisecond':
        return this.date.get('millisecond')
      default:
        throw new Error('Invalid unit provided to `LuxonDateAdapter#set`')
    }
  }

  set(unit: DateAdapter.Unit, value: number): LuxonDateAdapter {
    switch (unit) {
      case 'year':
        this.date = this.date.set({year: value as number})
        break
      case 'month':
        this.date = this.date.set({month: value as number})
        break
      case 'day':
        this.date = this.date.set({day: value as number})
        break
      case 'hour':
        this.date = this.date.set({hour: value as number})
        break
      case 'minute':
        this.date = this.date.set({minute: value as number})
        break
      case 'second':
        this.date = this.date.set({second: value as number})
        break
      case 'millisecond':
        this.date = this.date.set({millisecond: value as number})
        break
      default:
        throw new Error('Invalid unit provided to `LuxonDateAdapter#set`')
    }

    this.assertIsValid()

    return this
  }

  toISOString() {
    return this.date.toISO()
  }

  toICal(utc?: boolean): string {
    if (utc || this.timezone === 'UTC')
      return this.date.toUTC().toFormat('YYYYMMDDTHHMMSS[Z]')
    else if (this.timezone === undefined)
      return this.date.toFormat('YYYYMMDDTHHMMSS')
    else return this.date.toFormat(`[TZID=${this.date.zoneName}]:YYYYMMDDTHHMMSS`)
  }

  valueOf() { return this.date.valueOf() }

  assertIsValid() {
    if (!this.date.isValid) {
      throw new DateAdapter.InvalidDateError()
    }

    return true
  }
}

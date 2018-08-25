import { DateAdapter, RRule, Schedule, Calendar, ParsedDatetime, RDates } from '@rschedule/rschedule';
import { DateTime } from 'luxon';

const LUXON_DATE_ADAPTER_ID = Symbol.for('6e11cae3-344a-4c49-a5b1-5bcb84fe1f26')

/**
 * The `LuxonDateAdapter` is a DateAdapter for `luxon` DateTime
 * objects.
 * 
 * It supports timezone handling in so far as luxon supports
 * timezone handling. Note: that, if able, luxon always adds
 * a timezone to a DateTime (i.e. timezone may never be undefined).
 * 
 * At the moment, that means that serializing to/from iCal will
 * always apply a specific timezone (which may or may not be what
 * you want). If this is a problem for you, you can try opening
 * an issue in the rSchedule monorepo.
 */
export class LuxonDateAdapter
implements DateAdapter<LuxonDateAdapter, DateTime> {
  public date: DateTime

  public get utcOffset() { return this.date.offset }

  /** The `Rule` which generated this `DateAdapter` */
  public rule: RRule<LuxonDateAdapter> | RDates<LuxonDateAdapter> | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  public schedule: Schedule<LuxonDateAdapter> | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  public calendar: Calendar<LuxonDateAdapter, Schedule<LuxonDateAdapter>> | undefined
  
  constructor(date?: DateTime, args: {} = {}) {
    if (date) {
      this.assertIsValid(date)

      const obj = {
        ...date.toObject(),
        zone: date.zoneName
      }

      // I realize that luxon is immutable, but the tests assume that a date is mutable
      // and check object identity
      this.date = DateTime.fromObject(obj)
    }
    else this.date = DateTime.local();    
  }

  public readonly [LUXON_DATE_ADAPTER_ID] = true

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `LuxonDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is LuxonDateAdapter {
    return !!(object && object[Symbol.for('6e11cae3-344a-4c49-a5b1-5bcb84fe1f26')])
  }

  static readonly hasTimezoneSupport = true;

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
            DateTime.fromObject({
              year: datetime[0],
              month: datetime[1],
              day: datetime[2],
              hour: datetime[3],
              minute: datetime[4],
              second: datetime[5],
              zone: args.timezone,
            })
          )
      }
    })

    return dates
  }

  /**
   * Returns a clone of the date adapter including a cloned
   * date property. Does not clone the `rule`, `schedule`,
   * or `calendar` properties, but does copy them over to the
   * new object.
   */
  clone(): LuxonDateAdapter {
    const adapter = new LuxonDateAdapter(this.date)
    adapter.rule = this.rule
    adapter.schedule = this.schedule
    adapter.calendar = this.calendar
    return adapter
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
  get(unit: 'timezone'): string | undefined
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
      | 'timezone'
  ) {
    switch (unit) {
      case 'year':
        return this.date.get('year')
      case 'month':
        return this.date.get('month')
      case 'yearday':
        return Math.floor(this.date.diff(this.date.startOf('year'), 'days').days) + 1
      case 'weekday':
        return WEEKDAYS[this.date.get('weekday') - 1]
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
      case 'timezone':
        return this.date.zoneName as string | undefined
      default:
        throw new Error('Invalid unit provided to `LuxonDateAdapter#set`')
    }
  }

  set(unit: 'timezone', value: string | undefined, options?: {keepLocalTime?: boolean}): LuxonDateAdapter
  set(unit: DateAdapter.Unit, value: number): LuxonDateAdapter
  set(unit: DateAdapter.Unit | 'timezone', value: number | string | undefined, options: {keepLocalTime?: boolean} = {}): LuxonDateAdapter {
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
      case 'timezone':
        if (value)
          this.date = this.date.setZone(value as string, {keepLocalTime: options.keepLocalTime})
        else if (options.keepLocalTime) {
          this.date = DateTime.fromObject({
            year: this.get('year'),
            month: this.get('month'),
            day: this.get('day'),
            hour: this.get('hour'),
            minute: this.get('minute'),
            second: this.get('second'),
            millisecond: this.get('millisecond'),
          })
        }
        else {
          this.date = this.date.toLocal()
        }

        if (value !== undefined && this.date.zoneName !== value) {
          throw new DateAdapter.InvalidDateError(
            `LuxonDateAdapter provided invalid timezone "${value}".`
          )
        }
        break
      default:
        throw new Error('Invalid unit provided to `LuxonDateAdapter#set`')
    }

    this.assertIsValid()

    return this
  }

  toISOString() {
    return this.date.toUTC().toISO()
  }

  toICal(options: {format?: string} = {}): string {
    const format = options.format || this.get('timezone');

    if (format === 'UTC')
      return this.date.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")
    else if (format === 'local')
      return this.date.toFormat("yyyyMMdd'T'HHmmss")
    else if (format)
      return `TZID=${format}:${this.date.setZone(format).toFormat("yyyyMMdd'T'HHmmss")}`
    else
      return `TZID=${this.date.zoneName}:${this.date.toFormat("yyyyMMdd'T'HHmmss")}`
  }

  valueOf() { return this.date.valueOf() }

  assertIsValid(date?: DateTime) {
    date = date || this.date;

    if (!date.isValid) {
      throw new DateAdapter.InvalidDateError()
    }

    return true
  }
}

const WEEKDAYS = ['MO','TU','WE','TH','FR','SA','SU'];
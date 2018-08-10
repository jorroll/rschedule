import { DateAdapter, Rule, Schedule, Calendar, ParsedDatetime } from '@rschedule/rschedule';
import moment from 'moment';
import { WEEKDAYS } from './utilities';
import { Moment } from 'moment-timezone';

/**
 * The `MomentTZDateAdapter` is for using with momentjs and it's optional
 * `moment-timezone` package. It support robust timezone handling.
 * 
 * If you are not using the optional `moment-timezone` package, you should
 * use the `MomentDateAdapter`.
 */
export class MomentTZDateAdapter
  implements DateAdapter<MomentTZDateAdapter> {
  public date: Moment
  public get timezone() { return this.date.tz() }

  /** The `Rule` which generated this `DateAdapter` */
  public rule: Rule<MomentTZDateAdapter> | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  public schedule: Schedule<MomentTZDateAdapter> | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  public calendar: Calendar<MomentTZDateAdapter> | undefined

  constructor(date?: Moment, args: {} = {}) {
    this.date = date ? date.clone() : moment()
    this.assertIsValid()
  }

  static isInstance(object: any): object is MomentTZDateAdapter {
    return object instanceof MomentTZDateAdapter
  }

  static fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone: string | undefined
    raw: string
  }): MomentTZDateAdapter[] {
    const dates = args.datetimes.map(datetime => {
      // adjust for `Date`'s base-0 months
      datetime[1] = datetime[1] - 1

      switch (args.timezone) {
        case 'UTC':
          // TS doesn't like my use of the spread operator
          
          return new MomentTZDateAdapter(moment.utc(datetime))
        case undefined:
        case 'DATE':
          // TS doesn't like my use of the spread operator
          return new MomentTZDateAdapter(moment(datetime))
        default:
          return new MomentTZDateAdapter(
            moment.tz(datetime, args.timezone)
          )
      }
    })

    return dates
  }

  clone(): MomentTZDateAdapter {
    return new MomentTZDateAdapter(this.date)
  }

  isSameClass(object: any): object is MomentTZDateAdapter {
    return MomentTZDateAdapter.isInstance(object)
  }

  isEqual<T extends DateAdapter<T>>(object?: T): boolean {
    return !!object && object.toISOString() === this.toISOString()
  }
  isBefore(object: MomentTZDateAdapter): boolean {
    return this.date.valueOf() < object.date.valueOf()
  }
  isBeforeOrEqual(object: MomentTZDateAdapter): boolean {
    return this.date.valueOf() <= object.date.valueOf()
  }
  isAfter(object: MomentTZDateAdapter): boolean {
    return this.date.valueOf() > object.date.valueOf()
  }
  isAfterOrEqual(object: MomentTZDateAdapter): boolean {
    return this.date.valueOf() >= object.date.valueOf()
  }

  add(amount: number, unit: DateAdapter.Unit): MomentTZDateAdapter {
    switch (unit) {
      case 'year':
        this.date.add(amount, 'year')
        break
      case 'month':
        this.date.add(amount, 'month')
        break
      case 'week':
        this.date.add(amount, 'week')
        break
      case 'day':
        this.date.add(amount, 'day')
        break
      case 'hour':
        this.date.add(amount, 'hour')
        break
      case 'minute':
        this.date.add(amount, 'minute')
        break
      case 'second':
        this.date.add(amount, 'second')
        break
      case 'millisecond':
        this.date.add(amount, 'millisecond')
        break
      default:
        throw new Error('Invalid unit provided to `MomentTZDateAdapter#add`')
    }

    this.assertIsValid()

    return this
  }

  // clones date before manipulating it
  subtract(amount: number, unit: DateAdapter.Unit): MomentTZDateAdapter {
    switch (unit) {
      case 'year':
        this.date.subtract(amount, 'year')
        break
      case 'month':
        this.date.subtract(amount, 'month')
        break
      case 'week':
        this.date.subtract(amount, 'week')
        break
      case 'day':
        this.date.subtract(amount, 'day')
        break
      case 'hour':
        this.date.subtract(amount, 'hour')
        break
      case 'minute':
        this.date.subtract(amount, 'minute')
        break
      case 'second':
        this.date.subtract(amount, 'second')
        break
      case 'millisecond':
        this.date.subtract(amount, 'millisecond')
        break
      default:
        throw new Error('Invalid unit provided to `MomentTZDateAdapter#subtract`')
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
    switch (unit) {
      case 'year':
        return this.date.get('year')
      case 'month':
        return this.date.get('month') + 1
      case 'yearday':
        return this.date.get('dayOfYear')
      case 'weekday':
        return WEEKDAYS[this.date.get('weekday')]
      case 'day':
        return this.date.get('date')
      case 'hour':
        return this.date.get('hour')
      case 'minute':
        return this.date.get('minute')
      case 'second':
        return this.date.get('second')
      case 'millisecond':
        return this.date.get('millisecond')
      case 'ordinal':
        return this.date.valueOf()
      case 'tzoffset':
        return this.date.utcOffset() * 60
      case 'timezone':
        return this.timezone
      default:
        throw new Error('Invalid unit provided to `MomentTZDateAdapter#set`')
    }
  }

  set(unit: DateAdapter.Unit, value: number): MomentTZDateAdapter
  set(unit: 'timezone', value: 'UTC' | undefined): MomentTZDateAdapter
  set(unit: DateAdapter.Unit | 'timezone', value: number | 'UTC' | undefined): MomentTZDateAdapter {
    switch (unit) {
      case 'year':
        this.date.set('year', value as number)
        break
      case 'month':
        this.date.set('month', (value as number) - 1)
        break
      case 'day':
        this.date.set('day', value as number)
        break
      case 'hour':
        this.date.set('hour', value as number)
        break
      case 'minute':
        this.date.set('minute', value as number)
        break
      case 'second':
        this.date.set('second', value as number)
        break
      case 'millisecond':
        this.date.set('millisecond', value as number)
        break
      case 'timezone':
        value ? this.date.tz(value as string) : moment(this.date.valueOf())
        break
      default:
        throw new Error('Invalid unit provided to `MomentTZDateAdapter#set`')
    }

    this.assertIsValid()

    return this
  }

  toISOString() {
    return this.date.toISOString()
  }

  toICal(utc?: boolean): string {
    if (utc || this.timezone === 'UTC')
      return this.date.clone().tz('UTC').format('YYYYMMDDTHHMMSSZ')
    else return this.date.format('YYYYMMDDTHHMMSSZ')
  }

  assertIsValid() {
    if (!this.date.isValid()) {
      throw new DateAdapter.InvalidDateError()
    }

    return true
  }
}

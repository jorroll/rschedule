import { DateAdapter, Rule, Schedule, Calendar, ParsedDatetime, Utils } from '@rschedule/rschedule';
import moment from 'moment-timezone';

/**
 * The `MomentTZDateAdapter` is for using with momentjs and it's optional
 * `moment-timezone` package. It supports robust timezone handling.
 * 
 * If you are not using the optional `moment-timezone` package, you should
 * use the `MomentDateAdapter`.
 */
export class MomentTZDateAdapter
  implements DateAdapter<MomentTZDateAdapter, moment.Moment> {
  public date: moment.Moment
  public get timezone() { return this.date.tz() }
  public set timezone(value) {
    if (value)
      this.date.tz(value)
    else {
      this.date = moment(this.date.valueOf())
    }

    if (this.date.tz() !== value) {
      throw new DateAdapter.InvalidDateError(
        `MomentTZDateAdapter provided invalid timezone "${value}".`
      )
    }
  }

  // moment() seems to output utcOffset with the opposite sign (-/+) from 
  // the native Date object. I'm going to side with Date and flip moment's
  // output sign to solve the issue.

  // update: so the UTC offset in the southern hemisphere currently needs to be
  // the opposite from the northern hemisphere for my code to work. But then it seems
  // to work.
  public get utcOffset() { return this.date.utcOffset() === 0 ? 0 : -this.date.utcOffset() }

  /** The `Rule` which generated this `DateAdapter` */
  public rule: Rule<MomentTZDateAdapter> | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  public schedule: Schedule<MomentTZDateAdapter> | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  public calendar: Calendar<MomentTZDateAdapter> | undefined

  constructor(date?: moment.Moment, args: {} = {}) {
    if (moment.isMoment(date) && typeof date.tz === 'function') {
      this.date = date.clone()
    }
    else if (date) {
      throw new DateAdapter.InvalidDateError(
        'The `MomentTZDateAdapter` constructor only accepts `moment()` dates ' +
        'which have been created with "moment-timezone".'
      )
    }
    else this.date = moment();
    
    this.assertIsValid()
  }

  static isInstance(object: any): object is MomentTZDateAdapter {
    return object instanceof MomentTZDateAdapter
  }

  static readonly hasTimezoneSupport = true;

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
    return !!object && typeof object.toISOString === 'function' && object.toISOString() === this.toISOString()
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
        this.date.add(amount, 'months')
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
        return this.date.get('dayOfYear')
      case 'weekday':
        return Utils.WEEKDAYS[this.date.get('weekday')]
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
      default:
        throw new Error('Invalid unit provided to `MomentTZDateAdapter#set`')
    }
  }

  set(unit: DateAdapter.Unit, value: number): MomentTZDateAdapter {
    switch (unit) {
      case 'year':
        this.date.set('year', value as number)
        break
      case 'month':
        this.date.set('month', (value as number) - 1)
        break
      case 'day':
        this.date.set('date', value as number)
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
      default:
        throw new Error('Invalid unit provided to `MomentTZDateAdapter#set`')
    }

    this.assertIsValid()

    return this
  }

  toISOString() {
    return this.date.toISOString()
  }

  toICal(options: {format?: string} = {}): string {
    const format = options.format || this.timezone;

    if (format === 'UTC')
      return this.date.clone().tz('UTC').format('YYYYMMDDTHHmmss[Z]')
    else if (format === 'local')
      return this.date.clone().local().format('YYYYMMDDTHHmmss')
    else if (format)
      return `TZID=${format}:${this.date.clone().tz(format).format('YYYYMMDDTHHmmss')}`
    else
      return this.date.clone().local().format('YYYYMMDDTHHmmss')
  }

  valueOf() { return this.date.valueOf() }

  assertIsValid() {
    if (!this.date.isValid()) {
      throw new DateAdapter.InvalidDateError()
    }

    return true
  }
}

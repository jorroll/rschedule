import { DateAdapter, RRule, Schedule, Calendar, ParsedDatetime, Utils, RDates } from '@rschedule/rschedule';
import moment from 'moment';

const MOMENT_DATE_ADAPTER_ID = Symbol.for('44069a20-dc6f-4479-8737-d86a93e9b357')

/**
 * The `MomentDateAdapter` is for using with momentjs *without* the
 * `moment-timezone` package. It only supports `"UTC"` and local
 * timezones.
 * 
 * If you want timezone support, you'll need to install the
 * `moment-timezone` package, and use it with the
 * `MomentTZDateAdapter`.
 */
export class MomentDateAdapter
implements DateAdapter<MomentDateAdapter, moment.Moment> {
  public date: moment.Moment
  
  // moment() seems to output utcOffset with the opposite sign (-/+) from 
  // the native Date object. I'm going to side with Date and flip moment's
  // output sign to solve the issue.
  public get utcOffset() { return this.date.utcOffset() === 0 ? 0 : -this.date.utcOffset() }

  /** The `Rule` which generated this `DateAdapter` */
  public rule: RRule<MomentDateAdapter> | RDates<MomentDateAdapter> | undefined
  /** The `Schedule` which generated this `DateAdapter` */
  public schedule: Schedule<MomentDateAdapter> | undefined
  /** The `Calendar` which generated this `DateAdapter` */
  public calendar: Calendar<MomentDateAdapter, Schedule<MomentDateAdapter>> | undefined
  
  constructor(date?: moment.Moment, args: {} = {}) {
    if (moment.isMoment(date)) {
      this.date = date.clone()
    }
    else if (date) {
      throw new DateAdapter.InvalidDateError(
        'The `MomentDateAdapter` constructor only accepts `moment()` dates.'
      )
    }
    else this.date = moment();
    
    this.assertIsValid()
  }

  public readonly [MOMENT_DATE_ADAPTER_ID] = true

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `MomentDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is MomentDateAdapter {
    return !!(object && object[Symbol.for('44069a20-dc6f-4479-8737-d86a93e9b357')])
  }

  static readonly hasTimezoneSupport = false;

  static fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone: string | undefined
    raw: string
  }): MomentDateAdapter[] {
    const dates = args.datetimes.map(datetime => {
      // adjust for `Date`'s base-0 months
      datetime[1] = datetime[1] - 1

      switch (args.timezone) {
        case 'UTC':
          return new MomentDateAdapter(moment.utc(datetime))
        case undefined:
        case 'DATE':
          return new MomentDateAdapter(moment(datetime))
        default:
          throw new DateAdapter.InvalidDateError(
            'The `MomentDateAdapter` only supports datetimes in UTC or LOCAL time. ' +
            `You attempted to parse an ICAL string with a "${args.timezone}" timezone. ` +
            'Timezones are supported by the `MomentTZDateAdapter` with the ' +
            '`moment-timezone` package installed.'
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
  clone(): MomentDateAdapter {
    const adapter = new MomentDateAdapter(this.date)
    adapter.rule = this.rule
    adapter.schedule = this.schedule
    adapter.calendar = this.calendar
    return adapter
  }

  isSameClass(object: any): object is MomentDateAdapter {
    return MomentDateAdapter.isInstance(object)
  }

  isEqual<O extends DateAdapter<O>>(object?: O): boolean {
    return !!object && typeof object.toISOString === 'function' && object.toISOString() === this.toISOString()
  }
  isBefore<O extends DateAdapter<O>>(object: O): boolean {
    return this.valueOf() < object.valueOf()
  }
  isBeforeOrEqual<O extends DateAdapter<O>>(object: O): boolean {
    return this.valueOf() <= object.valueOf()
  }
  isAfter<O extends DateAdapter<O>>(object: O): boolean {
    return this.valueOf() > object.valueOf()
  }
  isAfterOrEqual<O extends DateAdapter<O>>(object: O): boolean {
    return this.valueOf() >= object.valueOf()
  }

  add(amount: number, unit: DateAdapter.Unit): MomentDateAdapter {
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
        throw new Error('Invalid unit provided to `MomentDateAdapter#add`')
    }

    this.assertIsValid()

    return this
  }

  // clones date before manipulating it
  subtract(amount: number, unit: DateAdapter.Unit): MomentDateAdapter {
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
        throw new Error('Invalid unit provided to `MomentDateAdapter#subtract`')
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
      case 'timezone':
        return this.utcOffset === 0 ? 'UTC' : undefined
      default:
        throw new Error('Invalid unit provided to `MomentDateAdapter#set`')
    }
  }

  set(unit: 'timezone', value: 'UTC' | undefined, options?: {keepLocalTime?: boolean}): MomentDateAdapter
  set(unit: DateAdapter.Unit, value: number): MomentDateAdapter
  set(unit: DateAdapter.Unit | 'timezone', value: number | 'UTC' | undefined, options: {keepLocalTime?: boolean} = {}): MomentDateAdapter {
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
      case 'timezone':
        if (['UTC', undefined].includes(value as 'UTC' | undefined))
          value === 'UTC' ? this.date.utc(options.keepLocalTime) : this.date.local(options.keepLocalTime)
        else
          throw new DateAdapter.InvalidDateError(
            `MomentDateAdapter does not support "${value}" timezone.`
          )
        break
      default:
        throw new Error('Invalid unit provided to `MomentDateAdapter#set`')
    }

    this.assertIsValid()

    return this
  }

  toISOString() {
    return this.date.toISOString()
  }

  toICal(options: {format?: string} = {}): string {
    const format = options.format || this.get('timezone');

    if (format === 'UTC')
      return this.date.clone().utc().format('YYYYMMDDTHHmmss[Z]')
    else
      return this.date.local().format('YYYYMMDDTHHmmss')
  }

  valueOf() { return this.date.valueOf() }

  assertIsValid() {
    if (!this.date.isValid()) {
      throw new DateAdapter.InvalidDateError()
    }

    return true
  }
}

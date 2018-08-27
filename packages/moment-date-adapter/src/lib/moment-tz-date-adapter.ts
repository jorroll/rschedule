import { DateAdapter, RRule, Schedule, Calendar, ParsedDatetime, Utils, RDates } from '@rschedule/rschedule';
import moment from 'moment-timezone';

const MOMENT_TZ_DATE_ADAPTER_ID = Symbol.for('471f1a4e-133b-448a-add2-16d7208a04ed')

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

  // moment() seems to output utcOffset with the opposite sign (-/+) from 
  // the native Date object. I'm going to side with Date and flip moment's
  // output sign to solve the issue.

  // update: so the UTC offset in the southern hemisphere currently needs to be
  // the opposite from the northern hemisphere for my code to work. But then it seems
  // to work.
  public get utcOffset() { return this.date.utcOffset() === 0 ? 0 : -this.date.utcOffset() }

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
  public generators: Array<
    | RRule<MomentTZDateAdapter>
    | RDates<MomentTZDateAdapter>
    | Schedule<MomentTZDateAdapter>
    | Calendar<MomentTZDateAdapter, Schedule<MomentTZDateAdapter>>
  > = []

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

  public readonly [MOMENT_TZ_DATE_ADAPTER_ID] = true

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `MomentTZDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is MomentTZDateAdapter {
    return !!(object && object[Symbol.for('471f1a4e-133b-448a-add2-16d7208a04ed')])
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

  /**
   * Returns a clone of the date adapter including a cloned
   * date property. Does not clone the `rule`, `schedule`,
   * or `calendar` properties, but does copy them over to the
   * new object.
   */
  clone(): MomentTZDateAdapter {
    const adapter = new MomentTZDateAdapter(this.date)
    adapter.generators = this.generators.slice()
    return adapter
  }

  isSameClass(object: any): object is MomentTZDateAdapter {
    return MomentTZDateAdapter.isInstance(object)
  }

  isEqual<T extends DateAdapter<T>>(object?: T): boolean {
    return !!object && typeof object.toISOString === 'function' && object.toISOString() === this.toISOString()
  }
  isBefore<T extends DateAdapter<T>>(object: T): boolean {
    return this.date.valueOf() < object.date.valueOf()
  }
  isBeforeOrEqual<T extends DateAdapter<T>>(object: T): boolean {
    return this.date.valueOf() <= object.date.valueOf()
  }
  isAfter<T extends DateAdapter<T>>(object: T): boolean {
    return this.date.valueOf() > object.date.valueOf()
  }
  isAfterOrEqual<T extends DateAdapter<T>>(object: T): boolean {
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
        return this.date.tz()
      default:
        throw new Error('Invalid unit provided to `MomentTZDateAdapter#set`')
    }
  }

  set(unit: 'timezone', value: string | undefined, options?: {keepLocalTime?: boolean}): MomentTZDateAdapter
  set(unit: DateAdapter.Unit, value: number): MomentTZDateAdapter
  set(unit: DateAdapter.Unit | 'timezone', value: number | string | undefined, options: {keepLocalTime?: boolean} = {}): MomentTZDateAdapter {
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
        if (value)
          this.date.tz(value as string, options.keepLocalTime)
        else if (options.keepLocalTime) {
          this.date = moment([
            this.get('year'),
            this.get('month') - 1,
            this.get('day'),
            this.get('hour'),
            this.get('minute'),
            this.get('second'),
            this.get('millisecond'),
          ])
        }
        else {
          this.date = moment(this.date.valueOf())
        }

        if (this.date.tz() !== value) {
          throw new DateAdapter.InvalidDateError(
            `MomentTZDateAdapter provided invalid timezone "${value}".`
          )
        }
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

  /**
   * Serializes DateAdapter in ICAL format. Accepts options object with
   * `format` property. Format accepts a timezone string and, if given, will
   * format the DateAdapter in the given timezone. If `format === "local"`,
   * will format the DateAdapter without a timezone.
   * 
   * @param options - {format?: string}
   */
  toICal(options: {format?: string} = {}): string {
    const format = options.format || this.get('timezone');

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

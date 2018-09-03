import { IDateAdapter, DateAdapterBase, ParsedDatetime, Utils } from '@rschedule/rschedule';
import moment from 'moment-timezone';

const MOMENT_TZ_DATE_ADAPTER_ID = Symbol.for('4796ecb9-5ad7-4fdf-9a8f-13f926546576')

/**
 * The `MomentTZDateAdapter` is for using with momentjs and it's optional
 * `moment-timezone` package. It supports robust timezone handling.
 * 
 * If you are not using the optional `moment-timezone` package, you should
 * use the `MomentDateAdapter`.
 */
export class MomentTZDateAdapter extends DateAdapterBase<moment.Moment> {
  public date: moment.Moment

  constructor(date?: moment.Moment) {
    super()

    if (moment.isMoment(date) && typeof date.tz === 'function') {
      this.date = date.clone()
    }
    else if (date) {
      throw new IDateAdapter.InvalidDateError(
        'The `MomentTZDateAdapter` constructor only accepts `moment()` dates ' +
        'which have been created with "moment-timezone".'
      )
    }
    else this.date = moment();
    
    this.assertIsValid()
  }

  static readonly hasTimezoneSupport = true;

  static date: moment.Moment

  static fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone: string | undefined
  }): MomentTZDateAdapter[] {
    const dates = args.datetimes.map(datetime => {
      // adjust for `Date`'s base-0 months
      datetime[1] = datetime[1] - 1

      switch (args.timezone) {
        case 'UTC':
          // TS doesn't like my use of the spread operator
          
          return new MomentTZDateAdapter(moment.tz(datetime, 'UTC'))
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

  // @ts-ignore used by static method
  private readonly [MOMENT_TZ_DATE_ADAPTER_ID] = true

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `MomentTZDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is MomentTZDateAdapter {
    return !!(object && object[MOMENT_TZ_DATE_ADAPTER_ID] && super.isInstance(object))
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

  get(unit: IDateAdapter.Unit | 'yearday'): number
  get(unit: 'weekday'): IDateAdapter.Weekday
  get(unit: 'timezone'): 'UTC' | undefined
  get(unit: IDateAdapter.Unit | 'yearday' | 'weekday' | 'timezone') {
    switch (unit) {
      case 'year':
        return this.date.get('year')
      case 'month':
        return this.date.get('month') + 1
      case 'yearday':
        return Utils.getYearDay(this.get('year'), this.get('month'), this.get('day'))
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

  set(unit: IDateAdapter.Unit, value: number): this
  set(unit: 'timezone', value: string | undefined, options?: {keepLocalTime?: boolean}): this
  set(unit: IDateAdapter.Unit | 'timezone', value: number | string | undefined, options: {keepLocalTime?: boolean}={}): this {
    if (unit !== 'timezone') return super.set(unit, value);

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
      throw new IDateAdapter.InvalidDateError(
        `MomentTZDateAdapter provided invalid timezone "${value}".`
      )
    }

    this.assertIsValid()

    return this
  }

  valueOf() { return this.date.valueOf() }

  assertIsValid() {
    if (!this.date.isValid()) {
      throw new IDateAdapter.InvalidDateError()
    }

    return true
  }
}

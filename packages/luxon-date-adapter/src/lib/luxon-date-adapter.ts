import { IDateAdapter, DateAdapterBase, ParsedDatetime, Utils } from '@rschedule/rschedule';
import { DateTime } from 'luxon';

const LUXON_DATE_ADAPTER_ID = Symbol.for('9689fd66-841f-4a75-8ee0-f0515571779b')

// Luxon has a different weekday order
const WEEKDAYS = ['MO','TU','WE','TH','FR','SA','SU'];

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
export class LuxonDateAdapter extends DateAdapterBase<DateTime> {
  static date: DateTime

  static readonly hasTimezoneSupport = true;

  // @ts-ignore used by static method
  private readonly [LUXON_DATE_ADAPTER_ID] = true

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `LuxonDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is LuxonDateAdapter {
    return !!(object && object[LUXON_DATE_ADAPTER_ID] && super.isInstance(object))
  }

  static fromTimeObject(args: {
    datetimes: ParsedDatetime[]
    timezone: string | undefined
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
              millisecond: datetime[6],
              zone: args.timezone,
            })
          )
      }
    })

    return dates
  }

  public date: DateTime

  constructor(date?: DateTime, args: {} = {}) {
    super()

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

  /**
   * Returns a clone of the date adapter including a cloned
   * date property. Does not clone the `rule`, `schedule`,
   * or `calendar` properties, but does copy them over to the
   * new object.
   */
  clone(): LuxonDateAdapter {
    const adapter = new LuxonDateAdapter(this.date)
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
        return this.date.get('month')
      case 'yearday':
        return Utils.getYearDay(this.get('year'), this.get('month'), this.get('day'))
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

  set(unit: IDateAdapter.Unit, value: number): this
  set(unit: 'timezone', value: string | undefined, options?: {keepLocalTime?: boolean}): this
  set(unit: IDateAdapter.Unit | 'timezone', value: number | string | undefined, options: {keepLocalTime?: boolean}={}): this {
    if (unit !== 'timezone') return super.set(unit, value);

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
      throw new IDateAdapter.InvalidDateError(
        `LuxonDateAdapter provided invalid timezone "${value}".`
      )
    }

    this.assertIsValid()

    return this
  }

  valueOf() { return this.date.valueOf() }

  assertIsValid(date?: DateTime) {
    date = date || this.date;

    if (!date.isValid) {
      throw new IDateAdapter.InvalidDateError()
    }

    return true
  }
}

import { IDateAdapter, DateProp, DateAdapter, DateAdapterConstructor, IDateAdapterConstructor } from '../date-adapter'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
} from '../interfaces'
import { CollectionIterator, CollectionsArgs, CollectionsRunArgs } from './collection'
import { add, OperatorObject } from '../operators';
import { Utils } from '../utilities';

const CALENDAR_ID = Symbol.for('5e83caab-8318-43d9-bf3d-cb24fe152246')

export class Calendar<
  T extends DateAdapterConstructor,
  S extends OperatorObject<T>,
  D = any
> extends HasOccurrences<T>
  implements IHasOccurrences<T> {
  public schedules: S[] = []

  /** Convenience property for holding arbitrary data */
  public data!: D

  get isInfinite() {
    return this.schedules.some(schedule => schedule.isInfinite)
  }

  public readonly [CALENDAR_ID] = true

  /**
   * Similar to `Array.isArray()`, `isCalendar()` provides a surefire method
   * of determining if an object is a `Calendar` by checking against the
   * global symbol registry.
   */
  public static isCalendar(object: any): object is Calendar<any, any> {
    return !!(object && object[Symbol.for('5e83caab-8318-43d9-bf3d-cb24fe152246')])
  }

  static dateAdapterConstructor: DateAdapterConstructor

  protected dateAdapter: IDateAdapterConstructor<T>

  constructor(args: { schedules?: Array<S> | S, data?: D, dateAdapter?: T }={}) {
    super()

    this.dateAdapter = args.dateAdapter 
      ? args.dateAdapter
      : Calendar.dateAdapterConstructor as any;

    if (!this.dateAdapter) {
      throw new Error(
        "Oops! You've initialized a Calendar object without a dateAdapter."
      )
    }

    if (args.data) this.data = args.data;
    if (Array.isArray(args.schedules)) { this.schedules = args.schedules.slice() }
    else if (args.schedules) { this.schedules.push(args.schedules) }
  }

  /**
   * Returns a clone of the Calendar object and all properties except the data property
   * (instead, the original data property is included as the data property of the
   * new Calendar).
   */
  public clone() {
    return new Calendar<T, S, D>({
      dateAdapter: this.dateAdapter as any,
      data: this.data,
      schedules: this.schedules.map(schedule => schedule.clone()) as S[],
    })
  }

  /**
   * Update all `schedules` of this calendar to use a
   * new timezone. This mutates the calendar's schedules.
   */
  public setTimezone(timezone: string | undefined, options: {keepLocalTime?: boolean} = {}) {
    this.schedules.forEach(schedule => {
      schedule.setTimezone(timezone, options)
    })

    return this
  }

  /**
   * ### collections()
   * 
   * Iterates over the calendar's occurrences and bundles them into collections
   * with a specified granularity (default is `"INSTANTANIOUS"`). Make sure to
   * read about each option & combination of options in the `details` section
   * below.
   * 
   * Options object:
   *   - start?: DateAdapter
   *   - end?: DateAdapter
   *   - take?: number
   *   - reverse?: NOT SUPPORTED
   *   - granularity?: CollectionsGranularity
   *   - weekStart?: DateAdapter.Weekday
   *   - incrementLinearly?: boolean
   * 
   * Returned `Collection` object:
   *
   *   - `dates` property containing an array of DateAdapter objects.
   *   - `granularity` property containing the granularity.
   *     - `CollectionsGranularity` type extends rule options `Frequency` type by adding
   *       `"INSTANTANIOUS"`.
   *   - `periodStart` property containing a DateAdapter equal to the period's
   *     start time.
   *   - `periodEnd` property containing a DateAdapter equal to the period's
   *     end time.
   *
   * #### Details:
   * 
   * `collections()` always returns full periods. This means that the `start` argument is 
   * transformed to be the start of whatever period the `start` argument is in, and the
   * `end` argument is transformed to be the end of whatever period the `end` argument is
   * in.
   * 
   * - Example: with granularity `"YEARLY"`, the `start` argument will be transformed to be the
   *   start of the year passed in the `start` argument, and the `end` argument will be transformed
   *   to be the end of the year passed in the `end` argument.
   * 
   * By default, the `periodStart` value of `Collection` objects produced by this method does not
   * necessarily increment linearly. A collection will *always* contain at least one date,
   * so the `periodStart` from one collection to the next can "jump". This can be changed by
   * passing the `incrementLinearly: true` option. With this argument, `collections()` will
   * return `Collection` objects for each period in linear succession, even if a collection object
   * has no dates associated with it, so long as the `Calendar` object still has upcoming occurrences.
   *
   * - Example 1: With `incrementLinearly: false` (the default), if your granularity is `"DAILY"` and
   *   you start January 1st, but the earliest a schedule outputs a date is February 1st, the first 
   *   Collection produced will have a `periodStart` in February.
   * 
   * - Example 2: With `incrementLinearly: true`, if your granularity is `"DAILY"` and
   *   you start January 1st, but the earliest a schedule outputs a date is February 1st, the first 
   *   collection produced will have a `Collection#periodStart` of January 1st and have
   *   `Collection#dates === []`. Similarly, the next 30 collections produced (Jan 2nd - 31st)
   *   will all contain an empty array for the `dates` property. The February 1st Collection will
   *   return dates though (i.e. `Collection#dates.length > 0)`.
   * 
   * When giving a `take` argument to `collections()`, you are specifying
   * the number of `Collection` objects to return (rather than occurrences).
   * 
   * When choosing a granularity of `"WEEKLY"`, the `weekStart` option is required.
   * 
   * When choosing a granularity of `"MONTHLY"`:
   * 
   * - If the `weekStart` option *is not* present, will generate collections with
   *   the `periodStart` and `periodEnd` at the beginning and end of each month. 
   * 
   * - If the `weekStart` option *is* present, will generate collections with the 
   *   `periodStart` equal to the start of the first week of the month, and the 
   *   `periodEnd` equal to the end of the last week of the month. This behavior could be 
   *   desired when rendering opportunities in a calendar view, where the calendar renders 
   *   full weeks (which may result in the calendar displaying dates in the
   *   previous or next months).
   *
   * @param args CollectionsArgs
   */
  public collections(args: CollectionsArgs<T> = {}) {
    return new CollectionIterator(this, this.processOccurrencesArgs(args))
  }

  /**
   * Iterates over the calendar's occurrences and returns them in order.
   * Unlike `Schedule#occurrences()`, this method may return duplicate dates,
   * each of which are associated with a different `Schedule`.
   * 
   * Options object:
   * - `start` the date to begin iteration on
   * - `end` the date to end iteration on
   * - `take` the max number of dates to take before ending iteration
   * - `reverse` whether to iterate in reverse or not
   *
   * @param arg `OccurrencesArgs` options object
   */
  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args))
  }

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  public occursOn(rawArgs: {date: T}): boolean
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * By default, only checks dates in the first year.
   * 
   * Optional arguments:
   * 
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - by default, `before` is equal to 1 year from the start date.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  public occursOn(rawArgs: {weekday: IDateAdapter.Weekday; after?: DateProp<T>; before?: DateProp<T>; excludeEnds?: boolean}): boolean
  public occursOn(rawArgs: {date?: DateProp<T>; weekday?: IDateAdapter.Weekday; after?: DateProp<T>; before?: DateProp<T>; excludeEnds?: boolean}): boolean {
    const args = this.processOccursOnArgs(rawArgs)

    if (args.weekday) {
      const start = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') as DateAdapter<T> : args.after)
      let end = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') as DateAdapter<T> : args.before)

      const iterator = this._run({start, end})

      let date = iterator.next().value

      if (!date) return false;

      if (!end) end = date.clone().add(1, 'year') as DateAdapter<T>;

      while (date && date.isBefore(end)) {
        if (date.get('weekday') === args.weekday) {
          return true
        }

        date = iterator.next({
          skipToDate: date.add(
            Utils.differenceInDaysBetweenTwoWeekdays(date.get('weekday'), args.weekday),
            'day'
          )
        }).value
      }

      return false
    }
    else {
      for (const day of this._run({ start: args.date, end: args.date })) {
        return !!day
      }
      return false  
    }
  }

  /**  @private use collections() instead */
  *_run(args: CollectionsRunArgs<T> = {}): IterableIterator<DateAdapter<T>> {
    const count = args.take;
    
    delete args.take;

    let iterator: IterableIterator<DateAdapter<T>>

    switch (this.schedules.length) {
      case 0: return
      case 1:
        iterator = this.schedules[0]._run(args)
        break
      default:
        iterator = add(...this.schedules)()._run(args)
        break
    }

    let date = iterator.next().value
    let index = 0

    while (date && (count === undefined || count > index)) {
      date.generators.push(this)

      const yieldArgs = yield date.clone() as DateAdapter<T>

      date = iterator.next(yieldArgs).value

      index++
    }
  }
}

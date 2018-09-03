import uniqWith from 'lodash.uniqwith'
import { IDateAdapter, DateAdapter, DateAdapterConstructor, IDateAdapterConstructor, DateProp, DateAdapterBase } from '../date-adapter'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunArgs,
} from '../interfaces'
import { Utils } from '../utilities'
import { RScheduleConfig } from '../rschedule-config';

const DATES_ID = Symbol.for('1a872780-b812-4991-9ca7-00c47cfdeeac')

/**
 * This base class provides a `HasOccurrences` API wrapper around arrays of dates
 */
export class Dates<T extends DateAdapterConstructor, D=any> extends HasOccurrences<T> implements IHasOccurrences<T> {
  public readonly isInfinite = false
  get length() {
    return this.dates.length
  }

  get startDate() {
    const dateTime = Utils.getEarliestDate(
      this.dates.map(date => this.buildDateAdapter(date) as DateAdapter<T>)
    )

    if (!dateTime) return null;

    return dateTime as DateAdapter<T>
  }

  public dates: DateProp<T>[] = []
  public data?: D

  static defaultDateAdapter?: DateAdapterConstructor

  // @ts-ignore used by static method
  private readonly [DATES_ID] = true

  /**
   * Similar to `Array.isArray()`, `isDates()` provides a surefire method
   * of determining if an object is a `Dates` by checking against the
   * global symbol registry.
   */
  public static isDates(object: any): object is Dates<any> {
    return !!(object && object[DATES_ID])
  }

  protected dateAdapter: IDateAdapterConstructor<T>

  constructor(args: {dates?: (DateProp<T> | DateAdapter<T>)[], data?: D, dateAdapter?: T}={}) {
    super()

    if (args.dateAdapter)
      this.dateAdapter = args.dateAdapter as any
    else if (Dates.defaultDateAdapter)
      this.dateAdapter = Dates.defaultDateAdapter as any
    else {
      this.dateAdapter = RScheduleConfig.defaultDateAdapter as any
    }

    if (!this.dateAdapter) {
      throw new Error(
        "Oops! You've initialized a Dates object without a dateAdapter."
      )
    }

    if (args.dates) this.dates = args.dates.map(date => DateAdapterBase.isInstance(date) ? date.date : date)
    
    this.data = args.data
  }

  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args))
  }

  public occursOn(rawArgs: {date: DateProp<T> | DateAdapter<T>}): boolean
  
  public occursOn(rawArgs: {
    weekday: IDateAdapter.Weekday; 
    after?: DateProp<T> | DateAdapter<T>; 
    before?: DateProp<T> | DateAdapter<T>, 
    excludeEnds?: boolean; 
    excludeDates?: (DateProp<T> | DateAdapter<T>)[]
  }): boolean
  
  public occursOn(rawArgs: {
    date?: DateProp<T> | DateAdapter<T>; 
    weekday?: IDateAdapter.Weekday; 
    after?: DateProp<T> | DateAdapter<T>; 
    before?: DateProp<T> | DateAdapter<T>, 
    excludeEnds?: boolean; 
    excludeDates?: (DateProp<T> | DateAdapter<T>)[]
  }): boolean {
    const args = this.processOccursOnArgs(rawArgs)

    if (args.weekday) {
      let before = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') : args.before)
      let after = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') : args.after)

      return this.dates.some(date => {
        const adapter = new this.dateAdapter(date)

        return adapter.get('weekday') === args.weekday && (
          !args.excludeDates || !args.excludeDates.some(exdate => exdate.isEqual(adapter))
        ) && (
          !after || adapter.isAfterOrEqual(after)
        ) && (
          !before || adapter.isBeforeOrEqual(before)
        )
      })
    }
    else {
      for (const day of this._run({ start: args.date, end: args.date })) {
        return !!day
      }
      return false  
    }
  }

  /**
   * Updates all of this object's `dates` to use a new timezone.
   */
  public setTimezone(timezone: string | undefined, options: {keepLocalTime?: boolean} = {}) {
    this.dates = this.dates.map(date => {
      const adapter = new this.dateAdapter(date)
      adapter.set('timezone', timezone, options)
      return adapter.date
    })

    return this
  }

  public *_run(args: RunArgs<T> = {}) {
    let dates = Utils.sortDates(
      uniqWith(
        this.dates.map(date => new this.dateAdapter(date)),
        (a, b) => a.isEqual(b)
      )
    )

    if (args.reverse) {
      if (args.start) {
        dates = dates.filter(date => date.isBeforeOrEqual(args.start!))
      }
      if (args.end) { dates = dates.filter(date => date.isAfterOrEqual(args.end!)) }

      dates.reverse()

      if (args.take) { dates = dates.slice(0, args.take) }  
    }
    else {
      if (args.start) {
        dates = dates.filter(date => date.isAfterOrEqual(args.start!))
      }
      if (args.end) { dates = dates.filter(date => date.isBeforeOrEqual(args.end!)) }
      if (args.take) { dates = dates.slice(0, args.take) }  
    }

    let dateCache = dates.slice()
    let date = dateCache.shift()
    let yieldArgs: {skipToDate?: IDateAdapter} | undefined

    while (date) {
      if (yieldArgs) {
        if (
          yieldArgs.skipToDate && (
            args.reverse
              ? yieldArgs.skipToDate.isBefore(date)
              : yieldArgs.skipToDate.isAfter(date)
          )
        ) {
          date = dateCache.shift()
          continue
        }

        yieldArgs = undefined;
      }

      date.generators.push(this)

      yieldArgs = yield date

      if (yieldArgs && yieldArgs.skipToDate) {
        // need to reset the date cache to allow the same date to be picked again.
        // Also, I suppose it's possible someone might want to go back in time,
        // which this allows.
        dateCache = dates.slice()
      }

      date = dateCache.shift()
    }
  }

  clone(): Dates<T, D> {
    return new Dates({
      dateAdapter: this.dateAdapter as any,
      dates: this.dates.slice(),
      data: this.data,
    })
  }
}

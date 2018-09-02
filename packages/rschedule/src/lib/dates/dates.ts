import uniqWith from 'lodash.uniqwith'
import { IDateAdapter, DateAdapter, DateAdapterConstructor, IDateAdapterConstructor, DateProp } from '../date-adapter'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunArgs,
} from '../interfaces'
import { Utils } from '../utilities'

/**
 * This base class provides a `HasOccurrences` API wrapper around arrays of dates
 */
export abstract class Dates<T extends DateAdapterConstructor, D=any> extends HasOccurrences<T> implements IHasOccurrences<T> {
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

  protected dateAdapter: IDateAdapterConstructor<T>

  constructor(args: {dates?: DateProp<T>[], data?: D, dateAdapter: T}) {
    super()
    if (args.dates) this.dates = args.dates
    this.data = args.data
    this.dateAdapter = args.dateAdapter as any
  }

  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args))
  }

  public occursOn(rawArgs: {date: DateProp<T>}): boolean
  public occursOn(rawArgs: {weekday: IDateAdapter.Weekday; after?: DateProp<T>; before?: DateProp<T>, excludeEnds?: boolean; excludeDates?: DateProp<T>[]}): boolean
  public occursOn(rawArgs: {date?: DateProp<T>; weekday?: IDateAdapter.Weekday; after?: DateProp<T>; before?: DateProp<T>, excludeEnds?: boolean; excludeDates?: DateProp<T>[]}): boolean {
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

  abstract clone(): Dates<T>

  abstract toICal(): string
}

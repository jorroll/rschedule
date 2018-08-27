import uniqWith from 'lodash.uniqwith'
import { DateAdapter } from '../date-adapter'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunnableIterator,
  Serializable,
} from '../interfaces'
import { Utils } from '../utilities'

/**
 * This base class provides a `HasOccurrences` API wrapper around arrays of dates
 */
export class Dates<T extends DateAdapter<T>> extends HasOccurrences<T>
  implements
    Serializable,
    RunnableIterator<T>,
    IHasOccurrences<T, Dates<T>> {
  public readonly isInfinite = false
  get length() {
    return this.dates.length
  }

  get startDate() {
    return Utils.getEarliestDate(this.dates)
  }

  public dates: T[] = []

  constructor(dates?: T[]) {
    super()
    if (dates) this.dates = dates
  }

  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, args)
  }

  public occursOn(args: {date: T}): boolean
  public occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T, excludeEnds?: boolean; excludeDates?: T[]}): boolean
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T, excludeEnds?: boolean; excludeDates?: T[]}): boolean {
    if (args.weekday) {
      let before = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') : args.before)
      let after = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') : args.after)

      return this.dates.some(date => 
        date.get('weekday') === args.weekday && (
          !args.excludeDates || !args.excludeDates.some(exdate => exdate.isEqual(date))
        ) && (
          !after || date.isAfterOrEqual(after)
        ) && (
          !before || date.isBeforeOrEqual(before)
        )
      )
    }
    else
      return super.occursOn(args as {date: T})
  }

  /**
   * Updates all of this object's `dates` to use a new timezone.
   */
  public setTimezone(timezone: string | undefined, options: {keepLocalTime?: boolean} = {}) {
    this.dates.forEach(date => {
      date.set('timezone', timezone, options)
    })

    return this
  }

  public *_run(args: OccurrencesArgs<T> = {}) {
    let dates = Utils.sortDates(uniqWith(this.dates, (a, b) => a.isEqual(b)))

    if (args.reverse) {
      if (args.start) {
        dates = dates.filter(date => date.isBeforeOrEqual(args.start as T))
      }
      if (args.end) { dates = dates.filter(date => date.isAfterOrEqual(args.end as T)) }

      dates.reverse()

      if (args.take) { dates = dates.slice(0, args.take) }  
    }
    else {
      if (args.start) {
        dates = dates.filter(date => date.isAfterOrEqual(args.start as T))
      }
      if (args.end) { dates = dates.filter(date => date.isBeforeOrEqual(args.end as T)) }
      if (args.take) { dates = dates.slice(0, args.take) }  
    }

    let dateCache = dates.slice()
    let date = dateCache.shift()
    let yieldArgs: {skipToDate?: T} | undefined

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

  public clone() {
    return new Dates(this.dates.map(date => date.clone()))
  }

  public toICal() {
    return ''
  }
}

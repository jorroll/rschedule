import uniqWith from 'lodash.uniqwith'
import { DateAdapter } from '../date-adapter'
import { datesToIcalString } from '../ical'
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
 * This base class provides a `HasOccurrences` api wrapper around arrays of dates
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

  public dates: T[]

  constructor(dates?: T[]) {
    super()
    this.dates = dates || []
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

    let date = dates.shift()

    while (date) {
      date.rule = this
      
      yield date

      date = dates.shift()
    }
  }

  public toICal() {
    return ''
  }
}

/**
 * RDates object for holding RDATEs but providing a `HasOccurrences` api
 */

const RDATES_ID = Symbol.for('10c93605-2fb8-4ab5-ba54-635f19cd81f4')

export class RDates<T extends DateAdapter<T>> extends Dates<T> {
  public readonly [RDATES_ID] = true

  /**
   * Similar to `Array.isArray()`, `isRDates()` provides a surefire method
   * of determining if an object is a `RDates` by checking against the
   * global symbol registry.
   */
  public static isRDates(object: any): object is RDates<any> {
    return !!(object && object[Symbol.for('10c93605-2fb8-4ab5-ba54-635f19cd81f4')])
  }

  /**
   * Returns a clone of the RDates object.
   */
  public clone() {
    return new RDates<T>(this.dates.map(date => date.clone()))
  }

  public toICal() {
    return datesToIcalString(this.dates, 'RDATE')
  }
}

/**
 * EXDates object for holding EXDATEs but providing a `HasOccurrences` api
 */

const EXDATES_ID = Symbol.for('3c83a9bf-13dc-4045-8361-0d55744427e7')

export class EXDates<T extends DateAdapter<T>> extends Dates<T> {
  public readonly [EXDATES_ID] = true

  /**
   * Similar to `Array.isArray()`, `isEXDates()` provides a surefire method
   * of determining if an object is a `EXDates` by checking against the
   * global symbol registry.
   */
  public static isEXDates(object: any): object is EXDates<any> {
    return !!(object && object[Symbol.for('3c83a9bf-13dc-4045-8361-0d55744427e7')])
  }

  /**
   * Returns a clone of the EXDates object.
   */
  public clone() {
    return new EXDates<T>(this.dates.map(date => date.clone()))
  }

  public toICal() {
    return datesToIcalString(this.dates, 'EXDATE')
  }
}

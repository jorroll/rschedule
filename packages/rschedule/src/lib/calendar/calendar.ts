import { DateAdapter } from '../date-adapter'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunnableIterator,
} from '../interfaces'
import { Schedule } from '../schedule/schedule'
import { Utils } from '../utilities'
import { CollectionIterator, CollectionsArgs } from './collection'

export class Calendar<
  T extends DateAdapter<T>,
  D = any
> extends HasOccurrences<T>
  implements RunnableIterator<T>, IHasOccurrences<T, Calendar<T, D>> {
  public schedules: Array<Schedule<T>> = []

  /** Convenience property for holding arbitrary data */
  public data?: D

  get startDate() {
    return Utils.getEarliestDate(this.schedules
      .map(schedule => schedule.startDate)
      .filter(date => !!date) as T[])
  }

  get isInfinite() {
    return this.schedules.some(schedule => schedule.isInfinite)
  }

  constructor(args: { schedules?: Array<Schedule<T>> | Schedule<T> } = {}) {
    super()
    if (Array.isArray(args.schedules)) { this.schedules = args.schedules.slice() }
    else if (args.schedules) { this.schedules.push(args.schedules) }
  }

  /**
   * Iterates over the calendar's occurrences and bundles them into collections
   * with a specified granularity (default is `"INSTANTANIOUS"`). Each `Collection`
   * object has:
   *
   *   - a `dates` property containing an array of DateAdapter objects.
   *   - a `period` property containing the granularity.
   *   - a `periodStart` property containing a DateAdapter equal to the period's
   *     start time.
   *   - a `periodEnd` property containing a DateAdapter equal to the period's
   *     end time.
   *
   * The `periodStart` value of `Collection` objects produced by this method does not
   * necessarily increment linearly. A collection *always* contains at least one date,
   * so the `periodStart` from one collection to the next can "jump".
   *
   * Example: If your granularity is `"DAILY"` and you start in January, but the earliest
   * a schedule outputs a date is in February, the first Collection produced will have a
   * `periodStart` in February.
   *
   * Another thing: when giving a `take` argument to `collections()`, you are specifying
   * the number of `Collection` objects to return (rather than occurrences).
   *
   * @param args
   */
  public collections(args: CollectionsArgs<T> = {}) {
    return new CollectionIterator(this, args)
  }

  /**
   * Iterates over the calendar's occurrences and simply spits them out in order.
   * Unlike `Schedule#occurrences()`, this method may spit out duplicate dates,
   * each of which are associated with a different `Schedule`. To see what
   * `Schedule` a date is associated with, you may use `DateAdapter#schedule`.
   *
   * @param args
   */
  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, args)
  }

  // `_run()` follows in the footsteps of `Schedule#_run()`,
  // which is fully commented.

  /**  @private use collections() instead */
  public *_run(args: CollectionsArgs<T> = {}) {
    let cache = this.schedules
      .map(schedule => {
        const iterator = schedule.occurrences(args)
        return {
          iterator,
          date: iterator.next().value,
        }
      })
      .filter(item => !!item.date)

    let next: { iterator: OccurrenceIterator<T, any>; date?: T }

    if (cache.length === 0) { return }
    else {
      next = selectNextUpcomingCacheObj(cache[0], cache)
    }

    const count = args.take
    let index = 0

    while (next.date && (count === undefined || count > index)) {
      // add the current calendar to the metadata
      next.date.calendar = this

      yield next.date.clone()

      next.date = next.iterator.next().value

      if (!next.date) {
        cache = cache.filter(item => item !== next)
        next = cache[0]

        if (cache.length === 0) { break }
      }

      next = selectNextUpcomingCacheObj(next, cache)

      index++
    }
  }
}

function selectNextUpcomingCacheObj<T extends DateAdapter<T>>(
  current: { iterator: OccurrenceIterator<T, any>; date?: T },
  cache: Array<{ iterator: OccurrenceIterator<T, any>; date?: T }>
) {
  if (cache.length === 1) { return cache[0] }

  return cache.reduce((prev, curr) => {
    if (!curr.date) { return prev }
    else if (curr.date.isBefore(prev.date!)) { return curr }
    else { return prev }
  }, current)
}

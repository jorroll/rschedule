import { DateAdapter } from '../date-adapter'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunnableIterator,
} from '../interfaces'
import { Utils } from '../utilities'
import { CollectionIterator, CollectionsArgs } from './collection'

const INTERSECTION_CALENDAR_ID = Symbol.for('ce7a15f5-e96a-47fd-8e13-aaee6651ec13')

export class IntersectionCalendar<
  T extends DateAdapter<T>,
  S extends IHasOccurrences<T, any>,
  D = any
> extends HasOccurrences<T>
  implements RunnableIterator<T>, IHasOccurrences<T, IntersectionCalendar<T, S, D>> {
  public schedules: S[] = []

  /** Convenience property for holding arbitrary data */
  public data!: D

  get startDate() {
\  }

  get isInfinite() {
    return this.schedules.some(schedule => schedule.isInfinite)
  }

  public readonly [INTERSECTION_CALENDAR_ID] = true

  /**
   * Similar to `Array.isArray()`, `isIntersectionCalendar()` provides a surefire method
   * of determining if an object is a `IntersectionCalendar` by checking against the
   * global symbol registry.
   */
  public static isIntersectionCalendar(object: any): object is IntersectionCalendar<any, any> {
    return !!(object && object[Symbol.for('ce7a15f5-e96a-47fd-8e13-aaee6651ec13')])
  }

  constructor(args: { schedules?: Array<S> | S, data?: D } = {}) {
    super()

    if (args.data) this.data = args.data;
    if (Array.isArray(args.schedules)) { this.schedules = args.schedules.slice() }
    else if (args.schedules) { this.schedules.push(args.schedules) }
  }

  /**
   * Returns a clone of the IntersectionCalendar object and all properties except the data property
   * (instead, the original data property is included as the data property of the
   * new IntersectionCalendar).
   */
  public clone() {
    return new IntersectionCalendar<T, S, D>({
      data: this.data,
      schedules: this.schedules.map(schedule => schedule.clone()) as S[],
    })
  }

  /**
   * Update all `schedules` of this intersection calendar to use a
   * new timezone. This mutates the intersection calendar's schedules.
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
   * Iterates over the intersection calendar's occurrences and bundles them into collections
   * with a specified granularity (default is `"INSTANTANIOUS"`). Make sure to
   * read about each option & combination of options in the `details` section
   * below.
   * 
   * Options object argument:
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
   * has no dates associated with it, so long as the `IntersectionCalendar` object still has upcoming occurrences.
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
    return new CollectionIterator(this, args)
  }

  /**
   * Iterates over the intersection calendar's occurrences and simply spits them out in order.
   * Unlike `Schedule#occurrences()`, this method may spit out duplicate dates,
   * each of which are associated with a different `Schedule`. To see what
   * `Schedule` a date is associated with, you may use `DateAdapter#schedule`.
   *
   * @param args
   */
  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, args)
  }

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  public occursOn(args: {date: T}): boolean
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * 
   * Optional arguments:
   * 
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  public occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean {
    if (args.weekday)
      return this.schedules.some(schedule => schedule.occursOn(args as {weekday: DateAdapter.Weekday}))
    else
      return super.occursOn(args as {date: T})
  }

  // `_run()` follows in the footsteps of `Calendar#_run()`,
  // except this method finds the intersection of occurrences
  // of internal schedules (rather than the union).

  /**  @private use collections() instead */
  public *_run(args: CollectionsArgs<T> = {}) {
    if (!schedulesIntersect(this.schedules, args.start, args.end)) {
      return;
    }
    
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

    getNextIntersectingDate(cache, args.reverse)

    else if (allCacheObjectsHaveEqualDates(cache)) {
      next = cache[0]
    }
    else {
      selectFarthestUpcomingCacheObj(cache[0], cache, args.reverse)
    }
  
    const count = args.take
    let index = 0
  
    while (next.date && (count === undefined || count > index)) {
      // add the current intersection calendar to the metadata
      next.date.generators.push(this)
  
      yield next.date.clone()
  
      next.date = next.iterator.next().value
  
      if (!next.date) {
        cache = cache.filter(item => item !== next)
        next = cache[0]
  
        if (cache.length === 0) { break }
      }
  
      next = selectNextUpcomingCacheObj(next, cache, args.reverse)
  
      index++
    }
  }
}

/**
 * General strategy:
 * 
 * First off, check to see if the internal schedules intersect
 * at all. If no, return void. If yes:
 * 
 * Check to see if all cache objects have equal dates.
 * 
 * #### If Yes
 * Emit that date and iterate all cache objects
 * 
 * #### If no
 * Find the cache object with the date farthest away. We then
 * know that all the other cache objects are invalid, so we tell
 * them to skip forward to the farthest date away. We then check
 * if all cache objects are equal again, and the cycle repeats.
 * Until a match is found.
 */


 /**
  * This is a WIP function. Ideally it will do a deep comparison of the rules
  * in all the given schedules to make sure they all have the possibility of
  * intersecting. At the moment though, it just checks the start / end times
  * to see if there's an obvious schedule which doesn't intersect.
  */
function schedulesIntersect<
  T extends DateAdapter<T>
>(
  schedules: IHasOccurrences<T, any>[],
  start?: T,
  end?: T
) {
  if (
    (
      start &&
      schedules.some(schedule => !!schedule.endDate && schedule.endDate.isBefore(start as T))  
    ) ||
    (
      end &&
      schedules.some(schedule => !schedule.startDate || schedule.startDate.isAfter(end as T))  
    )
  ) {
    return false
  }

  return false
}


/**
 * @param cache the cache
 */
function allCacheObjectsHaveEqualDates<T extends DateAdapter<T>>(
  cache: Array<{ iterator: IHasOccurrences<T, any>; date?: T }>,
) {
  if (cache.length === 1) { return true }

  const date = cache[0].date

  if (!date) throw new Error('unexpected `undefined` date');

  return !cache.some(obj => !date.isEqual(obj.date))
}

function getNextIntersectingDate<T extends DateAdapter<T>>(
  cache: Array<{ iterator: IHasOccurrences<T, any>; date?: T }>,
  reverse?: boolean,
): { iterator: IHasOccurrences<T, any>; date?: T } | undefined {
  if (cache.length < 2) { return cache[0] }

  const farthest = selectFarthestUpcomingCacheObj(cache, reverse)

  if (!farthest) return;

  cache.forEach(obj => {
    obj.date = obj.iterator.occurrences({
      start: farthest.date!,
      take: 1,
      reverse,
    }).toArray()![0]
  })

  cache = cache.filter(obj => !!obj.date)

  if (allCacheObjectsHaveEqualDates(cache)) {
    return cache[0]
  }
  else {
    return getNextIntersectingDate(cache, reverse)
  }
}


/**
 * 
 * @param cache the cache
 * @param reverse whether we're iterating in reverse or not
 */
function selectFarthestUpcomingCacheObj<T extends DateAdapter<T>>(
  cache: Array<{ iterator: IHasOccurrences<T, any>; date?: T }>,
  reverse?: boolean,
): { iterator: IHasOccurrences<T, any>; date?: T } | undefined {
  if (cache.length < 2) { return cache[0] }

  return cache.reduce((prev, curr) => {
    if (!curr.date) { return prev }
    else if (reverse ? curr.date.isBefore(prev.date as T) : curr.date.isAfter(prev.date as T)) { return curr }
    else { return prev }
  }, cache[0])
}

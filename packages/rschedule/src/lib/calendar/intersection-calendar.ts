import { DateAdapter } from '../date-adapter'
import {
  IHasOccurrences,
  OccurrenceIterator,
  RunnableIterator,
} from '../interfaces'
import { CollectionsArgs } from './collection'
import { Calendar } from './calendar';

const INTERSECTION_CALENDAR_ID = Symbol.for('ce7a15f5-e96a-47fd-8e13-aaee6651ec13')

/**
 * ## IntersectionCalendar
 * 
 * The constructor takes an array of schedule objects implementing the `HasOccurrences` interface
 * (e.g. `Schedule`, `Calendar`, `Rule`, `IntersectionCalendar`).
 * 
 * When iterating over `IterationCalendar#occurrences()`,
 * the iteration calendar only returns occurrences
 * which every schedule object contains. This contrasts with the regular `Calendar`
 * object, which is really a union calendar object in that it's `Calendar#occurrences()`
 * method returns any occurrance that any of it's schedule objects contain.
 * 
 * Because it's possible for an iteration calendar's internal schedules to never intersect,
 * and because the intersection calendar's current ability to detect this lack of intersection
 * is very poor, the IntersectionCalendar must be constructed with either a
 * `{maxFailedIterations: number}` argument or a `{defaultEndDate: T}` argument.
 * 
 * The `maxFailedIterations` argument caps the number of iterations `IterationCalendar#occurrences()` will
 * run through without finding a single valid occurrence. If this number is reached, the calendar will
 * stop iterating (preventing a possible infinite loop).
 * 
 * - Note: I'm going to emphasize that `maxFailedIterations` caps the number of iterations which
 *   *fail to turn up a single valid occurrence*. Every time a valid occurrence is returned,
 *   the current iteration count is reset to 0.
 * 
 * Alternatively, you can construct the calendar with a `defaultEndDate` argument. This argument
 * acts as the default `end` argument for `IterationCalendar#occurrences()` for when you call that method
 * without supplying an `end` argument (again, preventing possible infinite loops).
 * 
 * @param schedules a single object or array of objects adhering to the HasOccurrences interface
 * @param data optional data property for convenience
 * @param maxFailedIterations see above
 * @param defaultEndDate see above
 */
export class IntersectionCalendar<
  T extends DateAdapter<T>,
  S extends IHasOccurrences<T, any>,
  D = any
> extends Calendar<T, S, D>
  implements RunnableIterator<T>, IHasOccurrences<T, IntersectionCalendar<T, S, D>> {

  get startDate(): T | null {
    const date = this.occurrences({take: 1}).toArray()![0]

    return date ? date : null
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

  private maxFailedIterations?: number
  private defaultEndDate?: T

  constructor(args: {
    schedules?: Array<S> | S,
    data?: D,
    maxFailedIterations: number,
    defaultEndDate?: T,
  })
  constructor(args: {
    schedules?: Array<S> | S,
    data?: D,
    maxFailedIterations?: number,
    defaultEndDate: T,
  })
  constructor(args: {
    schedules?: Array<S> | S,
    data?: D,
    maxFailedIterations?: number,
    defaultEndDate?: T,
  }) {
    super(args)

    if (!args.maxFailedIterations && !args.defaultEndDate) {
      throw new Error(
        'IterationCalendar must be constructed with either a ' +
        '`defaultEndDate` or `maxFailedIterations` argument.'
      )
    }

    if (args.data) this.data = args.data;
    if (args.maxFailedIterations) this.maxFailedIterations = args.maxFailedIterations;
    if (args.defaultEndDate) this.defaultEndDate = args.defaultEndDate.clone();
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
      maxFailedIterations: this.maxFailedIterations!,
      defaultEndDate: this.defaultEndDate!,
    })
  }

  // `_run()` follows in the footsteps of `Calendar#_run()`,
  // except this method finds the intersection of occurrences
  // of internal schedules (rather than the union).

  /**  @private use collections() instead */
  public *_run(args: CollectionsArgs<T> = {}) {
    if (!args.end) args.end = this.defaultEndDate;

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
      
    if (cache.some(item => !item.date)) return;

    let next: { iterator: OccurrenceIterator<T, any>; date?: T } | undefined

    if (cache.length === 0) { return }

    if (allCacheObjectsHaveEqualDates(cache)) {
      // if yes, arbitrarily select the first cache object
      next = cache[0]
    }
    else {
      // if no, select the first itersecting date
      next = getNextIntersectingIterator(cache, args.reverse, this.maxFailedIterations)
    }
  
    const count = args.take
    let index = 0
  
    while (next && next.date && (count === undefined || count > index)) {
      // add the current intersection calendar to the metadata
      next.date.generators.push(this)
  
      const yieldArgs = yield next.date.clone()

      if (yieldArgs && yieldArgs.skipToDate) {
        cache.forEach(obj => {
          obj.date = obj.iterator.next(yieldArgs).value
        })
      }
      else {
        cache.forEach(obj => {
          obj.date = obj.iterator.next().value
        })
      }

      if (cache.some(item => !item.date)) return;

      if (allCacheObjectsHaveEqualDates(cache)) {
        next = cache[0]
      }
      else {
        next = getNextIntersectingIterator(cache, args.reverse, this.maxFailedIterations)
      }
  
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

  return true
}


/**
 * @param cache the cache
 */
function allCacheObjectsHaveEqualDates<T extends DateAdapter<T>>(
  cache: Array<{ iterator: OccurrenceIterator<T, any>; date?: T }>,
) {
  if (cache.length === 1) { return true }

  const date = cache[0].date

  if (!date) throw new Error('unexpected `undefined` date');

  return !cache.some(obj => !date.isEqual(obj.date))
}

function getNextIntersectingIterator<T extends DateAdapter<T>>(
  cache: Array<{ iterator: OccurrenceIterator<T, any>; date?: T }>,
  reverse?: boolean,
  maxFailedIterations?: number,
  currentIteration = 0,
): { iterator: OccurrenceIterator<T, any>; date?: T } | undefined {
  if (cache.length < 2) { return cache[0] }
  if (maxFailedIterations && currentIteration > maxFailedIterations) return;

  const farthest = selectFarthestUpcomingCacheObj(cache, reverse)

  if (!farthest) return;

  cache.forEach(obj => {
    // skip to the farthest ahead date
    obj.date = obj.iterator.next({
      skipToDate: farthest.date!,
    }).value
  })

  if (cache.some(item => !item.date)) return;

  if (allCacheObjectsHaveEqualDates(cache)) {
    return cache[0]
  }
  else {
    currentIteration++
    return getNextIntersectingIterator(cache, reverse, maxFailedIterations, currentIteration)
  }
}


/**
 * 
 * @param cache the cache
 * @param reverse whether we're iterating in reverse or not
 */
function selectFarthestUpcomingCacheObj<T extends DateAdapter<T>>(
  cache: Array<{ iterator: OccurrenceIterator<T, any>; date?: T }>,
  reverse?: boolean,
): { iterator: OccurrenceIterator<T, any>; date?: T } | undefined {
  if (cache.length < 2) { return cache[0] }

  return cache.reduce((prev, curr) => {
    if (!curr.date) { return prev }
    else if (reverse ? curr.date.isBefore(prev.date as T) : curr.date.isAfter(prev.date as T)) { return curr }
    else { return prev }
  }, cache[0])
}

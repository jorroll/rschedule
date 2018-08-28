import { DateAdapter } from '../date-adapter'
import {
  OccurrencesArgs,
  RunnableIterator,
  IHasOccurrences,
} from '../interfaces'
import { StreamsOperator, IOperator } from './interface';

/**
 * ## IntersectionOperator
 * 
 * The constructor takes an array of occurrence streams (objects implementing the
 * `HasOccurrences` interface) as well as an options object.
 * 
 * When iterating, the iteration operator only returns occurrences
 * which every stream object contains.
 * 
 * Because it's possible for all the streams to never intersect,
 * and because the intersection operator's current ability to detect this lack of intersection
 * is very poor, the IntersectionOperator must be constructed with either a
 * `{maxFailedIterations: number}` argument or a `{defaultEndDate: T}` argument.
 * 
 * The `maxFailedIterations` argument caps the number of iterations `IterationOperator#_run()` will
 * run through without finding a single valid occurrence. If this number is reached, the operator will
 * stop iterating (preventing a possible infinite loop).
 * 
 * - Note: I'm going to emphasize that `maxFailedIterations` caps the number of iterations which
 *   *fail to turn up a single valid occurrence*. Every time a valid occurrence is returned,
 *   the current iteration count is reset to 0.
 * 
 * Alternatively, you can construct the operator with a `defaultEndDate` argument. This argument
 * acts as the default `end` argument for `IterationOperator#_run()` for when you call that method
 * without supplying an `end` argument (again, preventing possible infinite loops).
 * 
 * @param streams An array of objects adhering to the HasOccurrences interface
 * @param maxFailedIterations see above
 * @param defaultEndDate see above
 */
export class IntersectionOperator<T extends DateAdapter<T>> extends StreamsOperator<T, IntersectionOperator<T>> implements IOperator<T> {

  constructor(
    streams: IHasOccurrences<T, any>[],
    options: {defaultEndDate: T, maxFailedIterations?: number},
  )
  constructor(
    streams: IHasOccurrences<T, any>[],
    options: {defaultEndDate?: T, maxFailedIterations: number},
  )
  constructor(
    protected streams: IHasOccurrences<T, any>[],
    private options: {defaultEndDate?: T, maxFailedIterations?: number},
  ) {
    super(streams)

    if (options.defaultEndDate) options.defaultEndDate = options.defaultEndDate.clone();
  }

  clone() {
    return new IntersectionOperator(
      this.streams.map(stream => stream.clone()),
      {...this.options} as any
    )
  }

  *_run(args: OccurrencesArgs<T> = {}) {
    if (!args.end) args.end = this.options.defaultEndDate;

    if (!schedulesIntersect(this.streams, args.start, args.end)) {
      return;
    }
    
    let cache = this.streams
      .map(stream => {
        const iterator = stream._run(args)
        return {
          iterator,
          date: iterator.next().value as T | undefined,
        }
      })
      
    if (cache.some(item => !item.date)) return;

    let next: { iterator: IterableIterator<T>; date?: T } | undefined

    if (cache.length === 0) { return }

    if (allCacheObjectsHaveEqualDates(cache)) {
      // if yes, arbitrarily select the first cache object
      next = cache[0]
    }
    else {
      // if no, select the first itersecting date
      next = getNextIntersectingIterator(cache, args.reverse, this.options.maxFailedIterations)
    }
    
    while (next && next.date) {  
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
        next = getNextIntersectingIterator(cache, args.reverse, this.options.maxFailedIterations)
      }  
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
  schedules: RunnableIterator<T>[],
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
  cache: Array<{ iterator: IterableIterator<T>; date?: T }>,
) {
  if (cache.length === 1) { return true }

  const date = cache[0].date

  if (!date) throw new Error('unexpected `undefined` date');

  return !cache.some(obj => !date.isEqual(obj.date))
}

function getNextIntersectingIterator<T extends DateAdapter<T>>(
  cache: Array<{ iterator: IterableIterator<T>; date?: T }>,
  reverse?: boolean,
  maxFailedIterations?: number,
  currentIteration = 0,
): { iterator: IterableIterator<T>; date?: T } | undefined {
  if (cache.length < 2) { return cache[0] }
  if (maxFailedIterations && currentIteration > maxFailedIterations) return;

  const farthest = selectFarthestUpcomingCacheObj(cache, reverse)

  if (!farthest) return;

  cache.forEach(obj => {
    if (
      reverse
      ? obj.date!.isBeforeOrEqual(farthest.date as T)
      : obj.date!.isAfterOrEqual(farthest.date as T)
    ) {
      return;
    }
    // skip to the farthest ahead date
    obj.date = obj.iterator.next({
      skipToDate: farthest.date,
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
  cache: Array<{ iterator: IterableIterator<T>; date?: T }>,
  reverse?: boolean,
): { iterator: IterableIterator<T>; date?: T } | undefined {
  if (cache.length < 2) { return cache[0] }

  return cache.reduce((prev, curr) => {
    if (!curr.date) { return prev }
    else if (reverse ? curr.date.isBefore(prev.date as T) : curr.date.isAfter(prev.date as T)) { return curr }
    else { return prev }
  }, cache[0])
}

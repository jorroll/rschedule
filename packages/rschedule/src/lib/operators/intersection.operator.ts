import { DateAdapter, DateAdapterConstructor } from '../date-adapter'
import { RunArgs } from '../interfaces'
import { OperatorInput, OperatorOutput } from './interface';

/**
 * An operator function, intended as an argument for
 * `buildIterator()`, which takes a spread of occurrence streams and only
 * returns the dates which intersect every occurrence stream.
 * 
 * Because it's possible for all the streams to never intersect,
 * and because the intersection operator can't detect this lack of intersection,
 * the IntersectionOperator must be constructed with either a
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
 * @param options On object containing the defaultEndDate and/or maxFailedIterations args
 * @param inputs a spread of occurrence streams
 */

export function intersection<T extends DateAdapterConstructor>(
  options: {defaultEndDate: DateAdapter<T>, maxFailedIterations?: number},
  ...inputs: OperatorInput<T>[]
): OperatorOutput<T>

export function intersection<T extends DateAdapterConstructor>(
  options: {defaultEndDate?: DateAdapter<T>, maxFailedIterations: number},
  ...inputs: OperatorInput<T>[]
): OperatorOutput<T>

export function intersection<T extends DateAdapterConstructor>(
  options: {defaultEndDate?: DateAdapter<T>, maxFailedIterations?: number},
  ...inputs: OperatorInput<T>[]
): OperatorOutput<T> {

  return (base?: IterableIterator<DateAdapter<T>>, baseIsInfinite?: boolean) => {

    return {
      get isInfinite() {
        if (baseIsInfinite === false) return false;

        return !inputs.some(input => !input.isInfinite)
      },

      setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}) {
        inputs.forEach(input => input.setTimezone(timezone, options))
      },

      clone() {
        return intersection(
          {
            defaultEndDate: options.defaultEndDate && options.defaultEndDate.clone(),
            maxFailedIterations: options.maxFailedIterations!
          },
          ...inputs.map(input => input.clone())
        )(base, baseIsInfinite)
      },

      *_run(args: RunArgs<T>={}): IterableIterator<DateAdapter<T>> {      
        if (!args.end) args.end = options.defaultEndDate;

        const streams = inputs.map(input => input._run(args));

        if (base) streams.push(base);
        
        let cache = streams
          .map(iterator => ({
            iterator,
            date: iterator.next().value as DateAdapter<T> | undefined,
          }))
          
        if (cache.some(item => !item.date)) return;

        let next: { iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> } | undefined

        if (cache.length === 0) { return }

        if (allCacheObjectsHaveEqualDates(cache)) {
          // if yes, arbitrarily select the first cache object
          next = cache[0]
        }
        else {
          // if no, select the first itersecting date
          next = getNextIntersectingIterator(cache, args.reverse, options.maxFailedIterations)
        }
        
        while (next && next.date) {  
          const yieldArgs = yield next.date.clone() as DateAdapter<T>

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
            next = getNextIntersectingIterator(cache, args.reverse, options.maxFailedIterations)
          }
        }
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
 * @param cache the cache
 */
function allCacheObjectsHaveEqualDates<T extends DateAdapterConstructor>(
  cache: Array<{ iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> }>,
) {
  if (cache.length === 1) { return true }

  const date = cache[0].date

  if (!date) throw new Error('unexpected `undefined` date');

  return !cache.some(obj => !date.isEqual(obj.date))
}

function getNextIntersectingIterator<T extends DateAdapterConstructor>(
  cache: Array<{ iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> }>,
  reverse?: boolean,
  maxFailedIterations?: number,
  currentIteration = 0,
): { iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> } | undefined {
  if (cache.length < 2) { return cache[0] }
  if (maxFailedIterations && currentIteration > maxFailedIterations) return;

  const farthest = selectFarthestUpcomingCacheObj(cache, reverse)

  if (!farthest) return;

  cache.forEach(obj => {
    if (
      reverse
      ? obj.date!.isBeforeOrEqual(farthest.date!)
      : obj.date!.isAfterOrEqual(farthest.date!)
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
function selectFarthestUpcomingCacheObj<T extends DateAdapterConstructor>(
  cache: Array<{ iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> }>,
  reverse?: boolean,
): { iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> } | undefined {
  if (cache.length < 2) { return cache[0] }

  return cache.reduce((prev, curr) => {
    if (!curr.date) { return prev }
    else if (reverse ? curr.date.isBefore(prev.date!) : curr.date.isAfter(prev.date!)) { return curr }
    else { return prev }
  }, cache[0])
}

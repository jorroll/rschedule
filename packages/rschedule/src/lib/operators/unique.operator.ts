import { DateAdapter } from '../date-adapter'
import { OperatorOutput } from './interface';

/**
 * An operator function, intended as an argument for `buildIterator()`,
 * which combines the input occurrence streams, if any, with the previous occurrence stream
 * in the `buildIterator()` pipe and removes any duplicate dates from the stream.
 * 
 * @param inputs a spread of scheduling objects
 */
export function unique<T extends DateAdapter<T>>(): OperatorOutput<T> {
  return (base?: IterableIterator<T>, baseIsInfinite?: boolean) => {
    return {
      get isInfinite() { return !!baseIsInfinite },

      setTimezone() {},

      clone() {
        return unique()(base, baseIsInfinite)
      },

      *_run() {
        let iterable: IterableIterator<T>
        
        if (base) {
          iterable = base
        }
        else {
          return
        }
        
        const firstDate = iterable.next().value as T | undefined

        if (!firstDate) return;

        const cache = {
          iterator: iterable,
          date: firstDate,
          mostRecentlyYieldedDate: firstDate.clone(),
        }

        // iterate over the cache objects until we run out of dates or hit our max count
        while (cache.date) {
          const yieldArgs = yield cache.date.clone()

          cache.mostRecentlyYieldedDate = cache.date.clone()

          cache.date = cache.iterator.next(yieldArgs).value

          if (!iterateCacheToNextUniqueDate(cache)) return;
        }
      }
    }
  }
}

/**
 * Mutates the cache object by iterating its date until a new (unyielded) one is found.
 * Returns a boolean indicating if there are any more valid dates.
 */
function iterateCacheToNextUniqueDate<T extends DateAdapter<T>>(
  cache: { iterator: IterableIterator<T>; date?: T, mostRecentlyYieldedDate: T }
): boolean {
  if (!cache.date) return false;

  if (cache.date.isEqual(cache.mostRecentlyYieldedDate)) {
    cache.date = cache.iterator.next().value

    return iterateCacheToNextUniqueDate(cache)
  }

  return true
}

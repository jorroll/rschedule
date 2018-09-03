import { DateAdapter, DateAdapterConstructor } from '../date-adapter'
import { OperatorOutput, OperatorOutputOptions } from './interface';

/**
 * An operator function, intended as an argument for `occurrenceStream()`,
 * which combines the input occurrence streams, if any, with the previous occurrence stream
 * in the `occurrenceStream()` pipe and removes any duplicate dates from the stream.
 * 
 * @param inputs a spread of scheduling objects
 */
export function unique<T extends DateAdapterConstructor>(): OperatorOutput<T> {
  return (options: OperatorOutputOptions<T>) => {
    return {
      get isInfinite() { return !!options.baseIsInfinite },

      setTimezone() {},

      clone() {
        return unique()(options)
      },

      *_run(): IterableIterator<DateAdapter<T>> {
        let iterable: IterableIterator<DateAdapter<T>>
        
        if (options.base) {
          iterable = options.base
        }
        else {
          return
        }
        
        const firstDate = iterable.next().value as DateAdapter<T> | undefined

        if (!firstDate) return;

        const cache = {
          iterator: iterable,
          date: firstDate,
          mostRecentlyYieldedDate: firstDate.clone() as DateAdapter<T>,
        }

        // iterate over the cache objects until we run out of dates or hit our max count
        while (cache.date) {
          const yieldArgs = yield cache.date.clone() as DateAdapter<T>

          cache.mostRecentlyYieldedDate = cache.date.clone() as DateAdapter<T>

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
function iterateCacheToNextUniqueDate<T extends DateAdapterConstructor>(
  cache: { iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T>, mostRecentlyYieldedDate: DateAdapter<T> }
): boolean {
  if (!cache.date) return false;

  if (cache.date.isEqual(cache.mostRecentlyYieldedDate)) {
    cache.date = cache.iterator.next().value

    return iterateCacheToNextUniqueDate(cache)
  }

  return true
}

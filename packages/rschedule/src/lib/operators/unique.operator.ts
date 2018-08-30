import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs } from '../interfaces'
import { OperatorInput, OperatorOutput } from './interface';
import { add } from './add.operator';

/**
 * An operator function, intended as an argument for `buildIterator()`,
 * which combines the input occurrence streams, if any, with the previous occurrence stream
 * in the `buildIterator()` pipe and removes any duplicate dates from the stream.
 * 
 * @param inputs a spread of scheduling objects
 */
export function unique<T extends DateAdapter<T>>(...inputs: OperatorInput<T>[]): OperatorOutput<T> {
  return (base?: IterableIterator<T>) => {
    return {
      get isInfinite() { return inputs.some(input => input.isInfinite) },

      setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}) {
        inputs.forEach(input => input.setTimezone(timezone, options))
      },

      clone() {
        return unique(...inputs.map(input => input.clone()))(base)
      },

      *_run(args: OccurrencesArgs<T>={}) {
        let iterable: IterableIterator<T>
        
        if (base && inputs.length === 0) {
          iterable = base
        }
        else if (inputs.length > 0) {
          iterable = add(...inputs)(base)._run(args)
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

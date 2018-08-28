import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs } from '../interfaces'
import { IOperator, StreamOperator } from './interface';

export class UniqueOperator<T extends DateAdapter<T>> extends StreamOperator<T> implements IOperator<T> {

  *_run(args: OccurrencesArgs<T> = {}) {
    const iterable = this.stream._run(args)

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

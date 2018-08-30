import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs } from '../interfaces'
import { OperatorOutput, OperatorInput } from './interface';

/**
 * An operator function, intended as an argument for
 * `buildIterator()`, which gets the union of the previous
 * schedule's occurrences in the `buildIterator` pipe as well as the occurrences
 * of any input arguments.
 * 
 * @param inputs a spread of scheduling objects
 */
export function add<T extends DateAdapter<T>>(...inputs: OperatorInput<T>[]): OperatorOutput<T> {

  return (base?: IterableIterator<T>) => {

    return {
      get isInfinite() { return inputs.some(input => input.isInfinite) },

      setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}) {
        inputs.forEach(input => input.setTimezone(timezone, options))
      },

      clone() {
        return add(...inputs.map(input => input.clone()))(base)
      },

      *_run(args: OccurrencesArgs<T>={}) {
        const streams = inputs.map(input => input._run(args))

        if (base) streams.push(base);

        let cache = streams
          .map(iterator => {
            return {
              iterator,
              date: iterator.next().value as T | undefined,
            }
          })
          .filter(item => !!item.date)

        if (cache.length === 0) { return }

        let next = selectNextUpcomingCacheObj(cache[0], cache, args.reverse)
        
        while (next.date) {
          const yieldArgs = yield next.date.clone()

          if (yieldArgs && yieldArgs.skipToDate) {
            cache.forEach(obj => {
              obj.date = obj.iterator.next(yieldArgs).value
            })

            cache = cache.filter(obj => !!obj.date)

            if (cache.length === 0) return;

            next = selectNextUpcomingCacheObj(cache[0], cache, args.reverse)  
          }
          else {
            next.date = next.iterator.next().value
      
            if (!next.date) {
              cache = cache.filter(item => item !== next)
              next = cache[0]
        
              if (cache.length === 0) { break }
            }
        
            next = selectNextUpcomingCacheObj(next, cache, args.reverse)  
          }
        }
      }
    }
  }
}

function selectNextUpcomingCacheObj<T extends DateAdapter<T>>(
  current: { iterator: IterableIterator<T>; date?: T },
  cache: Array<{ iterator: IterableIterator<T>; date?: T }>,
  reverse?: boolean,
) {
  if (cache.length === 1) { return cache[0] }

  return cache.reduce((prev, curr) => {
    if (!curr.date) { return prev }
    else if (reverse ? curr.date.isAfter(prev.date as T) : curr.date.isBefore(prev.date as T)) { return curr }
    else { return prev }
  }, current)
}

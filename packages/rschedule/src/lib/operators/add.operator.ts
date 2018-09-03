import { DateAdapter, DateAdapterConstructor } from '../date-adapter'
import { RunArgs } from '../interfaces'
import { OperatorOutput, OperatorInput, OperatorOutputOptions } from './interface';

/**
 * An operator function, intended as an argument for
 * `occurrenceStream()`, which gets the union of the previous
 * schedule's occurrences in the `occurrenceStream` pipe as well as the occurrences
 * of any input arguments.
 * 
 * @param inputs a spread of scheduling objects
 */
export function add<T extends DateAdapterConstructor>(...inputs: OperatorInput<T>[]): OperatorOutput<T> {

  return (options: OperatorOutputOptions<T>) => {

    return {
      get isInfinite() { return inputs.some(input => input.isInfinite) },

      setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}) {
        inputs.forEach(input => input.setTimezone(timezone, options))
      },

      clone() {
        return add(...inputs.map(input => input.clone()))(options)
      },

      *_run(args: RunArgs<T>={}): IterableIterator<DateAdapter<T>> {
        const streams = inputs.map(input => input._run(args))

        if (options.base) streams.push(options.base);

        let cache = streams
          .map(iterator => {
            return {
              iterator,
              date: iterator.next().value,
            }
          })
          .filter(item => !!item.date)

        if (cache.length === 0) { return }

        let next = selectNextUpcomingCacheObj(cache[0], cache, args.reverse)
        
        while (next.date) {
          const yieldArgs = yield next.date.clone() as DateAdapter<T>

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

function selectNextUpcomingCacheObj<T extends DateAdapterConstructor>(
  current: { iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> },
  cache: Array<{ iterator: IterableIterator<DateAdapter<T>>; date?: DateAdapter<T> }>,
  reverse?: boolean,
) {
  if (cache.length === 1) { return cache[0] }

  return cache.reduce((prev, curr) => {
    if (!curr.date) { return prev }
    else if (reverse ? curr.date.isAfter(prev.date!) : curr.date.isBefore(prev.date!)) { return curr }
    else { return prev }
  }, current)
}

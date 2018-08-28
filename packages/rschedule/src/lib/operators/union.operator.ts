import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs } from '../interfaces'
import { StreamsOperator, IOperator } from './interface';
import { Utils } from '../utilities';

export class UnionOperator<T extends DateAdapter<T>> extends StreamsOperator<T> implements IOperator<T> {

  get startDate() {
    return Utils.getEarliestDate(
      this.streams
      .map(stream => stream.startDate)
      .filter(date => !!date) as T[]
    )
  }

  *_run(args: OccurrencesArgs<T> = {}) {
    let cache = this.streams
      .map(stream => {
        const iterator = stream._run(args)
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

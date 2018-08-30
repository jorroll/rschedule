import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs } from '../interfaces'
import { OperatorInput, OperatorOutput } from './interface';
import { add } from './add.operator'

/**
 * An operator function, intended as an argument for
 * `buildIterator()`, which excludes the occurrences of input arguments from the
 * occurrences of the previous schedule's occurrences in the `buildIterator` pipe.
 * 
 * @param inputs a spread of scheduling objects
 */
export function subtract<T extends DateAdapter<T>>(...inputs: OperatorInput<T>[]): OperatorOutput<T> {

  return (base?: IterableIterator<T>) => {
    return {
      get isInfinite() { return inputs.some(input => input.isInfinite) },

      setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}) {
        inputs.forEach(input => input.setTimezone(timezone, options))
      },

      clone() {
        return subtract(...inputs.map(input => input.clone()))(base)
      },

      *_run(args: OccurrencesArgs<T>={}) {
        if (!base) return;
        
        const forInclusion = base
        const forExclusion = add(...inputs)()._run(args)

        let positiveCache = {
          iterator: forInclusion,
          date: forInclusion.next().value as T | undefined,
        }

        if (!positiveCache.date) return;

        let negativeCache = {
          iterator: forExclusion,
          date: forExclusion.next().value as T | undefined,
        }
      
        let date = selectValidDate(positiveCache, negativeCache, args.reverse)
      
        while (date) {  
          const yieldArgs = yield date.clone()

          positiveCache.date = positiveCache.iterator.next(yieldArgs).value

          date = selectValidDate(positiveCache, negativeCache, args.reverse)    
        }
      }
    }
  }
}

function selectValidDate<T extends DateAdapter<T>>(
  positiveCache: { iterator: IterableIterator<T>, date?: T},
  negativeCache: { iterator: IterableIterator<T>, date?: T},
  reverse?: boolean,
): T | undefined {
  if (!positiveCache.date) return;

  if (!negativeCache.date) return positiveCache.date;

  if (
    reverse
    ? negativeCache.date.isAfter(positiveCache.date)
    : negativeCache.date.isBefore(positiveCache.date)
  ) {
    negativeCache.date =
      negativeCache.iterator.next({skipToDate: positiveCache.date}).value;

    if (!negativeCache.date) return positiveCache.date;
  }

  if (negativeCache.date.isEqual(positiveCache.date)) {
    positiveCache.date = 
      positiveCache.iterator.next().value;
    
    return selectValidDate(positiveCache, negativeCache, reverse);
  }

  return positiveCache.date;
}
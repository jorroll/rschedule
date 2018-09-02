import { DateAdapter, DateAdapterConstructor } from '../date-adapter'
import { RunArgs } from '../interfaces'
import { OperatorInput, OperatorOutput } from './interface';
import { add } from './add.operator'

/**
 * An operator function, intended as an argument for
 * `buildIterator()`, which excludes the occurrences of input arguments from the
 * occurrences of the previous schedule's occurrences in the `buildIterator` pipe.
 * 
 * @param inputs a spread of scheduling objects
 */
export function subtract<T extends DateAdapterConstructor>(...inputs: OperatorInput<T>[]): OperatorOutput<T> {

  return (base?: IterableIterator<DateAdapter<T>>) => {
    return {
      get isInfinite() { return inputs.some(input => input.isInfinite) },

      setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}) {
        inputs.forEach(input => input.setTimezone(timezone, options))
      },

      clone() {
        return subtract(...inputs.map(input => input.clone()))(base)
      },

      *_run(args: RunArgs<T>={}): IterableIterator<DateAdapter<T>> {
        if (!base) return;
        
        const forInclusion = base
        const forExclusion = add(...inputs)()._run(args)

        let positiveCache = {
          iterator: forInclusion,
          date: forInclusion.next().value as DateAdapter<T> | undefined,
        }

        if (!positiveCache.date) return;

        let negativeCache = {
          iterator: forExclusion,
          date: forExclusion.next().value as DateAdapter<T> | undefined,
        }
      
        let date = selectValidDate(positiveCache, negativeCache, args.reverse)
      
        while (date) {  
          const yieldArgs = yield date.clone() as DateAdapter<T>

          positiveCache.date = positiveCache.iterator.next(yieldArgs).value

          date = selectValidDate(positiveCache, negativeCache, args.reverse)    
        }
      }
    }
  }
}

function selectValidDate<T extends DateAdapterConstructor>(
  positiveCache: { iterator: IterableIterator<DateAdapter<T>>, date?: DateAdapter<T>},
  negativeCache: { iterator: IterableIterator<DateAdapter<T>>, date?: DateAdapter<T>},
  reverse?: boolean,
): DateAdapter<T> | undefined {
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
import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs, IHasOccurrences } from '../interfaces'
import { IOperator, StreamOperator } from './interface';

export class ExcludeOperator<T extends DateAdapter<T>> extends StreamOperator<T, ExcludeOperator<T>> implements IOperator<T> {

  // to make sure this stays in sync with StreamOperator ancestor
  protected get stream() { return this.include }

  /**
   * @param exclude The stream containing dates you wish to exclude.
   * @param include The stream containing dates you wish to include.
   */
  constructor(
    protected exclude: IHasOccurrences<T, any>,
    protected include: IHasOccurrences<T, any>,
  ) { super(include) }

  clone() {
    return new ExcludeOperator(this.exclude.clone(), this.include.clone())
  }

  *_run(args: OccurrencesArgs<T> = {}) {
    const positiveIterator = this.include._run(args)
    const negativeIterator = this.exclude._run(args)

    let positiveCache = {
      iterator: positiveIterator,
      date: positiveIterator.next().value as T | undefined,
    }

    if (!positiveCache.date) return;

    let negativeCache = {
      iterator: negativeIterator,
      date: negativeIterator.next().value as T | undefined,
    }
  
    let date = selectValidDate(positiveCache, negativeCache, args.reverse)
  
    while (date) {  
      const yieldArgs = yield date.clone()

      positiveCache.date = positiveCache.iterator.next(yieldArgs).value

      date = selectValidDate(positiveCache, negativeCache, args.reverse)    
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
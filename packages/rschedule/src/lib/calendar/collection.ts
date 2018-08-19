import { DateAdapter } from '../date-adapter'
import { RunnableIterator, OccurrencesArgs } from '../interfaces'
import { Options } from '../rule'
import { Utils } from '../utilities'

export class Collection<T extends DateAdapter<T>> {
  constructor(
    public readonly dates: T[] = [],
    public readonly granularity: 'INSTANTANIOUSLY' | Options.Frequency,
    public readonly periodStart: T,
    public readonly periodEnd: T
  ) {}
}

export type CollectionsGranularity = 'INSTANTANIOUSLY' | Options.Frequency

export interface CollectionsArgs<T extends DateAdapter<T>> extends OccurrencesArgs<T> {
  granularity?: CollectionsGranularity
  weekStart?: DateAdapter.Weekday
}

export class CollectionIterator<
  T extends DateAdapter<T>,
  K extends RunnableIterator<T>
> {
  public readonly granularity: CollectionsGranularity = 'INSTANTANIOUSLY'
  public readonly weekStart?: DateAdapter.Weekday
  public readonly startDate: T | null
  private iterator: IterableIterator<T>

  constructor(private iterable: K, private args: CollectionsArgs<T>) {
    this.args = args.start
      ? { ...args, start: this.getPeriodStart(args.start) }
      : args;

    this.args = args.end
      ? { ...args, end: this.processEndArg(args.end) }
      : args;

    ;[this.iterator, this.startDate] = this.getIterator(iterable, this.args)

    if (args.granularity) { this.granularity = args.granularity }
    if (args.weekStart) { this.weekStart = args.weekStart }
    if (args.reverse) {
      throw new Error(
        'Calendar does not currently support iterating collections in reverse. ' +
        "Though you can iterate a calendar's occurrences in reverse."
      )
    }
  }

  public [Symbol.iterator] = () => this.iterateCollection(this.iterator);

  public *iterateCollection(iterator: IterableIterator<T>) {
    if (!this.startDate) { return }

    let date = iterator.next().value

    if (!date) { return }

    let periodStart = this.getPeriodStart(date)
    let periodEnd = this.getPeriodEnd(periodStart)

    let dates: T[] = []
    let index = 0

    while (date && (this.args.take === undefined || this.args.take > index)) {
      while (date && date.isBeforeOrEqual(periodEnd)) {
        dates.push(date)

        date = iterator.next().value
      }

      yield new Collection(
        dates,
        this.granularity,
        periodStart.clone(),
        periodEnd.clone()
      )

      if (!date) { return }

      dates = []
      periodStart = this.getPeriodStart(date)
      periodEnd = this.getPeriodEnd(periodStart)
      index++
    }
  }

  public next() {
    return this.iterateCollection(this.iterator).next()
  }

  /**
   * While `next()` and `[Symbol.iterator]` both share state,
   * `toArray()` does not share state and always returns the whole
   * collections array (or `undefined`, in the case of collection of
   * infinite length)
   */
  public toArray() {
    if (!this.args.end && !this.args.take && this.iterable.isInfinite) {
      return undefined
    }
    else {
      const collections: Array<Collection<T>> = []

      const [iterator] = this.getIterator(this.iterable, this.args)

      for (const collection of this.iterateCollection(iterator)) {
        collections.push(collection)
      }

      return collections
    }
  }

  private getPeriodStart(date: T) {
    date = date.clone()

    switch (this.granularity) {
      case 'YEARLY':
        date.set('month', 1).set('day', 1)
        break
      case 'MONTHLY':
        if (this.weekStart)
          Utils.setDateToStartOfWeek(date.set('day', 1), this.weekStart);
        else
          date.set('day', 1);
        break
      case 'WEEKLY':
        if (!this.weekStart) {
          throw new Error('"WEEKLY" granularity requires `weekStart` arg')
        }
        Utils.setDateToStartOfWeek(date, this.weekStart)
        break
    }

    switch (this.granularity) {
      case 'YEARLY':
      case 'MONTHLY':
      case 'WEEKLY':
      case 'DAILY':
        date.set('hour', 0)
      case 'HOURLY':
        date.set('minute', 0)
      case 'MINUTELY':
        date.set('second', 0)
      case 'SECONDLY':
        date.set('millisecond', 0)
      case 'INSTANTANIOUSLY':
      default:
        return date
    }
  }

  private getPeriodEnd(start: T) {
    const periodEnd = start.clone()

    switch (this.granularity) {
      case 'YEARLY':
        return periodEnd.add(1, 'year').subtract(1, 'millisecond')
      case 'MONTHLY':
        periodEnd.add(1, 'month').subtract(1, 'millisecond')
        
        if (this.weekStart) Utils.setDateToEndOfWeek(periodEnd, this.weekStart);
  
        return periodEnd
      case 'WEEKLY':
        return periodEnd.add(7, 'day').subtract(1, 'millisecond')
      case 'DAILY':
        return periodEnd.add(1, 'day').subtract(1, 'millisecond')
      case 'HOURLY':
        return periodEnd.add(1, 'hour').subtract(1, 'millisecond')
      case 'MINUTELY':
        return periodEnd.add(1, 'minute').subtract(1, 'millisecond')
      case 'SECONDLY':
        return periodEnd.add(1, 'second').subtract(1, 'millisecond')
      case 'INSTANTANIOUSLY':
      default:
        return periodEnd
    }
  }

  private processEndArg(arg: T) {
    const end = arg.clone()

    switch (this.granularity) {
      case 'YEARLY':
        Utils.setDateToEndOfYear(end)
        break
      case 'MONTHLY':
        Utils.setDateToEndOfMonth(end)
        
        if (this.weekStart) Utils.setDateToEndOfWeek(end, this.weekStart);

        break
      case 'WEEKLY':
        if (!this.weekStart) {
          throw new Error('"WEEKLY" granularity requires `weekStart` arg')
        }

        Utils.setDateToEndOfWeek(end, this.weekStart)
        break
    }

    switch (this.granularity) {
      case 'YEARLY':
      case 'MONTHLY':
      case 'WEEKLY':
      case 'DAILY':
        end.set('hour', 23)
      case 'HOURLY':
        end.set('minute', 59)
      case 'MINUTELY':
        end.set('second', 59)
      case 'SECONDLY':
        end.set('millisecond', 999)
      case 'INSTANTANIOUSLY':
      default:
        return end
    }
  }

  private getIterator(
    iterable: K,
    args: CollectionsArgs<T>
  ): [IterableIterator<T>, T] | [IterableIterator<T>, null] {
    let start = args.start || iterable.startDate

    if (!start) { return [iterable._run(args), null] }

    start = this.getPeriodStart(start)

    return [
      iterable._run({
        start,
        end: args.end,
      }),
      start,
    ] as [IterableIterator<T>, T]
  }
}

import { DateAdapter } from '../date-adapter'
import { RunnableIterator } from '../interfaces'
import { Options } from '../rule'
import { Utils } from '../utilities'

export class Collection<T extends DateAdapter<T>> {
  constructor(
    public readonly dates: T[] = [],
    public readonly period: 'INSTANTANIOUSLY' | Options.Frequency,
    public readonly periodStart: T,
    public readonly periodEnd: T
  ) {}
}

export type CollectionsGranularity = 'INSTANTANIOUSLY' | Options.Frequency

export interface CollectionsArgs<T extends DateAdapter<T>> {
  start?: T
  end?: T
  take?: number
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
    ;[this.iterator, this.startDate] = this.getIterator(iterable, args)

    if (args.granularity) { this.granularity = args.granularity }
    if (args.weekStart) { this.weekStart = args.weekStart }
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
        return date.set('month', 1).set('day', 1)
      case 'MONTHLY':
        return date.set('day', 1)
      case 'WEEKLY':
        if (!this.weekStart) {
          throw new Error('"WEEKLY" granularity requires `weekStart` arg')
        }
        const differenceFromWeekStart = Utils.weekdayToInt(
          date.get('weekday'),
          this.weekStart
        )
        date.subtract(differenceFromWeekStart, 'day')
      case 'DAILY':
        return date
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .set('millisecond', 0)
      case 'HOURLY':
        return date
          .set('minute', 0)
          .set('second', 0)
          .set('millisecond', 0)
      case 'MINUTELY':
        return date.set('second', 0).set('millisecond', 0)
      case 'SECONDLY':
        return date.set('millisecond', 0)
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
        return periodEnd.add(1, 'month').subtract(1, 'millisecond')
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

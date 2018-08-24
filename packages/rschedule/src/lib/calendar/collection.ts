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
  incrementLinearly?: boolean
}

export class CollectionIterator<
  T extends DateAdapter<T>,
  K extends RunnableIterator<T>
> {
  public readonly granularity: CollectionsGranularity = 'INSTANTANIOUSLY'
  public readonly weekStart?: DateAdapter.Weekday
  public readonly startDate: T | null
  
  private iterator: IterableIterator<Collection<T>>
  private args: CollectionsArgs<T>

  constructor(private iterable: K, args: CollectionsArgs<T>) {
    if (args.granularity) { this.granularity = args.granularity }
    if (args.weekStart) { this.weekStart = args.weekStart }
    if (args.reverse) {
      throw new Error(
        '`Calendar#collections()` does not currently support iterating in reverse. ' +
        "Though `Calendar#occurrences()` does support iterating in reverse."
      )
    }

    // Set the end arg, if present, to the end of the period.
    this.args = {
      ...args,
      end: args.end && this.getPeriodEnd(
        this.getPeriodStart(args.end, {getRealMonthIfApplicable: true})
      )
    };

    const start = args.start || iterable.startDate

    this.startDate = start && this.getPeriodStart(start)

    this.iterator = this.getCollectionIterator()
  }

  public [Symbol.iterator] = () => this.iterator;

  public next() { return this.iterator.next() }

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

      for (const collection of this.getCollectionIterator()) {
        collections.push(collection)
      }

      return collections
    }
  }

  private *getCollectionIterator() {
    if (!this.startDate) { return }

    let iterator = this.getOccurrenceIterator(this.iterable, this.args)

    let date = iterator.next().value

    if (!date) { return }

    // `period` === `periodStart` unless the granularity
    // is `MONTHLY` and a `weekStart` param was provided. In this case,
    // period holds a date === the first of the current month while 
    // periodStart holds a date === the beginning of the first week of the month
    // (which might be in the the previous month). Read the 
    // `Calendar#collections()` description for more info.
    let [
      periodStart,
      periodEnd,
      period
    ] = this.getPeriod(
      (this.args.start || this.iterable.startDate)!
    )

    // without this, a MONTHLY `granularity` with `weekStart` might think the first
    // period is the month before the given `start` date.
    if (!this.args.incrementLinearly && date.isAfter(periodEnd)) {
      [
        periodStart,
        periodEnd,
        period
      ] = this.getPeriod(date);
    }

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

      dates = [];

      [
        periodStart,
        periodEnd,
        period
      ] = this.args.incrementLinearly
        ? this.getPeriod(this.incrementPeriod(period))
        : this.getPeriod(date);

      // With these args, periods may overlap and the same date may show up
      // in two periods. Because of this, we need to reset the iterable
      // (otherwise it won't spit out a date it has already spit out).
      if (this.granularity === 'MONTHLY' && this.weekStart) {
        iterator = this.iterable._run({
          start: periodStart,
          end: this.args.end,
        })

        date = iterator.next().value
      }
      
      index++
    }
  }

  private getPeriod(date: T) {
    date = this.getPeriodStart(date, {getRealMonthIfApplicable: true})

    return [
      this.getPeriodStart(date), 
      this.getPeriodEnd(date), 
      date 
    ]
  }

  private getPeriodStart(date: T, option: {getRealMonthIfApplicable?: boolean} = {}) {
    date = date.clone()

    switch (this.granularity) {
      case 'YEARLY':
        date.set('month', 1).set('day', 1)
        break
      case 'MONTHLY':
        if (this.weekStart && !option.getRealMonthIfApplicable)
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

  private incrementPeriod(date: T) {
    date = date.clone()

    switch (this.granularity) {
      case 'YEARLY':
        return date.add(1, 'year')
      case 'MONTHLY':
        return date.add(1, 'month')
      case 'WEEKLY':
        return date.add(1, 'week')
      case 'DAILY':
        return date.add(1, 'day')
      case 'HOURLY':
        return date.add(1, 'hour')
      case 'MINUTELY':
        return date.add(1, 'minute')
      case 'SECONDLY':
        return date.add(1, 'second')
      case 'INSTANTANIOUSLY':
      default:
        return date.add(1, 'millisecond')
    }
  }

  private getOccurrenceIterator(
    iterable: K,
    args: CollectionsArgs<T>
  ): IterableIterator<T> {
    let start = args.start || iterable.startDate

    if (!start) { return iterable._run(args) }

    start = this.getPeriodStart(start)

    return iterable._run({
      start,
      end: args.end,
    })
  }
}

import { DateAdapter } from '../date-adapter'
import { RunnableIterator, IHasOccurrences, OccurrenceIterator, OccurrencesArgs } from '../interfaces'

export interface IOperator<T extends DateAdapter<T>> extends IHasOccurrences<T, IOperator<T>> {}

abstract class Operator<T extends DateAdapter<T>, K extends RunnableIterator<T>> {
  public get startDate(): T | null {
    return (this as any)._run().next().value || null
  }

  public get endDate(): T | null {
    if ((this as any).isInfinite) return null;

    return (this as any)._run({reverse: true}).next().value
  }

  public occurrences(args: OccurrencesArgs<T> = {}): OccurrenceIterator<T, K> {
    return new OccurrenceIterator(this as any, args)
  }

    /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  public occursOn(args: {date: T}): boolean
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * 
   * Optional arguments:
   * 
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  public occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}) {
    if (!args.date) throw new Error('Was expecting an argument in the form `{date: DateAdapter}`');

    for (const day of (this as any)._run({ start: args.date, end: args.date })) {
      return !!day
    }
    return false
  }

  public occursBetween(start: T, end: T, options: { excludeEnds?: boolean } = {}) {
    for (const day of (this as any)._run({ start, end })) {
      if (options.excludeEnds) {
        if (day.isEqual(start)) { continue }
        if (day.isEqual(end)) { break }
      }

      return true
    }
    return false
  }

  public occursAfter(date: T, options: { excludeStart?: boolean } = {}) {
    for (const day of (this as any)._run({ start: date })) {
      if (options.excludeStart && day.isEqual(date)) { continue }
      return true
    }
    return false
  }

  public occursBefore(date: T, options: { excludeStart?: boolean } = {}) {
    for (const day of (this as any)._run({ start: date, reverse: true })) {
      if (options.excludeStart && day.isEqual(date)) { continue }
      return true
    }
    return false
  }
}

export abstract class StreamsOperator<T extends DateAdapter<T>, K extends RunnableIterator<T>> extends Operator<T, K> {
  get isInfinite() {
    return this.streams.some(stream => stream.isInfinite)
  }

  setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}): this {
    this.streams.forEach(stream => stream.setTimezone(timezone, options))

    return this
  }

  constructor(
    protected streams: IHasOccurrences<T, any>[] = []
  ) { super() }

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  public occursOn(args: {date: T}): boolean
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * 
   * Optional arguments:
   * 
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  public occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean {
    if (args.weekday)
      return this.streams.some(stream => stream.occursOn(args as {weekday: DateAdapter.Weekday}))
    else
      return super.occursOn(args as {date: T})
  }
}

export abstract class StreamOperator<T extends DateAdapter<T>, K extends RunnableIterator<T>> extends Operator<T, K> {
  public get isInfinite() {
    return this.stream.isInfinite
  }

  setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}): this {
    this.stream.setTimezone(timezone, options)

    return this
  }

  constructor(
    protected stream: IHasOccurrences<T, any>
  ) { super() }

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  public occursOn(args: {date: T}): boolean
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * 
   * Optional arguments:
   * 
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  public occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean {
    if (args.weekday)
      return this.stream.occursOn(args as {weekday: DateAdapter.Weekday})
    else
      return super.occursOn(args as {date: T})
  }
}

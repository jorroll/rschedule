import { DateAdapter } from './date-adapter'

export interface Serializable {
  toICal(): string | string[]
}

export interface RunnableIterator<T extends DateAdapter<T>> {
  isInfinite: boolean
  startDate: T | null
  endDate: T | null
  _run(args?: any): IterableIterator<T>
}

export interface OccurrencesArgs<T extends DateAdapter<T>> {
  start?: T
  end?: T
  take?: number
  reverse?: boolean
}

export interface IHasOccurrences<
  T extends DateAdapter<T>,
  K extends RunnableIterator<T>
> extends RunnableIterator<T> {
  occurrences(args: OccurrencesArgs<T>): OccurrenceIterator<T, K>
  occursBetween(start: T, end: T, options: { excludeEnds?: boolean }): boolean
  occursOn(args: {date: T}): boolean
  occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean
  occursAfter(date: T, options: { excludeStart?: boolean }): boolean
  occursBefore(date: T, options: { excludeStart?: boolean }): boolean
  setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}): this
  clone(): IHasOccurrences<T, K>
}

export abstract class HasOccurrences<T extends DateAdapter<T>> {
  public isInfinite!: boolean

  /** If generator is infinite, returns `undefined`. Otherwise returns the end date */
  public get endDate() {
    if (this.isInfinite) return null;

    return this.occurrences({reverse: true, take: 1}).toArray()![0]
  }

  // just to satisfy the interface
  public occurrences(args: any): OccurrenceIterator<T, any> {
    return args
  }

  public occursBetween(start: T, end: T, options: { excludeEnds?: boolean } = {}) {
    for (const day of this.occurrences({ start, end })) {
      if (options.excludeEnds) {
        if (day.isEqual(start)) { continue }
        if (day.isEqual(end)) { break }
      }

      return true
    }
    return false
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

    for (const day of this.occurrences({ start: args.date, end: args.date })) {
      return !!day
    }
    return false
  }

  public occursAfter(date: T, options: { excludeStart?: boolean } = {}) {
    for (const day of this.occurrences({ start: date })) {
      if (options.excludeStart && day.isEqual(date)) { continue }
      return true
    }
    return false
  }

  public occursBefore(date: T, options: { excludeStart?: boolean } = {}) {
    for (const day of this.occurrences({ start: date, reverse: true })) {
      if (options.excludeStart && day.isEqual(date)) { continue }
      return true
    }
    return false
  }
}

export class OccurrenceIterator<
  T extends DateAdapter<T>,
  K extends RunnableIterator<T>
> {
  private iterator: IterableIterator<T>

  constructor(private iterable: K, private args: OccurrencesArgs<T>) {
    this.iterator = iterable._run(args)
  }

  public [Symbol.iterator] = () => this.iterator

  public next(args?: {skipToDate?: T}) {
    return this.iterator.next(args)
  }

  public toArray() {
    if (!this.args.end && !this.args.take && this.iterable.isInfinite) {
      return undefined
    }
    else {
      const occurrences: T[] = []
      for (const date of this.iterable._run(this.args)) {
        occurrences.push(date)
      }
      return occurrences
    }
  }
}

// export class UndefinedIterator implements IterableIterator<undefined> {
//   [Symbol.iterator] = this.iterate

//   next() { return { value: undefined, done: true } }

//   toArray() { return undefined }

//   *iterate() {
//     while (false) {
//       yield undefined
//     }
//   }
// }

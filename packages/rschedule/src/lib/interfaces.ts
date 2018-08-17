import { DateAdapter } from './date-adapter'

export interface Serializable {
  toICal(): string | string[]
}

export interface RunnableIterator<T extends DateAdapter<T>> {
  isInfinite: boolean
  startDate: T | null
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
> {
  occurrences(args: OccurrencesArgs<T>): OccurrenceIterator<T, K>
  occursBetween(start: T, end: T, options: { excludeEnds?: boolean }): boolean
  occursOn(args: {date?: T}): boolean
  occursAfter(date: T, options: { excludeStart?: boolean }): boolean
  occursBefore(date: T, options: { excludeStart?: boolean }): boolean
}

export abstract class HasOccurrences<T extends DateAdapter<T>> {
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
   * Checks to see if an occurrence coincides with a specific date.
   * 
   * **Important:** at the moment, a date argument is required. It is optional
   * to support customization uses (such as extending the class). Hopefully it
   * will evenutally accept other arguments as well.
   */
  public occursOn(args: {date?: T}) {
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

  public next() {
    return this.iterator.next()
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

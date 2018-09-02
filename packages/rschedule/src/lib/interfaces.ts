import { DateAdapter, DateProp, DateAdapterConstructor, IDateAdapterConstructor } from './date-adapter'
import { DateTime } from './date-time'

export interface RunnableIterator<T extends DateAdapterConstructor> {
  isInfinite: boolean
  startDate: DateAdapter<T> | null
  endDate: DateAdapter<T> | null
  _run(args?: any): IterableIterator<DateAdapter<T>>
}

export interface OccurrencesArgs<T extends DateAdapterConstructor> {
  start?: DateProp<T>
  end?: DateProp<T>
  take?: number
  reverse?: boolean
}

export interface RunArgs<T extends DateAdapterConstructor> {
  start?: DateAdapter<T>
  end?: DateAdapter<T>
  take?: number
  reverse?: boolean
  dontWrap?: boolean
}

export interface IHasOccurrences<T extends DateAdapterConstructor> extends RunnableIterator<T> {
  occurrences(args: OccurrencesArgs<T>): OccurrenceIterator<T>
  occursBetween(start: DateProp<T>, end: DateProp<T>, options: { excludeEnds?: boolean }): boolean
  occursOn(args: {date: DateProp<T>}): boolean
  occursOn(args: {weekday: DateTime.Weekday; after?: DateProp<T>; before?: DateProp<T>; excludeEnds?: boolean}): boolean
  occursAfter(date: DateProp<T>, options: { excludeStart?: boolean }): boolean
  occursBefore(date: DateProp<T>, options: { excludeStart?: boolean }): boolean
  setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}): this
  clone(): IHasOccurrences<T>
}

export abstract class HasOccurrences<T extends DateAdapterConstructor> {
  abstract isInfinite: boolean

  protected abstract dateAdapter: IDateAdapterConstructor<T>

  /** Returns the first occurrence or, if there are no occurrences, null. */
  public get startDate(): DateAdapter<T> | null {  
    return this._run().next().value || null
  }  

  /** If generator is infinite, returns `null`. Otherwise returns the end date */
  public get endDate(): DateAdapter<T> | null {
    if (this.isInfinite) return null;

    return this._run({reverse: true}).next().value
  }

  public occurrences(args: OccurrencesArgs<T> = {}): OccurrenceIterator<T> {
    return new OccurrenceIterator(this as any, this.processOccurrencesArgs(args))
  }
  
  public occursBetween(start: DateProp<T>, end: DateProp<T>, options: { excludeEnds?: boolean } = {}) {
    const startAdapter = this.buildDateAdapter(start)
    const endAdapter = this.buildDateAdapter(end)

    for (const day of this._run({ start: startAdapter, end: endAdapter })) {
      if (options.excludeEnds) {
        if (day.isEqual(startAdapter)) { continue }
        if (day.isEqual(endAdapter)) { break }
      }

      return true
    }
    return false
  }

  abstract _run(args?: RunArgs<T>): IterableIterator<DateAdapter<T>>

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  abstract occursOn(args: {date: DateProp<T>}): boolean
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
  abstract occursOn(args: {weekday: DateTime.Weekday; after?: DateProp<T>; before?: DateProp<T>; excludeEnds?: boolean}): boolean

  public occursAfter(date: DateProp<T>, options: { excludeStart?: boolean } = {}) {
    const adapter = this.buildDateAdapter(date)

    for (const day of this._run({ start: adapter })) {
      if (options.excludeStart && day.isEqual(adapter)) { continue }
      return true
    }
    return false
  }

  public occursBefore(date: DateProp<T>, options: { excludeStart?: boolean } = {}) {
    const adapter = this.buildDateAdapter(date)

    for (const day of this._run({ start: adapter, reverse: true })) {
      if (options.excludeStart && day.isEqual(adapter)) { continue }
      return true
    }
    return false
  }

  protected processOccurrencesArgs(rawArgs: OccurrencesArgs<T>) {
    return {
      ...rawArgs,
      start: rawArgs.start && new this.dateAdapter(rawArgs.start),
      end: rawArgs.end && new this.dateAdapter(rawArgs.end),
    }
  }

  protected processOccursOnArgs(rawArgs: {
    date?: DateProp<T>; 
    weekday?: DateTime.Weekday; 
    after?: DateProp<T>; 
    before?: DateProp<T>; 
    excludeEnds?: boolean, 
    excludeDates?: DateProp<T>[]
  } = {}): {
    date?: DateAdapter<T>; 
    weekday?: DateTime.Weekday; 
    after?: DateAdapter<T>; 
    before?: DateAdapter<T>; 
    excludeEnds?: boolean, 
    excludeDates?: DateAdapter<T>[]
  } {
    return {
      ...rawArgs,
      date: this.buildDateAdapter(rawArgs.date),
      after: this.buildDateAdapter(rawArgs.after),
      before: this.buildDateAdapter(rawArgs.before),
      excludeDates: rawArgs.excludeDates &&
        rawArgs.excludeDates.map(date => this.buildDateAdapter(date)) as DateAdapter<T>[] | undefined,
    }
  }

  protected buildDateAdapter(date?: DateProp<T>) {
    if (!date) return;

    return new this.dateAdapter(date)
  }
}

export class OccurrenceIterator<T extends DateAdapterConstructor> {
  private iterator: IterableIterator<DateAdapter<T>>

  constructor(private iterable: RunnableIterator<T>, private args: RunArgs<T>) {
    this.iterator = iterable._run(args)
  }

  public [Symbol.iterator] = () => this.iterator

  public next(args?: {skipToDate?: DateAdapter<T>}) {
    return this.iterator.next(args)
  }

  public toArray() {
    if (!this.args.end && !this.args.take && this.iterable.isInfinite) {
      return undefined
    }
    else {
      const occurrences: DateAdapter<T>[] = []
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

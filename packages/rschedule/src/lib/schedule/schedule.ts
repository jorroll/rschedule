import {
  DateAdapter,
  DateAdapterConstructor,
  IDateAdapterConstructor,
} from '../date-adapter'
import { parseICalStrings } from '../ical/parser'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunnableIterator,
  Serializable,
} from '../interfaces'
import { EXDates, RDates, RRule, Rule } from '../rule'
import { Options } from '../rule/rule-options'
import { Utils } from '../utilities'

export class Schedule<
  T extends DateAdapter<T>,
  D = any
> extends HasOccurrences<T>
  implements
    Serializable,
    RunnableIterator<T>,
    IHasOccurrences<T, Schedule<T, D>> {

  /**
   * The start date is the earliest RDATE or RRULE start date. The first valid
   * occurrence of the schedule does not necessarily equal the start date because
   * exdates are not taken into consideration.
   */
  get startDate() {
    const dates = this.rrules.map(rule => rule.startDate)
    dates.push(...this.rdates.dates)
    return Utils.getEarliestDate(dates)
  }

  get isInfinite() {
    return this.rrules.some(rule => rule.isInfinite)
  }

  public static fromICal<T extends DateAdapterConstructor<T>>(
    icals: string | string[],
    dateAdapterConstructor: IDateAdapterConstructor<T>
  ) {
    if (!Array.isArray(icals)) { icals = [icals] }

    const options = parseICalStrings(icals, dateAdapterConstructor)

    return new Schedule(options)
  }
  public rrules: Array<RRule<T>> = []
  public rdates: RDates<T> = new RDates([])
  public exdates: EXDates<T> = new EXDates([])

  /** Convenience property for holding arbitrary data */
  public data?: D

  constructor(args?: {
    rrules?: Array<Options.ProvidedOptions<T>>
    rdates?: T[]
    exdates?: T[]
  }) {
    super()
    if (args) {
      if (args.rrules) {
        this.rrules = args.rrules.map(options => new RRule(options))
      }
      if (args.rdates) { this.rdates = new RDates(args.rdates) }
      if (args.exdates) { this.exdates = new EXDates(args.exdates) }
    }
  }

  public toICal() {
    const icals: string[] = []

    this.rrules.forEach(rule => icals.push(rule.toICal()))
    if (this.rdates.length > 0) { icals.push(this.rdates.toICal()) }
    if (this.exdates.length > 0) { icals.push(this.exdates.toICal()) }

    return icals
  }

  public occurrences(
    args: OccurrencesArgs<T> = {}
  ): OccurrenceIterator<T, Schedule<T, D>> {
    return new OccurrenceIterator(this, args)
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
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean}): boolean {
    if (args.weekday) {
      let before = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') : args.before)
      let after = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') : args.after)

      // Filter to get relevant exdates
      const excludeDates = this.exdates.dates.filter(date => 
        date.get('weekday') === args.weekday && (
          !after || date.isAfterOrEqual(after)
        ) && (
          !before || date.isBeforeOrEqual(before)
        )
      )

      const rules: (Rule<T> | RDates<T>)[] = this.rrules.slice()
      rules.push(this.rdates)

      return rules.some(rule => rule.occursOn({...args as {weekday: DateAdapter.Weekday}, excludeDates}))
    }
    else
      return super.occursOn(args as {date: T})
  }

  /**  @private use occurrences() instead */
  public *_run(args: OccurrencesArgs<T> = {}) {
    // bundle RRule iterators & RDates iterator
    const positiveIterators = this.rrules.slice() as Array<HasOccurrences<T>>
    positiveIterators.push(this.rdates)

    // extract exdates into array
    const exdates = Utils.sortDates(this.exdates.dates.slice())

    if (!args.reverse) exdates.reverse();

    // Create a cache we can iterate over.
    // The cache contains an array of objects. Each object contains an RRule
    // or RDates iterator, as well as the next upcoming date for that iterator
    let cache = positiveIterators
      .map(obj => {
        const iterator = obj.occurrences(args)

        return {
          iterator,
          date: iterator.next().value as T | undefined,
        }
      })
      // remove any iterators which don't have any upcoming dates from the cache
      .filter(item => !!item.date)

    let next: { iterator: OccurrenceIterator<T, Rule<T>>; date?: T }
    let mustFilter = false

    // just return void if the cache is empty (indicating that this schedule has
    // no RRule / RDates objects
    if (cache.length === 0) { return }
    else {
      // Selecting the first cache object is rather arbitrary
      // The only imporant thing is that our initial select
      //   1. has a date
      //   2. that date is not also an EXDATE
      next = getFirstIteratorCacheObj(cache, exdates, args.reverse)!

      if (!next) {
        return // here we make sure our select is actually the next upcoming occurrence
      ;
      }[next, mustFilter] = getNextIteratorCacheObj(next, cache, exdates, args.reverse)
    }

    const count = args.take
    let index = 0

    // iterate over the cache objects until we run out of dates or hit our max count
    while (next.date && (count === undefined || count > index)) {
      // add this schedule to the metadata
      next.date.schedule = this

      // yield the selected cache object's date to the user
      yield next.date.clone()

      // iterate the date on the selected cache object
      next.date = next.iterator.next().value

      if (!next.date || mustFilter) {
        // if the selected cache object now doesn't have a date,
        // remove it from the cache and arbitrarily select another one
        cache = cache.filter(cacheObj => !!cacheObj.date)
        next = cache[0]

        // if there are no more cache objects, end iteration
        if (cache.length === 0) { break }
      }

      // select the next upcoming cache object from the cache
      ;[next, mustFilter] = getNextIteratorCacheObj(next, cache, exdates, args.reverse)

      index++
    }
  }
}

/**
 * Selecting the first cache object is rather arbitrary
 * The only imporant thing is that our initial select
 *   1. has a date
 *   2. that date is not also an EXDATE
 */
function getFirstIteratorCacheObj<T extends DateAdapter<T>>(
  cache: Array<{ iterator: OccurrenceIterator<T, any>; date?: T }>,
  exdates: T[],
  reverse?: boolean,
) {
  let first = cache[0]

  getNextDateThatIsNotInExdates(first, exdates, reverse)

  while (!first.date && cache.length > 1) {
    cache.shift()
    first = cache[0]
    getNextDateThatIsNotInExdates(first, exdates, reverse)
  }

  if (!first.date) { return null }

  // remove past (i.e. no longer applicable exdates from our exdates array)
  removePastExDates(first.date, exdates, reverse)

  return first
}

/**
 * This function gets the next item from our iterator cache and
 * also removes past (i.e. no longer applicable) exdates from our
 * exdates array.
 */
function getNextIteratorCacheObj<T extends DateAdapter<T>>(
  next: { iterator: OccurrenceIterator<T, any>; date?: T },
  cache: Array<{ iterator: OccurrenceIterator<T, any>; date?: T }>,
  exdates: T[],
  reverse?: boolean,
): [{ iterator: OccurrenceIterator<T, any>; date?: T }, boolean] {
  let mustFilter = false

  if (cache.length === 1) {
    next = cache[0]
    getNextDateThatIsNotInExdates(next, exdates, reverse)
  } else {
    // don't include the `next` iterator in the cache, since it is injected into the
    // reducer as the first item
    cache = cache.filter(item => item !== next)
    // select the next upcoming cache object from the cache
    next = cache.reduce((prev, curr) => {
      if (!getNextDateThatIsNotInExdates(curr, exdates, reverse)) { return prev }
      else if (reverse ? curr.date!.isAfter(prev.date as T) : curr.date!.isBefore(prev.date as T)) { return curr }
      else if (curr.date!.isEqual(prev.date)) {
        curr.date = curr.iterator.next().value
        // ^ curr.date could be undefined, so need to remember
        // to filter away iterators with undefiend dates later
        mustFilter = true
        return prev
      } else { return prev }
    }, next)
  }

  // remove past (i.e. no longer applicable exdates from our exdates array)
  removePastExDates(next.date, exdates, reverse)

  return [next, mustFilter]
}

function getNextDateThatIsNotInExdates<T extends DateAdapter<T>>(
  cacheObj: {
    iterator: OccurrenceIterator<T, any>
    date?: T
  },
  exdates: T[],
  reverse?: boolean,
): T | undefined {
  if (cacheObj.date && dateIsInExDates(cacheObj.date, exdates, reverse)) {
    cacheObj.date = cacheObj.iterator.next().value
    return getNextDateThatIsNotInExdates(cacheObj, exdates, reverse)
  } else { return cacheObj.date }
}

function dateIsInExDates<T extends DateAdapter<T>>(
  date: T,
  exdates: T[],
  reverse?: boolean,
): boolean {
  for (const exdate of exdates) {
    if (date.isEqual(exdate)) { return true }
    else if (reverse ? date.isBefore(exdate) : date.isAfter(exdate)) { break }
  }

  return false
}

function removePastExDates<T extends DateAdapter<T>>(
  date: T | undefined,
  exdates: T[],
  reverse?: boolean,
) {
  if (!date) { return }

  const exdatesToBeRemoved: T[] = []

  for (const exdate of exdates) {
    if (reverse ? date.isAfterOrEqual(exdate) : date.isBeforeOrEqual(exdate)) { break }
    else if (reverse ? date.isBefore(exdate) : date.isAfter(exdate)) { exdatesToBeRemoved.push(exdate) }
  }

  exdatesToBeRemoved.forEach(exdate => {
    const index = exdates.indexOf(exdate)
    exdates.splice(index, 1)
  })
}

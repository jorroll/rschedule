import uniqWith from 'lodash.uniqwith'
import { DateAdapter } from '../date-adapter'
import { datesToIcalString, ruleOptionsToIcalString } from '../ical'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunnableIterator,
  Serializable,
} from '../interfaces'
import { PipeController } from '../pipes'
import { Utils } from '../utilities'
import { buildValidatedRuleOptions, Options } from './rule-options'

export abstract class Rule<T extends DateAdapter<T>, D = any>
  extends HasOccurrences<T>
  implements Serializable, RunnableIterator<T>, IHasOccurrences<T, Rule<T, D>> {
  /**
   * NOTE: The options object is frozen. To make changes you must assign a new options object.
   */
  get options() {
    return this._options
  }
  set options(value: Options.ProvidedOptions<T>) {
    // the old pipe controllers become invalid when the options change.
    // just to make sure someone isn't still using an old iterator function,
    // we mark the old controllers as invalid.
    // Yay for forseeing/preventing possible SUPER annoying bugs!!!
    this.usedPipeControllers.forEach(controller => (controller.invalid = true))
    this.usedPipeControllers = []
    this.processedOptions = buildValidatedRuleOptions(value)

    this._options = Object.freeze({ ...value })
  }

  get isInfinite(): boolean {
    return this.options.until === undefined && this.options.count === undefined
  }

  /** From `options.start`. Note: you should not mutate the start date directly */
  get startDate() {
    return this.options.start
  }

  /** Convenience property for holding arbitrary data */
  public data?: D
  private _options!: Options.ProvidedOptions<T>

  private usedPipeControllers: Array<PipeController<T>> = [] // only so that we can invalidate them, if necessary
  private processedOptions!: Options.ProcessedOptions<T>

  constructor(options: Options.ProvidedOptions<T>) {
    super()
    this.options = options
  }

  public occurrences(
    args: OccurrencesArgs<T> = {}
  ): OccurrenceIterator<T, Rule<T, D>> {
    return new OccurrenceIterator(this, args)
  }

  /**
   *   Checks to see if an occurrence exists which equals the given date.
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
   * - `excludeDates` argument can be provided which limits the possible occurrences
   *   to ones not equal to a date in the `excludeDates` array.
   */
  public occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean, excludeDates?: T[]}): boolean
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T; excludeEnds?: boolean, excludeDates?: T[]}): boolean {
    if (args.weekday) {
      if (
        this.processedOptions.byDayOfWeek &&
        !this.processedOptions.byDayOfWeek.some(day => typeof day === 'string' ? day === args.weekday : day[0] === args.weekday)
      ) {
        // The rule specificly does not occur on the given day
        return false
      }

      let until: T | undefined;
      let before = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') : args.before)
      let after = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') : args.after)

      if (this.processedOptions.until && before)
        until = before.isBefore(this.processedOptions.until) ? before : this.processedOptions.until
      else if (this.processedOptions.until)
        until = this.processedOptions.until;
      else if (before) {
        until = before;
      }

      if (until && until.isBefore(this.options.start)) return false;

      // This function allows for an "intelligent" brute forcing of occurrences.
      // For rules with a frequency less than a day, it only checks one
      // iteration on any given day.
      const bruteForceCheck = () => {
        let date = getNextDateNotInExdates(args.excludeDates, after, until)

        if (date && date.get('weekday') === args.weekday) return true;

        while (date) {
          Utils.setDateToStartOfDay(date).add(24, 'hour')

          date = getNextDateNotInExdates(args.excludeDates, date, until)

          if (date && date.get('weekday') === args.weekday) return true
        }

        return false
      }

      const getNextDateNotInExdates = (exdates?: T[], start?: T, end?: T) => {
        let date = this.occurrences({start, end}).next().value

        if (!exdates || exdates.length === 0) return date;

        while (date && exdates.some(exdate => exdate.isEqual(date))) {
          Utils.setDateToStartOfDay(date).add(24, 'hour')

          date = this.occurrences({start: date, end}).next().value
        }

        return date
      }

      if (this.processedOptions.count) {
        return bruteForceCheck()
      }

      if (until) {
        let difference: number;

        switch (this.processedOptions.frequency) {
          case 'YEARLY':
          case 'MONTHLY':
            difference = until.get('year') - this.processedOptions.start.get('year')

            // A particular day of the month will cycle through weekdays in an 11 year cycle.
            // If our timespan is 11 years or above, we can ignore the timestap. Otherwise, we just assume
            // there aren't that many occurrences and brute force it.
            if (args.excludeDates || difference < 11) return bruteForceCheck();
            
            break;
          case 'WEEKLY':
          case 'DAILY':
          case 'HOURLY':
          case 'MINUTELY':
          case 'SECONDLY':
          default:
            difference = until.get('yearday') - this.processedOptions.start.get('yearday')

            // If our timespan is less then a week, we simply test to see if it occurs on the day we're interested in.
            if (!args.excludeDates && difference < 6) {
              let date = this.processedOptions.start.clone()

              date.add(
                Utils.differenceInDaysBetweenTwoWeekdays(date.get('weekday'), args.weekday),
                'day'
              )

              if (after && date.isBefore(after)) return false;

              return this.occursOn({date})
            }

            // If we have `excludeDates` or our timespan is less than a year,
            // we need to worry about `byMonthOfYear` and `byDayOfMonth` rules
            if (
              (difference < 366 && (this.options.byMonthOfYear || this.options.byDayOfMonth)) ||
              args.excludeDates
            ) {
              return bruteForceCheck();
            }
            
            // If the timespan is more than a year, or more than a week without `byMonthOfYear`
            // or `byDayOfMonth` rules, and there are no `excludeDates`, we can ignore the end date.
            break;
        }
      }

      // The following assumes no end date to the rule.
      // Also note that we are using the `ProcessedOptions`, so we can count on `byDayOfWeek`
      // being present, if appropriate.
      if (this.processedOptions.byDayOfWeek)
        return this.processedOptions.byDayOfWeek.some(day => typeof day === 'string' ? day === args.weekday : day[0] === args.weekday);
      else
        return true;
    }
    else
      return super.occursOn(args as {date: T})
  }

  /**  @private use occurrences() instead */
  public *_run(args: OccurrencesArgs<T> = {}) {
    const controller = new PipeController(this.processedOptions, args)
    this.usedPipeControllers.push(controller)
    const iterator = controller._run()

    let date = iterator.next().value

    let index = 0

    while (date && (args.take === undefined || index < args.take)) {
      index++
      date.rule = this
      yield date
      date = iterator.next().value
    }
  }

  public toICal() {
    return ''
  }
}

export class RRule<T extends DateAdapter<T>> extends Rule<T> {
  public toICal() {
    return ruleOptionsToIcalString(this.options, 'RRULE')
  }
}

/**
 * This base class provides an iterable wrapper around the RDATEs array so that
 * it can be interacted with in the same manner as `Rule`
 */
export class RDatesBase<T extends DateAdapter<T>> extends HasOccurrences<T>
  implements
    Serializable,
    RunnableIterator<T>,
    IHasOccurrences<T, RDatesBase<T>> {
  public readonly isInfinite = false
  get length() {
    return this.dates.length
  }

  get startDate() {
    return Utils.getEarliestDate(this.dates)
  }

  constructor(public dates: T[]) {
    super()
  }

  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, args)
  }

  public occursOn(args: {date: T}): boolean
  public occursOn(args: {weekday: DateAdapter.Weekday; after?: T; before?: T, excludeEnds?: boolean; excludeDates?: T[]}): boolean
  public occursOn(args: {date?: T; weekday?: DateAdapter.Weekday; after?: T; before?: T, excludeEnds?: boolean; excludeDates?: T[]}): boolean {
    if (args.weekday) {
      let before = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') : args.before)
      let after = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') : args.after)

      return this.dates.some(date => 
        date.get('weekday') === args.weekday && (
          !args.excludeDates || !args.excludeDates.some(exdate => exdate.isEqual(date))
        ) && (
          !after || date.isAfterOrEqual(after)
        ) && (
          !before || date.isBeforeOrEqual(before)
        )
      )
    }
    else
      return super.occursOn(args as {date: T})
  }

  public *_run(args: OccurrencesArgs<T> = {}) {
    let dates = Utils.sortDates(uniqWith(this.dates, (a, b) => a.isEqual(b)))

    if (args.reverse) {
      if (args.start) {
        dates = dates.filter(date => date.isBeforeOrEqual(args.start as T))
      }
      if (args.end) { dates = dates.filter(date => date.isAfterOrEqual(args.end as T)) }

      dates.reverse()

      if (args.take) { dates = dates.slice(0, args.take) }  
    }
    else {
      if (args.start) {
        dates = dates.filter(date => date.isAfterOrEqual(args.start as T))
      }
      if (args.end) { dates = dates.filter(date => date.isBeforeOrEqual(args.end as T)) }
      if (args.take) { dates = dates.slice(0, args.take) }  
    }

    let date = dates.shift()

    while (date) {
      yield date

      date = dates.shift()
    }
  }

  public toICal() {
    return ''
  }
}

export class RDates<T extends DateAdapter<T>> extends RDatesBase<T> {
  public toICal() {
    return datesToIcalString(this.dates, 'RDATE')
  }
}

export class EXDates<T extends DateAdapter<T>> extends RDatesBase<T> {
  public toICal() {
    return datesToIcalString(this.dates, 'EXDATE')
  }
}

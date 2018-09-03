import { DateAdapter, DateProp, DateAdapterBase, IDateAdapterConstructor, DateAdapterConstructor } from '../date-adapter'
import { DateTime } from '../date-time'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrenceIterator,
  OccurrencesArgs,
  RunnableIterator,
  RunArgs,
} from '../interfaces'
import { PipeController } from './pipes'
import { buildValidatedRuleOptions, Options } from './rule-options'
import { Utils } from '../utilities'
import { RScheduleConfig } from '../rschedule-config';

const RULE_ID = Symbol.for('c551fc52-0d8c-4fa7-a199-0ac417565b45')

export abstract class Rule<T extends DateAdapterConstructor, D=any> extends HasOccurrences<T>
  implements RunnableIterator<T>, IHasOccurrences<T> {
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
    this.processedOptions = buildValidatedRuleOptions(this.dateAdapter as any, value as any)

    this._options = Object.freeze({ ...value })
  }

  get isInfinite(): boolean {
    return this.options.until === undefined && this.options.count === undefined
  }

  /** From `options.start`. Note: you should not mutate the start date directly */
  get startDate() {
    return DateAdapterBase.isInstance(this.options.start)
      ? this.options.start
      : new this.dateAdapter(this.options.start)
  }

  static defaultDateAdapter?: DateAdapterConstructor

  // @ts-ignore used by static method
  private readonly [RULE_ID] = true

  /**
   * Similar to `Array.isArray()`, `isRule()` provides a surefire method
   * of determining if an object is a `Rule` by checking against the
   * global symbol registry.
   */
  public static isRule(object: any): object is Rule<any> {
    return !!(object && object[RULE_ID])
  }

  /** Convenience property for holding arbitrary data */
  public data!: D
  
  private _options!: Options.ProvidedOptions<T>

  private usedPipeControllers: PipeController<T>[] = [] // only so that we can invalidate them, if necessary
  private processedOptions!: Options.ProcessedOptions<T>

  protected dateAdapter: IDateAdapterConstructor<T>

  constructor(options: Options.ProvidedOptions<T>, args: {data?: D, dateAdapter?: T}={}) {
    super()

    if (args.dateAdapter)
      this.dateAdapter = args.dateAdapter as any
    else if (Rule.defaultDateAdapter)
      this.dateAdapter = Rule.defaultDateAdapter as any
    else {
      this.dateAdapter = RScheduleConfig.defaultDateAdapter as any
    }

    if (!this.dateAdapter) {
      throw new Error(
        "Oops! You've initialized a Rule object without a dateAdapter."
      )
    }

    this.options = options;
    if (args.data) this.data = args.data;
  }

  /**
   * Updates the timezone associated with this rule.
   */
  public setTimezone(timezone: string | undefined, options: {keepLocalTime?: boolean} = {}) {
    const start = DateAdapterBase.isInstance(this.options.start)
      ? this.options.start.clone()
      : new this.dateAdapter(this.options.start)

    start.set('timezone', timezone, options)

    this.options = {
      ...this.options,
      start
    }

    return this
  }


  public occurrences(
    args: OccurrencesArgs<T> = {}
  ): OccurrenceIterator<T> {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args))
  }

  /**
   *   Checks to see if an occurrence exists which equals the given date.
   */
  public occursOn(rawArgs: {date: DateProp<T> | DateAdapter<T>}): boolean
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
  public occursOn(rawArgs: {weekday: DateTime.Weekday; after?: DateProp<T> | DateAdapter<T>; before?: DateProp<T> | DateAdapter<T>; excludeEnds?: boolean, excludeDates?: (DateProp<T> | DateAdapter<T>)[]}): boolean
  public occursOn(rawArgs: {date?: DateProp<T> | DateAdapter<T>; weekday?: DateTime.Weekday; after?: DateProp<T> | DateAdapter<T>; before?: DateProp<T> | DateAdapter<T>; excludeEnds?: boolean, excludeDates?: (DateProp<T> | DateAdapter<T>)[]}): boolean {
    let args = this.processOccursOnArgs(rawArgs)

    if (args.weekday) {
      if (
        this.processedOptions.byDayOfWeek &&
        !this.processedOptions.byDayOfWeek.some(day => typeof day === 'string' ? day === args.weekday : day[0] === args.weekday)
      ) {
        // The rule specificly does not occur on the given day
        return false
      }

      let until: DateAdapter<T> | undefined;
      let before = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') : args.before) as DateAdapter<T>
      let after = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') : args.after) as DateAdapter<T>

      if (this.processedOptions.until && before)
        until = before.isBefore(this.processedOptions.until) ? before : this.processedOptions.until
      else if (this.processedOptions.until)
        until = this.processedOptions.until;
      else if (before) {
        until = before;
      }

      if (until && until.isBefore(this.processedOptions.start)) return false;

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

      const getNextDateNotInExdates = (exdates?: DateAdapter<T>[], start?: DateAdapter<T>, end?: DateAdapter<T>) => {
        let date = this._run({start, end}).next().value

        if (!exdates || exdates.length === 0) return date;

        while (date && exdates.some(exdate => exdate.isEqual(date))) {
          Utils.setDateToStartOfDay(date).add(24, 'hour')

          date = this._run({start: date, end}).next().value
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
              const date = this.processedOptions.start.clone()

              date.add(
                Utils.differenceInDaysBetweenTwoWeekdays(date.get('weekday'), args.weekday!),
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
    else {
      for (const day of this._run({ start: args.date, end: args.date })) {
        return !!day
      }
      return false  
    }
  }

  /**  @private use occurrences() instead */
  public *_run(args: RunArgs<T> = {}): IterableIterator<DateAdapter<T>> {
    const pipeArgs = {
      ...args,
      start: args.start && new DateTime(
        args.start.clone().set('timezone', this.processedOptions.start.get('timezone'))
      ),
      end: args.end && new DateTime(
        args.end.clone().set('timezone', this.processedOptions.start.get('timezone'))
      ),
    }

    const controller = new PipeController(this.processedOptions, pipeArgs)
    this.usedPipeControllers.push(controller)
    const iterator = controller._run()

    let date = iterator.next().value

    let index = 0

    while (date && (args.take === undefined || index < args.take)) {
      index++
      
      date.generators.push(this)
      
      const yieldArgs = yield this.dateAdapter.fromTimeObject(date.toTimeObject())[0]

      date = iterator.next(yieldArgs).value
    }
  }

  // just exists to satisfy interface
  abstract clone(): Rule<T, D>

  abstract toICal(): string
}

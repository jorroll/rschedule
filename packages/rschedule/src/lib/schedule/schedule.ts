import {
  IDateAdapter,
  DateAdapter,
  IDateAdapterConstructor,
  DateAdapterConstructor,
  DateProp,
} from '../date-adapter'
import { parseICalStrings } from '../ical/parser'
import {
  HasOccurrences,
  IHasOccurrences,
  OccurrencesArgs,
  OccurrenceIterator,
  RunArgs,
} from '../interfaces'
import { RRule } from '../rule'
import { EXDates, RDates } from '../dates'
import { Options } from '../rule/rule-options'
import { EXRule } from '../rule/exrule';
import { buildIterator, add, subtract, unique } from '../operators';

const SCHEDULE_ID = Symbol.for('35d5d3f8-8924-43d2-b100-48e04b0cf500')

export type ScheduleRuleArgs<T extends DateAdapterConstructor> = [Options.ProvidedOptions<T>, {data?: any, dateAdapter?: T}]

export class Schedule<T extends DateAdapterConstructor, D = any>
  extends HasOccurrences<T>
  implements IHasOccurrences<T>
{

  get isInfinite() {
    return this.rrules.some(rule => rule.isInfinite)
  }

  public readonly [SCHEDULE_ID] = true

  /**
   * Similar to `Array.isArray`, `isSchedule` provides a surefire method
   * of determining if an object is a `Schedule` by checking against the
   * global symbol registry.
   */
  public static isSchedule(object: any): object is Schedule<any> {
    return !!(object && object[Symbol.for('35d5d3f8-8924-43d2-b100-48e04b0cf500')])
  }

  public static fromICal<T extends IDateAdapterConstructor<T>, D = undefined>(
    icals: string | string[],
    dateAdapterConstructor: T,
    args: {
      data?: D
    } = {}
  ): Schedule<T, D> { // specifying the return fixes a build bug
    if (!Array.isArray(icals)) { icals = [icals] }

    const options = parseICalStrings(icals, dateAdapterConstructor)

    return new Schedule({
      ...options,
      data: args.data,
      dateAdapter: dateAdapterConstructor
    })
  }
  
  public rrules: RRule<T>[] = []
  public exrules: EXRule<T>[] = []
  public rdates: RDates<T>
  public exdates: EXDates<T>

  /** Convenience property for holding arbitrary data */
  public data!: D

  protected dateAdapter: IDateAdapterConstructor<T>

  constructor(args: {
    dateAdapter: T
    data?: D
    rrules?: (ScheduleRuleArgs<T> | Options.ProvidedOptions<T> | RRule<T>)[]
    exrules?: (ScheduleRuleArgs<T> | Options.ProvidedOptions<T> | EXRule<T>)[]
    rdates?: DateProp<T>[] | RDates<T>
    exdates?: DateProp<T>[] | EXDates<T>
  }) {
    super()

    this.dateAdapter = args.dateAdapter as any
    
    if (args.data) this.data = args.data;

    if (args.rrules) {
      this.rrules = args.rrules.map(ruleArgs => {
        if (Array.isArray(ruleArgs))
          return  new RRule(ruleArgs[0], {dateAdapter: args.dateAdapter, ...ruleArgs[1]})
        else if (RRule.isRRule(ruleArgs))
          return ruleArgs.clone()
        else
          return new RRule(ruleArgs, {dateAdapter: args.dateAdapter})
      })
    }

    if (args.exrules) {
      this.exrules = args.exrules.map(ruleArgs => {
        if (Array.isArray(ruleArgs))
          // @ts-ignore typescript doesn't like spread operator
          return  new EXRule(ruleArgs[0], {dateAdapter: args.dateAdapter, ...ruleArgs[1]})
        else if (EXRule.isEXRule(ruleArgs))
          return ruleArgs.clone()
        else
          return new EXRule(ruleArgs, {dateAdapter: args.dateAdapter})
      })
    }

    if (args.rdates) {
        this.rdates = RDates.isRDates(args.rdates)
          ? args.rdates.clone()
          : new RDates({dates: args.rdates, dateAdapter: args.dateAdapter})
    }
    else {
      this.rdates = new RDates({dateAdapter: args.dateAdapter})
    }

    if (args.exdates) {
      this.exdates = EXDates.isEXDates(args.exdates)
        ? args.exdates.clone()
        : new EXDates({dates: args.exdates, dateAdapter: args.dateAdapter})
    }
    else {
      this.exdates = new EXDates({dateAdapter: args.dateAdapter})
    }
  }

  public toICal() {
    const icals: string[] = []

    this.rrules.forEach(rule => icals.push(rule.toICal()))
    this.exrules.forEach(rule => icals.push(rule.toICal()))
    if (this.rdates.length > 0) { icals.push(this.rdates.toICal()) }
    if (this.exdates.length > 0) { icals.push(this.exdates.toICal()) }

    return icals
  }

  /**
   * Update all `rrules`, `rdates`, and `exdates` of this schedule to use a
   * new timezone. This mutates the schedule's `rrules`, `rdates`, and `exdates`.
   */
  public setTimezone(timezone: string | undefined, options: {keepLocalTime?: boolean} = {}) {
    this.rrules.forEach(rule => rule.setTimezone(timezone, options))
    this.exrules.forEach(rule => rule.setTimezone(timezone, options))
    this.rdates.setTimezone(timezone, options)
    this.exdates.setTimezone(timezone, options)

    return this
  }

  /**
   * Returns a clone of the Schedule object and all properties except the data property
   * (instead, the original data property is included as the data property of the
   * new Schedule).
   */
  public clone() {
    return new Schedule<T, D>({
      dateAdapter: this.dateAdapter as any,
      data: this.data,
      rrules: this.rrules.map(rule => rule.clone()),
      exrules: this.exrules.map(rule => rule.clone()),
      rdates: this.rdates.clone(),
      exdates: this.exdates.clone(),
    })
  }

  /**
   * Processed the internal rrules, exrules, rdates, and exdates and
   * iterates over the resulting occurrences. Occurrences are deduplicated.
   *
   * Options object:
   * - `start` the date to begin iteration on
   * - `end` the date to end iteration on
   * - `take` the max number of dates to take before ending iteration
   * - `reverse` whether to iterate in reverse or not
   *
   * @param arg `OccurrencesArgs` options object
   */
  public occurrences(args: OccurrencesArgs<T> = {}) {
    return new OccurrenceIterator(this, this.processOccurrencesArgs(args))
  }

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  public occursOn(rawArgs: {date: T}): boolean
  /**
   * **DOES NOT CURRENTLY TAKE INTO ACCOUNT EXRULES.**
   * 
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * 
   * Optional arguments:
   * 
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  public occursOn(rawArgs: {weekday: IDateAdapter.Weekday; after?: DateProp<T>; before?: DateProp<T>; excludeEnds?: boolean}): boolean
  public occursOn(rawArgs: {date?: DateProp<T>; weekday?: IDateAdapter.Weekday; after?: DateProp<T>; before?: DateProp<T>; excludeEnds?: boolean}): boolean {
    const args = this.processOccursOnArgs(rawArgs)

    if (args.weekday) {
      let before = args.before && (args.excludeEnds ? args.before.clone().subtract(1, 'day') : args.before)
      let after = args.after && (args.excludeEnds ? args.after.clone().add(1, 'day') : args.after)

      // Filter to get relevant exdates
      const excludeDates = this.exdates.dates.filter(date => {
        const adapter = new this.dateAdapter(date)

        adapter.get('weekday') === args.weekday && (
          !after || adapter.isAfterOrEqual(after)
        ) && (
          !before || adapter.isBeforeOrEqual(before)
        )
      })

      const rules: (RRule<T> | RDates<T>)[] = this.rrules.slice()
      rules.push(this.rdates)

      return rules.some(rule => rule.occursOn({...args as {weekday: IDateAdapter.Weekday}, excludeDates}))
    }
    else {
      for (const day of this._run({ start: args.date, end: args.date })) {
        return !!day
      }
      return false  
    }
  }

  /**  @private use occurrences() instead */
  *_run(args: RunArgs<T> = {}): IterableIterator<DateAdapter<T>> {
    const count = args.take;
    
    delete args.take;

    const iterator = buildIterator(
      add(...this.rrules),
      subtract(...this.exrules),
      add(this.rdates),
      subtract(this.exdates),
      unique(),
    )._run(args)

    let date = iterator.next().value
    let index = 0

    while (date && (count === undefined || count > index)) {
      date.generators.push(this)

      const yieldArgs = yield date.clone() as DateAdapter<T>

      date = iterator.next(yieldArgs).value

      index++
    }
  }
}

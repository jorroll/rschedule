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

  /**  @private use occurrences() instead */
  public *_run(args: OccurrencesArgs<T> = {}) {
    const controller = new PipeController(this.processedOptions, args)
    this.usedPipeControllers.push(controller)
    const iterator = controller._run()

    let date = iterator.next().value

    while (date) {
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

  public *_run(args: OccurrencesArgs<T> = {}) {
    let dates = Utils.sortDates(uniqWith(this.dates, (a, b) => a.isEqual(b)))

    if (args.start) {
      dates = dates.filter(date => date.isAfterOrEqual(args.start as T))
    }
    if (args.end) { dates = dates.filter(date => date.isBeforeOrEqual(args.end as T)) }
    if (args.take) { dates = dates.slice(0, args.take) }

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

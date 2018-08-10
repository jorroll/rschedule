import { DateAdapter } from '../date-adapter'
import { RunnableIterator } from '../interfaces'
import { Options } from '../rule/rule-options'
import { FrequencyPipe } from './01-frequency.pipe'
import { ByMonthOfYearPipe } from './02-by-month-of-year.pipe'
import { ByDayOfMonthPipe } from './05-by-day-of-month.pipe'
import { ByDayOfWeekPipe } from './06-by-day-of-week.pipe'
import { ByHourOfDayPipe } from './07-by-hour-of-day.pipe'
import { ByMinuteOfHourPipe } from './08-by-minute-of-hour.pipe'
import { BySecondOfMinutePipe } from './09-by-second-of-minute.pipe'
import { ResultPipe } from './11-result.pipe'
import { IPipeController, IPipeRule } from './interfaces'

/**
 * Steps
 *
 * 1. Figure out start date and, optionally, end date
 * 2. Figure out which months are applicable to that start date and end date
 * 3. remove `byMonthOfYear` months that aren't applicable
 *
 * - for whatever `byXXX` rules aren't supplied, have pipes at the end that fill
 *   in the date with the appropriate bits of the starting date.
 *
 * - the start date needs to be a valid occurrence
 */

export class PipeController<T extends DateAdapter<T>>
  implements IPipeController<T>, RunnableIterator<T> {
  public start!: T
  public end?: T
  public count?: number
  public isIteratingInReverseOrder = false

  public expandingPipes: Array<IPipeRule<T>> = []

  get focusedPipe() {
    return this.expandingPipes[this.expandingPipes.length - 1]
  }

  // to conform to the `RunnableIterator` interface
  get startDate() {
    return this.start
  }

  /**
   * If the parent of this pipe controller (`Rule` object) changes the `options` object
   * this pipe controller will be invalid. To prevent someone from accidently continuing
   * to use an invalid iterator, we invalidate the old one so it will throw an error.
   */
  public invalid = false

  get isInfinite() {
    return !this.end && this.count === undefined
  }

  private pipes: Array<IPipeRule<T>> = []

  constructor(
    public options: Options.ProcessedOptions<T>,
    args: { start?: T; end?: T; reverse?: boolean; take?: number }
  ) {
    const frequencyPipe = new FrequencyPipe(this)

    this.expandingPipes.push(frequencyPipe)
    this.addPipe(frequencyPipe)

    // The ordering is defined in the ICAL spec https://tools.ietf.org/html/rfc5545#section-3.3.10
    if (this.options.byMonthOfYear !== undefined) {
      this.addPipe(new ByMonthOfYearPipe(this))
    }
    if (this.options.byDayOfMonth !== undefined) {
      this.addPipe(new ByDayOfMonthPipe(this))
    }
    if (this.options.byDayOfWeek !== undefined) {
      this.addPipe(new ByDayOfWeekPipe(this))
    }
    if (this.options.byHourOfDay !== undefined) {
      this.addPipe(new ByHourOfDayPipe(this))
    }
    if (this.options.byMinuteOfHour !== undefined) {
      this.addPipe(new ByMinuteOfHourPipe(this))
    }
    if (this.options.bySecondOfMinute !== undefined) {
      this.addPipe(new BySecondOfMinutePipe(this))
    }

    this.addPipe(new ResultPipe(this))

    this.isIteratingInReverseOrder = !!args.reverse
    this.setStartDate(args.start)
    this.setEndDate(args.end)
    this.setCount(args.take)
  }

  public *_run() {
    let date = this.focusedPipe.run({
      skipToIntervalOnOrAfter: this.start,
    } as any)

    let index = 0

    while (date && (this.count === undefined || index < this.count)) {
      index++

      if (date && this.end && date.isAfter(this.end)) { date = null }
      else if (date) {
        yield date.clone()
        date = this.focusedPipe.run({ date })
      }
    }
  }

  private addPipe(pipe: any) {
    const lastPipe = this.pipes[this.pipes.length - 1]

    this.pipes.push(pipe)

    if (lastPipe) {
      lastPipe.nextPipe = pipe
    }
  }

  private setStartDate(date?: T) {
    this.start =
      date && date.isAfterOrEqual(this.options.start)
        ? date.clone()
        : this.options.start.clone()
  }

  private setEndDate(date?: T) {
    if (date && this.options.until) {
      this.end = date.isBefore(this.options.until)
        ? date.clone()
        : this.options.until.clone()
    }
    else if (this.options.until) { this.end = this.options.until!.clone() }
    else if (date) { this.end = date.clone() }
  }

  private setCount(take?: number) {
    if (take !== undefined && this.options.count !== undefined) {
      this.count = take > this.options.count ? this.options.count : take
    }
    else if (take !== undefined) { this.count = take }
    else if (this.options.count !== undefined) { this.count = this.options.count }
  }
}

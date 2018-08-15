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

import { FrequencyReversePipe } from './rev-01-frequency.pipe'
import { ByMonthOfYearReversePipe } from './rev-02-by-month-of-year.pipe'
import { ByDayOfMonthReversePipe } from './rev-05-by-day-of-month.pipe'
import { ByDayOfWeekReversePipe } from './rev-06-by-day-of-week.pipe'
import { ByHourOfDayReversePipe } from './rev-07-by-hour-of-day.pipe'
import { ByMinuteOfHourReversePipe } from './rev-08-by-minute-of-hour.pipe'
import { BySecondOfMinuteReversePipe } from './rev-09-by-second-of-minute.pipe'
import { ResultReversePipe } from './rev-11-result.pipe'

import { IPipeController, IPipeRule } from './interfaces'

import cloneDeep from 'lodash.clonedeep'

export class PipeController<T extends DateAdapter<T>>
  implements IPipeController<T>, RunnableIterator<T> {
  public start!: T
  public end?: T
  public count?: number
  public reverse = false

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

  public options: Options.ProcessedOptions<T>

  private pipes: Array<IPipeRule<T>> = []

  constructor(
    options: Options.ProcessedOptions<T>,
    args: { start?: T; end?: T; reverse?: boolean; take?: number }
  ) {
    this.options = cloneDeep(options)

    // Pipe ordering is defined in the ICAL spec 
    // https://tools.ietf.org/html/rfc5545#section-3.3.10
    if (args.reverse) {
      const frequencyPipe = new FrequencyReversePipe(this)

      this.expandingPipes.push(frequencyPipe)
      this.addPipe(frequencyPipe)

      const reverseSort = (a: number, b: number) => {
        if (a > b) return -1
        else if (b > a) return 1
        else return 0
      }
  
      if (this.options.byMonthOfYear !== undefined) {
        this.addPipe(new ByMonthOfYearReversePipe(this))
        this.options.byMonthOfYear.sort(reverseSort)
      }
      if (this.options.byDayOfMonth !== undefined) {
        this.addPipe(new ByDayOfMonthReversePipe(this))
      }
      if (this.options.byDayOfWeek !== undefined) {
        this.addPipe(new ByDayOfWeekReversePipe(this))
      }
      if (this.options.byHourOfDay !== undefined) {
        this.addPipe(new ByHourOfDayReversePipe(this))
        this.options.byHourOfDay.sort(reverseSort)
      }
      if (this.options.byMinuteOfHour !== undefined) {
        this.addPipe(new ByMinuteOfHourReversePipe(this))
        this.options.byMinuteOfHour.sort(reverseSort)
      }
      if (this.options.bySecondOfMinute !== undefined) {
        this.addPipe(new BySecondOfMinuteReversePipe(this))
        this.options.bySecondOfMinute.sort(reverseSort)
      }
  
      this.addPipe(new ResultReversePipe(this))
    }
    else {
      const frequencyPipe = new FrequencyPipe(this)

      this.expandingPipes.push(frequencyPipe)
      this.addPipe(frequencyPipe)
  
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
    }

    this.reverse = !!args.reverse

    this.setStartDate(args.start)
    this.setEndDate(args.end)
    this.setCount(args.take)
  }

  public *_run() {    
    let date = this.focusedPipe.run({
      date: this.start, // <- just present to satisfy interface
      skipToDate: this.start,
    })

    let index = 0

    while (date && (this.count === undefined || index < this.count)) {
      index++

      yield date.clone()

      date = this.focusedPipe.run({ date })
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
    if (this.reverse) {
      if (date && this.options.until) {
       this.start = date.isAfter(this.options.until)
          ? this.options.until.clone()
          : date.clone()
      }
      else if (this.options.until) { this.start = this.options.until!.clone() }
      else if (date) { this.start = date.clone() }
      else {
        throw new Error(
          'When iterating in reverse, either the rule must have an `until` date or ' +
          'you must supply a start date.'
        )
      }

      // generally, the `FrequencyReversePipe` expects to always be pushing a given date
      // backwards in time. On the first iteration only though, it needs to move forward to
      // the starting interval, which is what we're doing here.
      return (this.focusedPipe as FrequencyReversePipe<T>).skipToStartInterval(this.start.clone())
    }
    
    return this.start =
      date && date.isAfterOrEqual(this.options.start)
        ? date.clone()
        : this.options.start.clone()
  }

  private setEndDate(date?: T) {
    if (this.reverse) {
      if (date && date.isAfter(this.options.start)) {
        return this.end = date.clone()
      }
      else { return this.end = this.options.start.clone() }  
    }

    if (date && this.options.until) {
      return this.end = date.isBefore(this.options.until)
        ? date.clone()
        : this.options.until.clone()
    }
    else if (this.options.until) { return this.end = this.options.until!.clone() }
    else if (date) { return this.end = date.clone() }
  }

  private setCount(take?: number) {
    if (take !== undefined && this.options.count !== undefined) {
      this.count = take > this.options.count ? this.options.count : take
    }
    else if (take !== undefined) { this.count = take }
    else if (this.options.count !== undefined) { this.count = this.options.count }
  }
}

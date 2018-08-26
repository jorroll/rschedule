import { DateAdapter } from '../../date-adapter'
import { Options } from '../rule-options'
import { IPipeRule, IPipeRunFn, ReversePipeRule } from './interfaces'
import { Utils } from '../../utilities'

export class ByMonthOfYearReversePipe<T extends DateAdapter<T>> extends ReversePipeRule<T>
  implements IPipeRule<T> {

  private upcomingMonths: DateAdapter.IMonth[] = []

  public run(args: IPipeRunFn<T>) {
    if (args.invalidDate) { return this.nextPipe.run(args) }

    if (this.options.frequency === 'YEARLY') {
      return this.expand(args)
    } else { return this.filter(args) }
  }

  public expand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.upcomingMonths.length === 0) {
      this.upcomingMonths = this.options.byMonthOfYear!.filter(
        month => date.get('month') >= month
      )

      if (this.upcomingMonths.length === 0) {
        return this.nextPipe.run({ date, invalidDate: true })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byDayOfMonth || this.options.byDayOfWeek) {
        Utils.setDateToEndOfMonth(date)
      }
      if (this.options.byHourOfDay) { date.set('hour', 23) }
      if (this.options.byMinuteOfHour) { date.set('minute', 59) }
      if (this.options.bySecondOfMinute) { date.set('second', 59) }
    }

    const nextMonth = this.upcomingMonths.shift()!

    date.set('month', nextMonth)

    if (this.upcomingMonths.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public filter(args: IPipeRunFn<T>) {
    let validMonth = false
    let nextValidMonthThisYear: Options.ByMonthOfYear | null = null

    // byMonthOfYear array is sorted
    for (const month of this.options.byMonthOfYear!) {
      if (args.date.get('month') === month) {
        validMonth = true
        break
      } else if (args.date.get('month') > month) {
        nextValidMonthThisYear = month
        break
      }
    }

    if (validMonth) { return this.nextPipe.run({ date: args.date }) }

    let next: T

    // if the current date does not pass this filter,
    // is it possible for a date to pass this filter for the remainder of the year?
    //
    // - We know the current `options.frequency` is not yearly

    if (nextValidMonthThisYear !== null) {
      // if yes, advance the current date forward to the next month which would pass
      // this filter
      next = this.cloneDateWithGranularity(args.date, 'month')
      next.set('month', nextValidMonthThisYear)
    } else {
      // if no, reduce the current date one year &
      // and set the date to whatever month would pass this filter
      next = this.cloneDateWithGranularity(args.date, 'year')
      next.subtract(1, 'year')
      next.set('month', this.options.byMonthOfYear![0])
    }

    // make sure we don't move the date to far backwards
    if (this.options.byDayOfMonth || this.options.byDayOfWeek) {
      Utils.setDateToEndOfMonth(next)
    }
    if (this.options.byHourOfDay) { next.set('hour', 23) }
    if (this.options.byMinuteOfHour) { next.set('minute', 59) }
    if (this.options.bySecondOfMinute) { next.set('second', 59) }

    return this.nextPipe.run({
      invalidDate: true,
      skipToDate: next,
      date: args.date,
    })
  }
}

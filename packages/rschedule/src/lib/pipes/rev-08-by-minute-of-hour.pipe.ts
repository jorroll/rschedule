import { DateAdapter } from '../date-adapter'
import { Options } from '../rule/rule-options'
import { IPipeRule, IPipeRunFn, ReversePipeRule } from './interfaces'

export class ByMinuteOfHourReversePipe<T extends DateAdapter<T>> extends ReversePipeRule<T>
  implements IPipeRule<T> {

  private upcomingMinutes: Options.ByMinuteOfHour[] = []
  
  public run(args: IPipeRunFn<T>) {
    if (args.invalidDate) { return this.nextPipe.run(args) }

    if (['MINUTELY', 'SECONDLY'].includes(this.options.frequency)) {
      return this.filter(args)
    } else { return this.expand(args) }
  }

  public expand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.upcomingMinutes.length === 0) {
      this.upcomingMinutes = this.options.byMinuteOfHour!.filter(
        minute => date.get('minute') >= minute
      )

      if (this.upcomingMinutes.length === 0) {
        return this.nextPipe.run({ date, invalidDate: true })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.bySecondOfMinute) { date.set('second', 59) }
    }

    const nextMinute = this.upcomingMinutes.shift()!

    date.set('minute', nextMinute)

    if (this.upcomingMinutes.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public filter(args: IPipeRunFn<T>) {
    let validMinute = false
    let nextValidMinuteThisHour: Options.ByMinuteOfHour | null = null

    // byMinuteOfHour array is sorted
    for (const minute of this.options.byMinuteOfHour!) {
      if (args.date.get('minute') === minute) {
        validMinute = true
        break
      } else if (args.date.get('minute') > minute) {
        nextValidMinuteThisHour = minute
        break
      }
    }

    if (validMinute) { return this.nextPipe.run({ date: args.date }) }

    let next: T

    // if the current date does not pass this filter,
    // is it possible for a date to pass this filter for the remainder of the hour?

    if (nextValidMinuteThisHour !== null) {
      // if yes, advance the current date forward to the next minute which would pass
      // this filter
      next = this.cloneDateWithGranularity(args.date, 'minute')
      next.set('minute', nextValidMinuteThisHour)
    } else {
      // if no, advance the current date forward one hour &
      // and set the date to whatever minute would pass this filter
      next = this.cloneDateWithGranularity(args.date, 'hour')
      next.subtract(1, 'hour')
      next.set('minute', this.options.byMinuteOfHour![0])
    }

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToDate: next,
    })
  }
}

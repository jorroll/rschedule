import { DateTime } from '../../date-time'
import { Options } from '../rule-options'
import { IPipeRule, IPipeRunFn, ReversePipeRule } from './interfaces'

export class BySecondOfMinuteReversePipe extends ReversePipeRule implements IPipeRule {

  private upcomingSeconds: Options.BySecondOfMinute[] = []

  public run(args: IPipeRunFn) {
    if (args.invalidDate) { return this.nextPipe.run(args) }

    if (this.options.frequency === 'SECONDLY') {
      return this.filter(args)
    } else { return this.expand(args) }
  }

  public expand(args: IPipeRunFn) {
    const date = args.date

    if (this.upcomingSeconds.length === 0) {
      this.upcomingSeconds = this.options.bySecondOfMinute!.filter(
        second => date.get('second') >= second
      )

      if (this.upcomingSeconds.length === 0) {
        return this.nextPipe.run({ date, invalidDate: true })
      }

      this.expandingPipes.push(this)
    }

    const nextSecond = this.upcomingSeconds.shift()!

    date.set('second', nextSecond)

    if (this.upcomingSeconds.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public filter(args: IPipeRunFn) {
    let validSecond = false
    let nextValidSecondThisMinute: Options.BySecondOfMinute | null = null

    // bySecondOfMinute array is sorted
    for (const second of this.options.bySecondOfMinute!) {
      if (args.date.get('second') === second) {
        validSecond = true
        break
      } else if (args.date.get('second') > second) {
        nextValidSecondThisMinute = second
        break
      }
    }

    if (validSecond) { return this.nextPipe.run({ date: args.date }) }

    let next: DateTime

    // if the current date does not pass this filter,
    // is it possible for a date to pass this filter for the remainder of the minute?

    if (nextValidSecondThisMinute !== null) {
      // if yes, advance the current date forward to the next second which would pass
      // this filter
      next = this.cloneDateWithGranularity(args.date, 'second')
      next.set('second', nextValidSecondThisMinute)
    } else {
      // if no, advance the current date forward one minute &
      // and set the date to whatever second would pass this filter
      next = this.cloneDateWithGranularity(args.date, 'minute')
      next.subtract(1, 'minute')
      next.set('second', this.options.bySecondOfMinute![0])
    }

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToDate: next,
    })
  }
}

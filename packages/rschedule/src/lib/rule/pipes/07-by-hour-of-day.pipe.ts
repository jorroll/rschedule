import { DateTime } from '../../date-time'
import { Options } from '../rule-options'
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces'

export class ByHourOfDayPipe extends PipeRule implements IPipeRule {

  private upcomingHours: Options.ByHourOfDay[] = []
  public run(args: IPipeRunFn) {
    if (args.invalidDate) { return this.nextPipe.run(args) }

    if (
      ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'].includes(this.options.frequency)
    ) {
      return this.expand(args)
    } else { return this.filter(args) }
  }
  public expand(args: IPipeRunFn) {
    const date = args.date

    if (this.upcomingHours.length === 0) {
      this.upcomingHours = this.options.byHourOfDay!.filter(
        hour => date.get('hour') <= hour
      )

      if (this.upcomingHours.length === 0) {
        return this.nextPipe.run({ date, invalidDate: true })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byMinuteOfHour) { date.set('minute', 0) }
      if (this.options.bySecondOfMinute) { date.set('second', 0) }
    }

    const nextHour = this.upcomingHours.shift()!

    date.set('hour', nextHour)

    if (this.upcomingHours.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public filter(args: IPipeRunFn) {
    let validHour = false
    let nextValidHourThisDay: Options.ByHourOfDay | null = null

    // byHourOfYear array is sorted
    for (const hour of this.options.byHourOfDay!) {
      if (args.date.get('hour') === hour) {
        validHour = true
        break
      } else if (args.date.get('hour') < hour) {
        nextValidHourThisDay = hour
        break
      }
    }

    if (validHour) { return this.nextPipe.run({ date: args.date }) }

    let next: DateTime

    // if the current date does not pass this filter,
    // is it possible for a date to pass this filter for the remainder of the year?
    //
    // - We know the current `options.frequency` is not yearly

    if (nextValidHourThisDay !== null) {
      // if yes, advance the current date forward to the next hour which would pass
      // this filter
      next = this.cloneDateWithGranularity(args.date, 'hour')
      next.set('hour', nextValidHourThisDay)
    } else {
      // if no, advance the current date forward one day &
      // and set the date to whatever hour would pass this filter
      next = this.cloneDateWithGranularity(args.date, 'day')
      next.add(1, 'day')
      next.set('hour', this.options.byHourOfDay![0])
    }

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToDate: next,
    })
  }
}

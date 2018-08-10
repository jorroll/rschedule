import uniq from 'lodash.uniq'
import { DateAdapter } from '../date-adapter'
import { Options } from '../rule/rule-options'
import { Utils } from '../utilities'
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces'

export class ByDayOfMonthPipe<T extends DateAdapter<T>> extends PipeRule<T>
  implements IPipeRule<T> {

  private upcomingMonthDays: Array<[number, number]> = []

  private upcomingDays: number[] = []
  public run(args: IPipeRunFn<T>) {
    if (args.invalidDate) { return this.nextPipe.run(args) }

    if (
      this.options.frequency === 'YEARLY' &&
      this.options.byMonthOfYear === undefined
    ) {
      return this.yearlyExpand(args)
    } else if (['YEARLY', 'MONTHLY'].includes(this.options.frequency)) {
      return this.expand(args)
    } else { return this.filter(args) }
  }
  public yearlyExpand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.upcomingMonthDays.length === 0) {
      this.upcomingMonthDays = getUpcomingMonthDays(date, this.options)

      if (this.upcomingMonthDays.length === 0) {
        const next = Utils.setDateToStartOfYear(date.clone().add(1, 'year'))

        return this.nextPipe.run({
          invalidDate: true,
          date,
          skipToIntervalOnOrAfter: next,
        })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byHourOfDay) { date.set('hour', 0) }
      if (this.options.byMinuteOfHour) { date.set('minute', 0) }
      if (this.options.bySecondOfMinute) { date.set('second', 0) }
    }

    const nextDay = this.upcomingMonthDays.shift()!
    date.set('month', nextDay[0]).set('day', nextDay[1])

    if (this.upcomingMonthDays.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }
  public expand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.upcomingDays.length === 0) {
      this.upcomingDays = getUpcomingDays(date, this.options)

      if (this.upcomingDays.length === 0) {
        const next = date
          .clone()
          .add(1, 'month')
          .set('day', 1)

        return this.nextPipe.run({
          invalidDate: true,
          date,
          skipToIntervalOnOrAfter: next,
        })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byHourOfDay) { date.set('hour', 0) }
      if (this.options.byMinuteOfHour) { date.set('minute', 0) }
      if (this.options.bySecondOfMinute) { date.set('second', 0) }
    }

    const nextDay = this.upcomingDays.shift()!
    date.set('day', nextDay)

    if (this.upcomingDays.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public filter(args: IPipeRunFn<T>) {
    const upcomingDays = getUpcomingDays(args.date, this.options)

    let validDay = false
    let nextValidDayThisMonth: number | null = null

    for (const day of upcomingDays) {
      if (args.date.get('day') === day) {
        validDay = true
        break
      } else if (args.date.get('day') < day) {
        nextValidDayThisMonth = day
        break
      }
    }

    if (validDay) { return this.nextPipe.run({ date: args.date }) }
    let next: T

    // if the current date does not pass this filter,
    // is it possible for a date to pass this filter for the remainder of the month?
    //
    // Note:
    // We know the current `options.frequency` is not yearly or monthly or weekly

    if (nextValidDayThisMonth !== null) {
      // if yes, advance the current date forward to the next month which would pass
      // this filter
      next = this.cloneDateWithGranularity(args.date, 'day')
      next.add(nextValidDayThisMonth - args.date.get('day'), 'day')
    } else {
      // if no, advance the current date forward one year &
      // and set the date to whatever month would pass this filter
      next = this.cloneDateWithGranularity(args.date, 'month')
      next.add(1, 'month')
      const nextDay = getUpcomingDays(next, this.options)[0]
      next.set('day', nextDay)
    }

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToIntervalOnOrAfter: next,
    })
  }
}

function getUpcomingMonthDays<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>
): Array<[number, number]> {
  const next = date.clone()
  const monthDays: Array<[number, number]> = []

  for (let i = next.get('month'); i <= 12; i++) {
    const days = getUpcomingDays(next, options)

    monthDays.push(
      ...days.map(day => [next.get('month'), day] as [number, number])
    )

    next.add(1, 'month').set('day', 1)

    i++
  }

  return monthDays
}

function getUpcomingDays<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>
) {
  const daysInMonth = Utils.getDaysInMonth(date.get('month'), date.get('year'))

  return uniq(
    options
      .byDayOfMonth!.filter(day => {
        return daysInMonth >= Math.abs(day)
      })
      .map(day => (day > 0 ? day : daysInMonth + day + 1))
      .sort((a, b) => {
        if (a > b) { return 1 }
        if (a < b) { return -1 }
        else { return 0 }
      })
  ).filter(day => date.get('day') <= day)
}

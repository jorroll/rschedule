import uniq from 'lodash.uniq'
import { DateAdapter } from '../date-adapter'
import { Options } from '../rule/rule-options'
import { Utils } from '../utilities'
import { IPipeRule, IPipeRunFn, ReversePipeRule } from './interfaces'

export class ByDayOfMonthReversePipe<T extends DateAdapter<T>> extends ReversePipeRule<T>
  implements IPipeRule<T> {

  private preceedingMonthDays: Array<[number, number]> = []
  private preceedingDays: number[] = []

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

    if (this.preceedingMonthDays.length === 0) {
      this.preceedingMonthDays = getPreceedingMonthDays(date, this.options)

      if (this.preceedingMonthDays.length === 0) {
        const next = Utils.setDateToEndOfYear(
          date.clone().subtract(1, 'year')
        )

        return this.nextPipe.run({
          invalidDate: true,
          date,
          skipToDate: next,
        })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byHourOfDay) { date.set('hour', 23) }
      if (this.options.byMinuteOfHour) { date.set('minute', 59) }
      if (this.options.bySecondOfMinute) { date.set('second', 59) }
    }

    const nextDay = this.preceedingMonthDays.shift()!;

    date.set('month', nextDay[0]).set('day', nextDay[1])

    if (this.preceedingMonthDays.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public expand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.preceedingDays.length === 0) {
      this.preceedingDays = getPreceedingDays(date, this.options)

      if (this.preceedingDays.length === 0) {
        const next = date.clone().set('day', 1).subtract(1, 'day');

        return this.nextPipe.run({
          invalidDate: true,
          date,
          skipToDate: next,
        })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byHourOfDay) { date.set('hour', 23) }
      if (this.options.byMinuteOfHour) { date.set('minute', 59) }
      if (this.options.bySecondOfMinute) { date.set('second', 59) }
    }

    const nextDay = this.preceedingDays.shift()!;

    date.set('day', nextDay)

    if (this.preceedingDays.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public filter(args: IPipeRunFn<T>) {
    const preceedingDays = getPreceedingDays(args.date, this.options)

    let validDay = false
    let nextValidDayThisMonth: number | null = null

    for (const day of preceedingDays) {
      if (args.date.get('day') === day) {
        validDay = true
        break
      } else if (args.date.get('day') > day) {
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

      next.subtract(args.date.get('day') - nextValidDayThisMonth, 'day')
    } else {
      // if no, advance the current date forward one year &
      // and set the date to whatever month would pass this filter
      next = this.cloneDateWithGranularity(args.date, 'month')

      next.set('day', 1).subtract(1, 'day')

      const nextDay = getPreceedingDays(next, this.options)[0]

      next.set('day', nextDay)
    }

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToDate: next,
    })
  }
}

function getPreceedingMonthDays<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>,
): Array<[number, number]> {
  const next = date.clone()
  const monthDays: Array<[number, number]> = []

  for (let i = next.get('month'); i >= 1; i--) {
    // get days in descending order
    const days = getPreceedingDays(next, options)

    monthDays.push(
      ...days.map(day => [next.get('month'), day] as [number, number])
    )

    // need to set `next` to the last day of the month
    next.set('day', 1).subtract(1, 'day')
  }

  return monthDays
}

function getPreceedingDays<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>,
) {
  const daysInMonth = Utils.getDaysInMonth(date.get('month'), date.get('year'))

  return uniq(
    options
      .byDayOfMonth!.filter(day => {
        return daysInMonth >= Math.abs(day)
      })
      .map(day => (day > 0 ? day : daysInMonth + day + 1))
      .sort((a, b) => {
        if (a > b) { return -1 }
        if (a < b) { return 1 }
        else { return 0 }
      })
  ).filter(day => date.get('day') >= day)
}

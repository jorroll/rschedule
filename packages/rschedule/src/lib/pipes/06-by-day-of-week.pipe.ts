import sortedUniq from 'lodash.sorteduniq'
import { DateAdapter } from '../date-adapter'
import { Options } from '../rule/rule-options'
import { Utils } from '../utilities'
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces'

export class ByDayOfWeekPipe<T extends DateAdapter<T>> extends PipeRule<T>
  implements IPipeRule<T> {

  // used to speed up some operations below;
  private cachedValidMonthDays: [string, number[]] = ['', []]
  private cachedValidYearDays: [number, number[]] = [0, []]

  // for `monthlyExpand()` and `weeklyExpand()`, upcomingDays
  // holds an array of dates within the current month that are valid
  //
  // for `yearlyExpand()`, upcomingDays holds an array of numbers,
  // each number is equal to the number of days from the start of
  // the year that a valid date exists on. i.e. set a
  // date to January 1st and then add days to the date equal to
  // one of the numbers in the array and you'll be on a valid date.
  private upcomingDays: number[] = []
  public run(args: IPipeRunFn<T>) {
    if (args.invalidDate) { return this.nextPipe.run(args) }

    if (this.options.frequency === 'MONTHLY') {
      return this.options.byDayOfMonth !== undefined
        ? this.monthlyFilter(args)
        : this.monthlyExpand(args)
    } else if (this.options.frequency === 'YEARLY') {
      if (
        this.options.byMonthOfYear !== undefined &&
        this.options.byDayOfMonth !== undefined
      ) {
        return this.monthlyFilter(args)
      }
      else if (this.options.byMonthOfYear !== undefined) {
        return this.monthlyExpand(args)
           }
      else if (this.options.byDayOfMonth !== undefined) {
        return this.yearlyFilter(args)
      } else { return this.yearlyExpand(args) }
    } else {
      return this.options.frequency === 'WEEKLY'
        ? this.weeklyExpand(args)
        : this.simpleFilter(args)
    }
  }

  public yearlyExpand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.upcomingDays.length === 0) {
      if (this.cachedValidYearDays[0] !== date.get('year')) {
        this.cachedValidYearDays = [
          date.get('year'),
          getValidYearDays(date, this.options),
        ]
      }

      this.upcomingDays = this.cachedValidYearDays[1]

      if (this.upcomingDays.length === 0) {
        return this.nextPipe.run({ date, invalidDate: true })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byHourOfDay) { date.set('hour', 0) }
      if (this.options.byMinuteOfHour) { date.set('minute', 0) }
      if (this.options.bySecondOfMinute) { date.set('second', 0) }
    }

    const nextDay = this.upcomingDays.shift()!

    Utils.setDateToStartOfYear(date).add(nextDay - 1, 'day')

    if (this.upcomingDays.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public monthlyExpand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.upcomingDays.length === 0) {
      if (
        this.cachedValidMonthDays[0] !==
        `${date.get('year')}-${date.get('month')}`
      ) {
        this.cachedValidMonthDays = [
          `${date.get('year')}-${date.get('month')}`,
          getValidMonthDays(date, this.options),
        ]
      }

      this.upcomingDays = this.cachedValidMonthDays[1]

      if (this.upcomingDays.length === 0) {
        return this.nextPipe.run({ date, invalidDate: true })
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

  public weeklyExpand(args: IPipeRunFn<T>) {
    const date = args.date

    if (this.upcomingDays.length === 0) {
      const orderedWeekdays = Utils.orderedWeekdays(this.options.weekStart)
      const currentDateIndex = orderedWeekdays.indexOf(date.get('weekday'))

      this.upcomingDays = this.options
        .byDayOfWeek! // calculate the number of days that need to be added to the current date to
        // get to a valid date
        .map(day => orderedWeekdays.indexOf(day as DateAdapter.Weekday))
        .filter(day => day >= currentDateIndex)
        .sort((a, b) => {
          if (a > b) { return 1 }
          if (b > a) { return -1 }
          return 0
        })

      if (this.upcomingDays.length === 0) {
        return this.nextPipe.run({ date, invalidDate: true })
      }

      this.expandingPipes.push(this)
    } else {
      if (this.options.byHourOfDay) { date.set('hour', 0) }
      if (this.options.byMinuteOfHour) { date.set('minute', 0) }
      if (this.options.bySecondOfMinute) { date.set('second', 0) }
    }

    const nextDay = this.upcomingDays.shift()!

    Utils.setDateToStartOfWeek(date, this.options.weekStart).add(nextDay, 'day')

    if (this.upcomingDays.length === 0) { this.expandingPipes.pop() }

    return this.nextPipe.run({ date })
  }

  public yearlyFilter(args: IPipeRunFn<T>) {
    const nextValidDateThisYear = getNextValidDateThisYear(
      args.date,
      this.options,
      this.cachedValidYearDays
    )

    const validDay = nextValidDateThisYear
      ? args.date.get('day') === nextValidDateThisYear.get('day')
      : false

    if (validDay) { return this.nextPipe.run({ date: args.date }) }

    const newDate = this.cloneDateWithGranularity(args.date, 'year').add(
      1,
      'year'
    )

    const next = nextValidDateThisYear
      ? nextValidDateThisYear
      : getNextValidDateThisYear(
          newDate,
          this.options,
          this.cachedValidYearDays
        )!

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToDate: next,
    })
  }

  public monthlyFilter(args: IPipeRunFn<T>) {
    const nextValidDateThisMonth = getNextValidDateThisMonth(
      this.cloneDateWithGranularity(args.date, 'day'),
      this.options,
      this.cachedValidMonthDays
    )

    const validDay = nextValidDateThisMonth
      ? args.date.get('day') === nextValidDateThisMonth.get('day')
      : false

    if (validDay) { return this.nextPipe.run({ date: args.date }) }

    const next = nextValidDateThisMonth
      ? nextValidDateThisMonth
      : getNextValidDateThisMonth(
          this.cloneDateWithGranularity(args.date, 'month').add(1, 'month'),
          this.options,
          this.cachedValidMonthDays
        )!

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToDate: next,
    })
  }

  public simpleFilter(args: IPipeRunFn<T>) {
    const weekdays = Utils.orderedWeekdays(this.options.weekStart)

    const validWeekdays = weekdays.filter(
      day => (this.options.byDayOfWeek as DateAdapter.Weekday[]).includes(day)
    )

    const validDay = validWeekdays.includes(args.date.get('weekday'))

    if (validDay) { return this.nextPipe.run({ date: args.date }) }

    // if the current date does not pass this filter,
    // is it possible for a date to pass this filter for the remainder of the week?
    //
    // - We know the current `options.frequency` is not yearly or monthly or weekly

    const upcomingWeekdays = weekdays.slice(
      weekdays.indexOf(args.date.get('weekday'))
    )
    const validUpcomingWeekday = validWeekdays.filter(day =>
      upcomingWeekdays.includes(day)
    )[0]

    const weekday = validUpcomingWeekday
      ? validUpcomingWeekday
      : validWeekdays[0]

    const next = this.cloneDateWithGranularity(args.date, 'day')
    const days = Utils.differenceInDaysBetweenTwoWeekdays(
      args.date.get('weekday'),
      weekday
    )

    next.add(days, 'day')

    return this.nextPipe.run({
      invalidDate: true,
      date: args.date,
      skipToDate: next,
    })
  }
}

function getNextValidDateThisYear<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>,
  validYearDaysCache: [number, number[]]
) {
  if (validYearDaysCache[0] !== date.get('year')) {
    validYearDaysCache = [date.get('year'), getValidYearDays(date, options)]
  }

  date = date
    .clone()
    .set('hour', 0)
    .set('minute', 0)
    .set('second', 0)

  const currentYearDay = date.get('yearday')

  const dayNumber = validYearDaysCache[1].find(
    dayNumber => dayNumber >= currentYearDay
  )

  if (dayNumber) {
    return Utils.setDateToStartOfYear(date).add(dayNumber - 1, 'day')
  }
  else { return null }
}

function getValidYearDays<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>
) {
  const weekdays: DateAdapter.Weekday[] = []
  const specificWeekdays: Array<[DateAdapter.Weekday, number]> = []
  let hasPositiveWeekdays = false
  let hasNegativeWeekdays = false
  const validDates: number[] = []

  options.byDayOfWeek!.forEach(day => {
    if (!Array.isArray(day)) { weekdays.push(day) }
    else {
      specificWeekdays.push(day)
      day[1] > 0 ? (hasPositiveWeekdays = true) : (hasNegativeWeekdays = true)
    }
  })

  const firstWeekdays: { [key: string]: number } = {}
  const lastWeekdays: { [key: string]: number } = {}
  const lastDayOfYear = Utils.getDaysInYear(date.get('year'))

  if (hasPositiveWeekdays || weekdays.length > 0) {
    const startingDate = Utils.setDateToStartOfYear(date.clone())

    firstWeekdays[startingDate.get('weekday')] = 1
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 2
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 3
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 4
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 5
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 6
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 7
  }

  if (hasNegativeWeekdays) {
    const endingDate = Utils.setDateToEndOfYear(date.clone())

    lastWeekdays[endingDate.get('weekday')] = lastDayOfYear
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] =
      lastDayOfYear - 1
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] =
      lastDayOfYear - 2
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] =
      lastDayOfYear - 3
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] =
      lastDayOfYear - 4
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] =
      lastDayOfYear - 5
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] =
      lastDayOfYear - 6
  }

  for (const weekday of specificWeekdays) {
    let nextYearDay: number

    if (weekday[1] < 0) {
      nextYearDay = lastWeekdays[weekday[0]] + (weekday[1] + 1) * 7
    } else {
      nextYearDay = firstWeekdays[weekday[0]] + (weekday[1] - 1) * 7
    }

    if (nextYearDay > lastDayOfYear || nextYearDay < 0) {
      continue
    }

    validDates.push(nextYearDay)
  }

  for (const weekday of weekdays) {
    let nextYearDay = firstWeekdays[weekday]

    while (nextYearDay <= lastDayOfYear) {
      validDates.push(nextYearDay)
      nextYearDay = nextYearDay + 7
    }
  }

  return sortedUniq(
    validDates
      .sort((a, b) => {
        if (a > b) { return 1 }
        else if (b > a) { return -1 }
        else { return 0 }
      })
      .filter(yearday => date.get('yearday') <= yearday)
  )
}

function getNextValidDateThisMonth<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>,
  validMonthDaysCache: [string, number[]]
) {
  if (validMonthDaysCache[0] !== `${date.get('year')}-${date.get('month')}`) {
    validMonthDaysCache = [
      `${date.get('year')}-${date.get('month')}`,
      getValidMonthDays(date, options),
    ]
  }

  date = date
    .clone()
    .set('hour', 0)
    .set('minute', 0)
    .set('second', 0)

  const currentDay = date.get('day')

  const day = validMonthDaysCache[1].find(day => day >= currentDay)

  if (day) { return date.set('day', day) }
  else { return null }
}

function getValidMonthDays<T extends DateAdapter<T>>(
  date: T,
  options: Options.ProcessedOptions<T>
) {
  const weekdays: DateAdapter.Weekday[] = []
  const specificWeekdays: Array<[DateAdapter.Weekday, number]> = []
  let hasPositiveWeekdays = false
  let hasNegativeWeekdays = false
  const validDates: number[] = []

  options.byDayOfWeek!.forEach(day => {
    if (!Array.isArray(day)) { weekdays.push(day) }
    else {
      specificWeekdays.push(day)
      day[1] > 0 ? (hasPositiveWeekdays = true) : (hasNegativeWeekdays = true)
    }
  })

  const firstWeekdays: { [key: string]: number } = {}
  const lastWeekdays: { [key: string]: number } = {}
  const daysInMonth = Utils.getDaysInMonth(date.get('month'), date.get('year'))

  if (hasPositiveWeekdays || weekdays.length > 0) {
    const startingDate = date.clone().set('day', 1)

    firstWeekdays[startingDate.get('weekday')] = 1
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 2
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 3
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 4
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 5
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 6
    firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 7
  }

  if (hasNegativeWeekdays) {
    const endingDate = date.clone().set('day', daysInMonth)

    lastWeekdays[endingDate.get('weekday')] = daysInMonth
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 1
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 2
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 3
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 4
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 5
    lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 6
  }

  for (const weekday of specificWeekdays) {
    let nextDay: number

    if (weekday[1] < 0) {
      nextDay = lastWeekdays[weekday[0]] + (weekday[1] + 1) * 7
    } else {
      nextDay = firstWeekdays[weekday[0]] + (weekday[1] - 1) * 7
    }

    if (nextDay > daysInMonth || nextDay < 0) {
      continue
    }

    validDates.push(nextDay)
  }

  for (const weekday of weekdays) {
    let nextDay = firstWeekdays[weekday]

    while (nextDay <= daysInMonth) {
      validDates.push(nextDay)
      nextDay = nextDay + 7
    }
  }

  return sortedUniq(
    validDates
      .sort((a, b) => {
        if (a > b) { return 1 }
        else if (b > a) { return -1 }
        else { return 0 }
      })
      .filter(monthday => date.get('day') <= monthday)
  )
}

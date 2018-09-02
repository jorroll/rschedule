import { IDateAdapter } from './date-adapter'
import { Options } from './rule'

export namespace Utils {

  /** ['SU','MO','TU','WE','TH','FR','SA'] */
  export const WEEKDAYS: IDateAdapter.Weekday[] = [
    'SU',
    'MO',
    'TU',
    'WE',
    'TH',
    'FR',
    'SA',
  ]

  export const MILLISECONDS_IN_SECOND = 1000
  export const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60
  export const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60
  export const MILLISECONDS_IN_DAY = MILLISECONDS_IN_HOUR * 24
  export const MILLISECONDS_IN_WEEK = MILLISECONDS_IN_DAY * 7

  export function weekdayToInt(
    weekday: IDateAdapter.Weekday,
    wkst: IDateAdapter.Weekday = 'SU'
  ) {
    const weekdays = orderedWeekdays(wkst)

    return weekdays.indexOf(weekday)
  }

  export function orderedWeekdays(
    wkst: IDateAdapter.Weekday = 'SU'
  ) {
    const wkdays = WEEKDAYS.slice()
    let index = wkdays.indexOf(wkst)

    while (index !== 0) {
      shiftArray(wkdays)
      index--
    }

    return wkdays
  }

  export function shiftArray(array: any[], from: 'first' | 'last' = 'first') {
    if (array.length === 0) { return array }
    else if (from === 'first') { array.push(array.shift()) }
    else { array.unshift(array.pop()) }

    return array
  }

  export function sortDates<T extends {isAfter: (arg: any) => boolean}>(dates: T[]) {
    return dates.sort((a, b) => {
      if (a.isAfter(b)) { return 1 }
      else if (b.isAfter(a)) { return -1 }
      else { return 0 }
    })
  }

  /**
   * Calculates the forward distance in days between two weekdays.
   */
  export function differenceInDaysBetweenTwoWeekdays(
    a: IDateAdapter.Weekday,
    b: IDateAdapter.Weekday
  ) {
    const result = Utils.WEEKDAYS.indexOf(a) - Utils.WEEKDAYS.indexOf(b)
  
    return result > 0 ? 7 - result : Math.abs(result)
  }  

  /**
   * Returns the earliest date in an array of dates. If the array is empty,
   * return `null`.
   * @param dates
   */
  export function getEarliestDate(dates: IDateAdapter[]) {
    if (dates.length === 0) { return null }
    else if (dates.length === 1) { return dates[0] }

    return dates.reduce((prev, curr) => {
      if (curr.isBefore(prev)) { return curr }
      else { return prev }
    })
  }

  /**
   * Returns the days in the given month.
   * 
   * @param month base-1
   * @param year 
   */
  export function getDaysInMonth(month: number, year: number) {
    const block = {
      1: 31,
      2: getDaysInFebruary(year),
      3: 31,
      4: 30,
      5: 31,
      6: 30,
      7: 31,
      8: 31,
      9: 30,
      10: 31,
      11: 30,
      12: 31,
    }

    return (block as { [key: number]: number })[month]
  }

  function getDaysInFebruary(year: number) {
    return isLeapYear(year) ? 29 : 28
  }

  // taken from date-fn
  export function isLeapYear(year: number) {
    return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)  
  }

  export function getDaysInYear(year: number) {
    return isLeapYear(year) ? 366 : 365
  }

  /**
   * Given year, month, and day, returns the day of the year.
   * Month is base 1.
   */
  export function getYearDay(year: number, month: number, day: number) {
    // let days = day

    // let i = 1
    // while (i <= month - 1) {
    //   days += getDaysInMonth(i, year)

    //   i++
    // }

    const start = new Date(year,0,1).valueOf()

    const end = new Date(year,month-1,day).valueOf()

    const days = Math.ceil((end - start) / MILLISECONDS_IN_DAY) + 1

    return days
  }

  export function setDateToStartOfYear(date: IDateAdapter) {
    return date.set('month', 1).set('day', 1)
  }

  export function setDateToEndOfYear(date: IDateAdapter) {
    return date.set('month', 12).set('day', 31)
  }

  export function setDateToEndOfMonth(date: IDateAdapter) {
    return date.add(1, 'month').set('day', 1).subtract(1, 'day')
  }

  export function setDateToStartOfWeek(
    date: IDateAdapter,
    wkst: IDateAdapter.Weekday
  ) {
    const index = orderedWeekdays(wkst).indexOf(date.get('weekday'))
    return date.subtract(index, 'day')
  }

  export function setDateToEndOfWeek(date: IDateAdapter, wkst: IDateAdapter.Weekday) {
    const index = orderedWeekdays(wkst).indexOf(date.get('weekday'))
    return date.add(6 - index, 'day')
  }

  export function setDateToStartOfDay(date: IDateAdapter) {
    return date.set('hour', 0).set('minute', 0).set('second', 0)
  }

  export function setDateToEndOfDay(date: IDateAdapter) {
    return date.set('hour', 23).set('minute', 59).set('second', 59)
  }


  /**
   *
   * @param date
   * @param wkst
   * @return [numberOfWeeks, weekStartOffset]
   */
  export function getWeeksInYear(
    date: IDateAdapter,
    wkst: IDateAdapter.Weekday
  ): [number, number] {
    date = date.clone()
    const year = date.get('year')
    setDateToStartOfYear(date)
    const startWeekday = date.get('weekday')

    // As explained in the ICAL spec, week 53 only occurs if the year
    // falls on a specific weekday. The first element in each array is the
    // required weekday for that key on a regular year. On a leapyear, either day
    // will work.
    const keys: any = {
      MO: ['TH', 'WE'],
      TU: ['FR', 'TH'],
      WE: ['SA', 'FR'],
      TH: ['SU', 'SA'],
      FI: ['MO', 'SU'],
      SA: ['TU', 'MO'],
      SU: ['WE', 'TU'],
    }

    let weekStartOffset = 0
    while (date.get('weekday') !== wkst) {
      date.add(1, 'day')
      weekStartOffset++
    }

    let numberOfWeeks: number

    if (isLeapYear(year)) {
      numberOfWeeks = keys[wkst].includes(startWeekday) ? 53 : 52
    } else {
      numberOfWeeks = startWeekday === keys[wkst][0] ? 53 : 52
    }

    // the end of the year is not necessarily the end of the last week in a year
    // setDateToEndOfYear(date)

    // const endWeekday = date.get('weekday')

    // const daysInLastWeek = orderedWeekdays(wkst).indexOf(endWeekday) + 1

    return [numberOfWeeks, weekStartOffset]
  }

  export function ruleFrequencyToDateAdapterUnit(frequency: Options.Frequency) {
    switch (frequency) {
      case 'YEARLY':
        return 'year'
      case 'MONTHLY':
        return 'month'
      case 'WEEKLY':
        return 'week'
      case 'DAILY':
        return 'day'
      case 'HOURLY':
        return 'hour'
      case 'MINUTELY':
        return 'minute'
      case 'SECONDLY':
        return 'second'
    }
  }

  export function dateToStandardizedString(date: {
    get(unit: IDateAdapter.Unit): number
  }) {
    let string = `${date.get('year')}${toTwoCharString(
      date.get('month')
    )}${toTwoCharString(date.get('day'))}T${toTwoCharString(
      date.get('hour')
    )}${toTwoCharString(date.get('minute'))}${toTwoCharString(
      date.get('second')
    )}`

    if (date.get('millisecond')) {
      string = `${string}.${date.get('millisecond')}`
    }

    return string
  }

  function toTwoCharString(int: number) {
    if (int < 10) { return `0${int}` }
    else { return `${int}` }
  }

  /** 
   * Calculates the difference between two dates of a given unit.
   * The first date argument is subtracted from the second. I.e.
   * when going forward in time, the second date is larger than the first.
   */
  export function unitDifferenceBetweenDates(
    first: IDateAdapter,
    second: IDateAdapter,
    unit: IDateAdapter.Unit | 'week',
  ) {
    let intervalDuration: number;

    switch (unit) {
      case 'year':
        return second.get('year') - first.get('year')
      case 'month':
        return (second.get('year') - first.get('year')) * 12 + (second.get('month') - first.get('month'))
      case 'week':
        intervalDuration = MILLISECONDS_IN_WEEK
        break
      case 'day':
        intervalDuration = MILLISECONDS_IN_DAY
        break
      case 'hour':
        intervalDuration = MILLISECONDS_IN_HOUR
        break
      case 'minute':
        intervalDuration = MILLISECONDS_IN_MINUTE
        break
      case 'second':
        intervalDuration = MILLISECONDS_IN_SECOND
        break
      case 'millisecond':
        intervalDuration = 1  
        break
      default:
        throw new Error ('Unexpected `unit` value')
    }

    const sign = Math.sign(second.valueOf() - first.valueOf())
    
    return Math.floor(Math.abs(second.valueOf() - first.valueOf()) / intervalDuration) * sign
  }
}

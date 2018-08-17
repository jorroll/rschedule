import { DateAdapter } from './date-adapter'
import { Options } from './rule'

export namespace Utils {

  /** ['SU','MO','TU','WE','TH','FR','SA'] */
  export const WEEKDAYS: DateAdapter.Weekday[] = [
    'SU',
    'MO',
    'TU',
    'WE',
    'TH',
    'FR',
    'SA',
  ]

  export const MILLISECONDS_IN_DAY = 86400000
  export const MILLISECONDS_IN_HOUR = 3600000
  export const MILLISECONDS_IN_MINUTE = 60000
  export const MILLISECONDS_IN_SECOND = 1000

  export function weekdayToInt<T extends DateAdapter<T>>(
    weekday: DateAdapter.Weekday,
    wkst: DateAdapter.Weekday = 'SU'
  ) {
    const weekdays = orderedWeekdays(wkst)

    return weekdays.indexOf(weekday)
  }

  export function orderedWeekdays<T extends DateAdapter<T>>(
    wkst: DateAdapter.Weekday = 'SU'
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

  export function sortDates<T extends DateAdapter<T>>(dates: T[]) {
    return dates.sort((a, b) => {
      if (a.isAfter(b)) { return 1 }
      else if (b.isAfter(a)) { return -1 }
      else { return 0 }
    })
  }

  export function differenceInDaysBetweenTwoWeekdays(
    a: DateAdapter.Weekday,
    b: DateAdapter.Weekday
  ) {
    const result = Utils.WEEKDAYS.indexOf(a) - Utils.WEEKDAYS.indexOf(b)
  
    return result > 0 ? 7 - result : Math.abs(result)
  }  

  /**
   * Returns the earliest date in an array of dates. If the array is empty,
   * return `null`.
   * @param dates
   */
  export function getEarliestDate<T extends DateAdapter<T>>(dates: T[]) {
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

  export function setDateToStartOfYear<T extends DateAdapter<T>>(date: T) {
    return date.set('month', 1).set('day', 1)
  }

  export function setDateToEndOfYear<T extends DateAdapter<T>>(date: T) {
    return date.set('month', 12).set('day', 31)
  }

  export function setDateToEndOfMonth<T extends DateAdapter<T>>(date: T) {
    return date.add(1, 'month').set('day', 1).subtract(1, 'day')
  }

  export function setDateToStartOfWeek<T extends DateAdapter<T>>(
    date: T,
    wkst: DateAdapter.Weekday
  ) {
    const index = orderedWeekdays(wkst).indexOf(date.get('weekday'))
    return date.subtract(index, 'day')
  }

  export function setDateToEndOfWeek<T extends DateAdapter<T>>(date: T, wkst: DateAdapter.Weekday) {
    const index = orderedWeekdays(wkst).indexOf(date.get('weekday'))
    return date.add(6 - index, 'day')
  }


  /**
   *
   * @param date
   * @param wkst
   * @return [numberOfWeeks, weekStartOffset]
   */
  export function getWeeksInYear<T extends DateAdapter<T>>(
    date: T,
    wkst: DateAdapter.Weekday
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

  export function dateToStandardizedString<T extends DateAdapter<T>>(date: T) {
    return `${date.get('year')}${toTwoCharString(
      date.get('month')
    )}${toTwoCharString(date.get('day'))}T${toTwoCharString(
      date.get('hour')
    )}${toTwoCharString(date.get('minute'))}${toTwoCharString(
      date.get('second')
    )}`
  }

  function toTwoCharString(int: number) {
    if (int < 10) { return `0${int}` }
    else { return `${int}` }
  }

  /**
   * This function tries to detect if the client is in the northern
   * hemisphere. It returns `true` if yes, `false` if the client is in the 
   * southern hemisphere, and `null` if unknown. It will only work if the 
   * client observes DST.
   * 
   * This is fine, because it is used to correct for DST changes, which 
   * happen in opposite directions based on the hemisphere. If a timezone 
   * doesn't observe DST, then we don't need to correct for it anyway.
   */
  export function isInNorthernHemisphere<T extends DateAdapter<T>>(date: T) {
    date = date.clone();

    const jan = -date.set('month', 1).set('day', 1).utcOffset
    const jul = -date.set('month', 6).set('day', 1).utcOffset
    const diff= jan-jul;
    if(diff> 0) return true;
    else if(diff< 0) return false
    else return null;
  }
}

import {
  DateAdapter,
  IDateAdapterConstructor,
} from '../date-adapter'
import { Options } from '../rule/rule-options'
import { Utils } from '../utilities'

export class ICalStringParseError extends Error {}

const UNIMPLEMENTED_RULE_OPTION =
  'rule option is unsupported by rSchedule ' +
  'and I have no plans to implement it. Pull requests are welcome though.'

/**
 * Parses an array of ICAL strings and returns an object containing
 * `rrules`, `exrules`, `rdates`, and `exdates`. The `rrules` and `exrules`
 * properties contain `ProvidedOptions` objects and the `rdates` and `exdates`
 * properties contain `DateAdapter` objects built with a `DateAdapter`
 * constructor you provide. `parseICalStrings` will use the date adapter constructor's
 * `fromTimeObject` static method to instantiate new instances.
 *
 * @param icalStrings
 * @param dateAdapterConstructor
 */

export function parseICalStrings<
  T extends IDateAdapterConstructor<T>,
  K extends DateAdapter<InstanceType<T>> = InstanceType<T>
>(
  icalStrings: string[],
  dateAdapterConstructor: T
): {
  rrules: Array<Options.ProvidedOptions<K>>
  rdates: K[]
  exdates: K[]
} {
  const rrules: Array<Options.ProvidedOptions<K>> = []
  const rdates: K[] = []
  const exdates: K[] = []

  icalStrings.forEach(ical => {
    const parts = ical.split('\n')
    const dtstart = dateAdapterConstructor.fromTimeObject(
      parseDTStart(parts.shift())
    )[0]

    parts.forEach(part => {
      const parts = part.split(':')
      const name = parts[0]

      if (name === 'RRULE') {
        const options = parts[1].split(';').map(op => op.split('='))
        const parsedOptions: any = {
          start: dtstart,
        }

        options.forEach(option => {
          switch (option[0]) {
            case 'FREQ':
              parsedOptions.frequency = parseFrequency(option[1])
              break
            case 'UNTIL':
              parsedOptions.until = parseUntil(
                option[1],
                dateAdapterConstructor,
                dtstart
              )
              break
            case 'COUNT':
              parsedOptions.count = parseCount(option[1])
              break
            case 'INTERVAL':
              parsedOptions.interval = parseInterval(option[1])
              break
            case 'BYSECOND':
              parsedOptions.bySecondOfMinute = parseBySecond(option[1])
              break
            case 'BYMINUTE':
              parsedOptions.byMinuteOfHour = parseByMinute(option[1])
              break
            case 'BYHOUR':
              parsedOptions.byHourOfDay = parseByHour(option[1])
              break
            case 'BYDAY':
              parsedOptions.byDayOfWeek = parseByDay(option[1])
              break
            case 'BYMONTHDAY':
              parsedOptions.byDayOfMonth = parseByMonthDay(option[1])
              break
            case 'BYYEARDAY':
              throw new ICalStringParseError(
                `"BYYEARDAY" ${UNIMPLEMENTED_RULE_OPTION}`
              )
            case 'BYWEEKNO':
              throw new ICalStringParseError(
                `"BYWEEKNO" ${UNIMPLEMENTED_RULE_OPTION}`
              )
            case 'BYMONTH':
              parsedOptions.byMonthOfYear = parseByMonth(option[1])
              break
            case 'BYSETPOS':
              throw new ICalStringParseError(
                `"BYSETPOS" ${UNIMPLEMENTED_RULE_OPTION}`
              )
            case 'WKST':
              parsedOptions.weekStart = parseWkst(option[1])
              break
            default:
              throw new ICalStringParseError(`Unknown ICAL rule "${option[0]}"`)
          }
        })

        rrules.push(parsedOptions)
      } else if (name === 'RDATE') {
        const time = dateAdapterConstructor.fromTimeObject(
          parseDatetime(parts[1])
        )
        rdates.push(...time)
      } else if (name === 'EXDATE') {
        const time = dateAdapterConstructor.fromTimeObject(
          parseDatetime(parts[1])
        )
        exdates.push(...time)
      } else {
        throw new ICalStringParseError(`Unsupported ICAL part "${name}"`)
      }
    })
  })

  return {
    rdates,
    exdates,
    rrules,
  }
}

/**
 * This function accepts the DTSTART portion of an ICAL string
 * and returns an object containing the `time`, broken up into an array
 * of `[YYYY, MM, DD, HH, MM, SS]`, the `timezone`, if applicable, and
 * the `raw` DTSTART text.
 *
 * If it encounters a parsing error, a `ICalStringParseError` will be thrown.
 *
 * @param text The DTSTART portion of an ICAL string
 */
export function parseDTStart(text?: string) {
  const parts = text && text.substring(0, 7)

  try {
    if (parts !== 'DTSTART') { throw new Error('') }

    const timeObj = parseDatetime(text!.substring(8))

    if (timeObj.datetimes.length !== 1) { throw new Error('') }

    return timeObj
  } catch (e) {
    throw new ICalStringParseError(`Invalid "DTSTART" value "${text}"`)
  }
}

export type ParsedDatetime =
  | [number,number,number,number,number,number]
  | [number,number,number,number,number]
  | [number,number,number,number]
  | [number,number,number]

/**
 * This function parses an ICAL time string, throwing a `ICalStringParseError`
 * if it runs into problems, and returns an object with three properties:
 *
 * 1. `datetimes`: an array of parsed time values each in
 *   `[YYYY, MM, DD, HH, MM, SS]` format, where `HH`, `MM`, and `SS`
 *   may be `undefined`.
 * 2. `timezone`: the timezone all of the datetimes are in.
 *   - If local timezone: `undefined`
 *   - If UTC timezone: `"UTC"`
 *   - If the datetime is a DATE: `"DATE"`
 *   - Else: contains the ICAL formatted timezone (e.g. `"America/New_York"`)
 * 3. `raw`: The raw ICAL time string
 *
 * @param text the raw ICAL time text
 */
export function parseDatetime(text: string) {
  const parts = text.split(':')

  let unparsedTime: string
  let datetimes: ParsedDatetime[]
  let timezone: string | undefined

  try {
    if (parts.length === 1) {
      // no TZID / value part
      timezone = parts[0].search('Z') !== -1 ? 'UTC' : undefined
      unparsedTime = parts[0].split('Z')[0]
    } else {
      // has TZID part
      const timeLabel = parts[0].split('=')

      if (timeLabel.length !== 2) { throw new Error('') }
      else if (timeLabel[0] === 'TZID') {
        timezone = timeLabel[1]
        unparsedTime = parts[1]
      } else if (timeLabel[0] === 'value' && timeLabel[1] === 'date') {
        timezone = 'DATE'
        unparsedTime = parts[1]
      } else { throw new Error('') }
    }

    datetimes = unparsedTime.split(',').map(time => {
      const newTime = time.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
      newTime && newTime.shift()
      if (newTime) {
        return newTime.map(str => parseInt(str)) as ParsedDatetime
      }
      else { throw new Error('') }
    })
  } catch (e) {
    throw new ICalStringParseError(`Invalid ICAL date/time string "${text}"`)
  }

  return { datetimes, timezone, raw: text }
}

export function parseFrequency(text: string) {
  if (
    ![
      'SECONDLY',
      'MINUTELY',
      'HOURLY',
      'DAILY',
      'WEEKLY',
      'MONTHLY',
      'YEARLY',
    ].includes(text)
  ) {
    throw new ICalStringParseError(`Invalid FREQ value "${text}"`)
  }
  else {
    return text
  }
}

// Here we say that the type `T` must be a constructor that returns a DateAdapter
// complient type
export function parseUntil<T extends IDateAdapterConstructor<T>>(
  text: string,
  dateAdapterConstructor: T,
  start: InstanceType<T> & DateAdapter<T>
) {
  const parsedDatetime = parseDatetime(text)

  if (parsedDatetime.datetimes.length !== 1) {
    throw new ICalStringParseError(`Invalid UNTIL value "${text}"`)
  }

  const date = dateAdapterConstructor.fromTimeObject(parsedDatetime)[0]
  date.timezone = start.timezone
  return date
}

export function parseCount(text: string) {
  const int = parseInt(text)
  if (typeof int !== 'number' || isNaN(int)) {
    throw new ICalStringParseError(`Invalid COUNT value "${text}"`)
  }
  return int
}

export function parseInterval(text: string) {
  const int = parseInt(text)
  if (typeof int !== 'number' || isNaN(int)) {
    throw new ICalStringParseError(`Invalid INTERVAL value "${text}"`)
  }
  return int
}

export function parseBySecond(text: string) {
  return text.split(',').map(text => {
    const int = parseInt(text)
    if (typeof int !== 'number' || isNaN(int)) {
      throw new ICalStringParseError(`Invalid BYSECOND value "${text}"`)
    }
    return int
  })
}

export function parseByMinute(text: string) {
  return text.split(',').map(text => {
    const int = parseInt(text)
    if (typeof int !== 'number' || isNaN(int)) {
      throw new ICalStringParseError(`Invalid BYMINUTE value "${text}"`)
    }
    return int
  })
}

export function parseByHour(text: string) {
  return text.split(',').map(text => {
    const int = parseInt(text)
    if (typeof int !== 'number' || isNaN(int)) {
      throw new ICalStringParseError(`Invalid BYHOUR value "${text}"`)
    }
    return int
  })
}

export function parseByDay(text: string) {
  return text.split(',').map(text => {
    text = text.trim()

    if (text.length > 2 && text.length < 5) {
      let number: number
      let weekday: string

      if (text[0] === '-') {
        number = parseInt(text.slice(0, 2))
        weekday = text.slice(2)
      } else {
        number = parseInt(text[0])
        weekday = text.slice(1)
      }

      if (!Utils.WEEKDAYS.includes(weekday as any)) {
        throw new ICalStringParseError(`Invalid BYDAY value "${text}"`)
      }

      return [weekday, number] as [DateAdapter.Weekday, number]
    } else if (!Utils.WEEKDAYS.includes(text as any)) {
      throw new ICalStringParseError(`Invalid BYDAY value "${text}"`)
    } else {
      return text as DateAdapter.Weekday
    }
  })
}

export function parseByMonthDay(text: string) {
  return text.split(',').map(text => {
    const int = parseInt(text)
    if (typeof int !== 'number' || isNaN(int)) {
      throw new ICalStringParseError(`Invalid BYMONTHDAY value "${text}"`)
    }
    return int
  })
}

export function parseByMonth(text: string) {
  return text.split(',').map(text => {
    const int = parseInt(text)
    if (typeof int !== 'number' || isNaN(int)) {
      throw new ICalStringParseError(`Invalid BYMONTH value "${text}"`)
    }
    return int
  })
}

export function parseWkst(text: string) {
  if (!Utils.WEEKDAYS.includes(text as any)) {
    throw new ICalStringParseError(`Invalid WKST value "${text}"`)
  }

  return text
}

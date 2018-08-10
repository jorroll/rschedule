import { DateAdapter } from '../date-adapter'
import { buildValidatedRuleOptions, Options } from '../rule/rule-options'
import { Utils } from '../utilities'

export class ICalStringSerialzeError extends Error {}

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
export function ruleOptionsToIcalString<T extends DateAdapter<T>>(
  options: Options.ProvidedOptions<T>,
  type: 'RRULE' | 'EXRULE' = 'RRULE'
): string {
  // First validate options object, but don't use the result
  buildValidatedRuleOptions(options)

  let icalString: string

  const start = options.start

  icalString = `DTSTART:${start.toICal()}\n${type}:`

  const stringOptions: string[] = []

  for (const option in options) {
    if (options.hasOwnProperty(option)) {
      switch (option) {
        case 'frequency':
          stringOptions.push(`FREQ=${options.frequency}`)
          break
        case 'interval':
          stringOptions.push(`INTERVAL=${options.interval}`)
          break
        case 'until':
          stringOptions.push(
            `UNTIL=${options.until!.toICal(!!start.get('timezone'))}`
          )
          break
        case 'count':
          stringOptions.push(`COUNT=${options.count}`)
          break
        case 'bySecondOfMinute':
          stringOptions.push(`BYSECOND=${options.bySecondOfMinute!.join(',')}`)
          break
        case 'byMinuteOfHour':
          stringOptions.push(`BYMINUTE=${options.byMinuteOfHour!.join(',')}`)
          break
        case 'byHourOfDay':
          stringOptions.push(`BYHOUR=${options.byHourOfDay!.join(',')}`)
          break
        case 'byDayOfWeek':
          stringOptions.push(
            `BYDAY=${serializeByDayOfWeek(options.byDayOfWeek!)}`
          )
          break
        case 'byDayOfMonth':
          stringOptions.push(`BYMONTHDAY=${options.byDayOfMonth!.join(',')}`)
          break
        case 'byMonthOfYear':
          stringOptions.push(`BYMONTH=${options.byMonthOfYear!.join(',')}`)
          break
        case 'weekStart':
          stringOptions.push(`WKST=${options.weekStart}`)
          break
      }
    }
  }

  return icalString.concat(stringOptions.join(';'))
}

function serializeByDayOfWeek(args: Options.ByDayOfWeek[]) {
  return args
    .map(arg => (Array.isArray(arg) ? `${arg[1]}${arg[0]}` : arg))
    .join(',')
}

/**
 * Converts an array of dates into an ICAL string containing RDATEs.
 * All dates must be in the same timezone.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
export function datesToIcalString<T extends DateAdapter<T>>(
  dates: T[],
  type: 'RDATE' | 'EXDATE' = 'RDATE'
) {
  if (dates.length === 0) {
    throw new ICalStringSerialzeError(
      '`datesToIcalString()` must recieve at least one date'
    )
  }
  let icalString: string

  dates.sort((a, b) => {
    if (a.isAfter(b)) { return 1 }
    else if (b.isAfter(a)) { return -1 }
    else { return 0 }
  })

  const start = dates[0]
  const seperator = [undefined, 'UTC'].includes(start.get('timezone'))
    ? ':'
    : ';'

  icalString = `DTSTART:${start.toICal()}\n${type}${seperator}`

  return icalString.concat(dates.map(date => date.toICal()).join(','))
}

export function dateAdapterToICal<T extends DateAdapter<T>>(
  date: T,
  utc?: boolean
) {
  const timezone = utc ? 'UTC' : date.get('timezone')

  switch (timezone) {
    case undefined:
      return `${Utils.dateToStandardizedString(date)}`
    case 'UTC':
      return `${Utils.dateToStandardizedString(date)}Z`
    default:
      return `TZID=${date.get('timezone')}:${Utils.dateToStandardizedString(
        date
      )}`
  }
}

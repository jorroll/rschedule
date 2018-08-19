import { DateAdapter } from '../date-adapter'
import { buildValidatedRuleOptions, Options } from '../rule/rule-options'
import { Utils } from '../utilities'

export class ICalStringSerialzeError extends Error {}

/**
 * Converts an options object to an [ICAL](https://tools.ietf.org/html/rfc5545)
 * complient string.
 *
 * @param options ProvidedOptions
 * @param type Determins if the serialized options object is labeled as an
 * "RRULE" or an "EXRULE".
 */
export function ruleOptionsToIcalString<T extends DateAdapter<T>>(
  options: Options.ProvidedOptions<T>,
  type: 'RRULE' | 'EXRULE'
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
            `UNTIL=${options.until!.toICal({format: !!start.timezone ? 'UTC' : undefined})}`
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
  const seperator = [undefined, 'UTC'].includes(start.timezone)
    ? ':'
    : ';'

  icalString = `DTSTART:${start.toICal()}\n${type}${seperator}`

  return icalString.concat(dates.map(date => date.toICal()).join(','))
}

export function dateAdapterToICal<T extends DateAdapter<T>>(
  date: T,
  utc?: boolean
) {
  const timezone = utc ? 'UTC' : date.timezone

  switch (timezone) {
    case undefined:
      return `${Utils.dateToStandardizedString(date)}`
    case 'UTC':
      return `${Utils.dateToStandardizedString(date)}Z`
    default:
      return `TZID=${date.timezone}:${Utils.dateToStandardizedString(
        date
      )}`
  }
}

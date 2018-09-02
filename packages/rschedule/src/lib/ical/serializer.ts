import { IDateAdapter, DateAdapter, DateAdapterConstructor, IDateAdapterConstructor } from '../date-adapter'
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
export function ruleOptionsToIcalString<T extends DateAdapterConstructor>(
  dateAdapterConstructor: T,
  options: Options.ProvidedOptions<T>,
  type: 'RRULE' | 'EXRULE'
): string {
  // First validate options object, but don't use the result
  buildValidatedRuleOptions(dateAdapterConstructor, options)

  const dateAdapter: IDateAdapterConstructor<T> = dateAdapterConstructor as any;

  let icalString: string

  const start = dateAdapter.isInstance(options.start)
    ? options.start
    : new dateAdapter(options.start)

  let until: IDateAdapter | undefined
  if (options.until) {
    until = dateAdapter.isInstance(options.until)
      ? options.until
      : new dateAdapter(options.until)
  }

  const seperator = [undefined, 'UTC'].includes(start.get('timezone'))
    ? ':'
    : ';';

  icalString = `DTSTART${seperator}${start.toICal()}\n${type}:`;

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
            `UNTIL=${until!.toICal({format: !!start.get('timezone') ? 'UTC' : undefined})}`
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
 * Converts an array of dates into an ICAL string containing RDATEs/EXDATEs.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
export function datesToIcalString<T extends DateAdapterConstructor>(
  dates: DateAdapter<T>[],
  type: 'RDATE' | 'EXDATE' = 'RDATE'
) {
  if (dates.length === 0) {
    throw new ICalStringSerialzeError(
      '`datesToIcalString()` must recieve at least one date'
    )
  }
  dates = dates.slice()

  let icalString: string

  dates.sort((a, b) => {
    if (a.isAfter(b)) { return 1 }
    else if (b.isAfter(a)) { return -1 }
    else { return 0 }
  })

  const start = dates.pop()!
  const seperator = [undefined, 'UTC'].includes(start.get('timezone'))
    ? ':'
    : ';';

  icalString = `DTSTART${seperator}${start.toICal()}\n${type}${seperator}${start.toICal()}`

  dates.forEach(date => {
    const seperator = [undefined, 'UTC'].includes(date.get('timezone'))
      ? ':'
      : ';';

    icalString.concat(`\n${type}${seperator}${date.toICal()}`)
  })

  return icalString
}

export function dateAdapterToICal<T extends DateAdapterConstructor>(
  date: DateAdapter<T>,
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

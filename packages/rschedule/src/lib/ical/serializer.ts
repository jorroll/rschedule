import {
  DateAdapter,
  DateAdapterConstructor,
  IDateAdapter,
  IDateAdapterConstructor,
} from '../date-adapter';
import { buildValidatedRuleOptions, Options } from '../rule/rule-options';
import { Utils } from '../utilities';

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
  ruleConfig: Options.ProvidedOptions<T>,
  type: 'RRULE' | 'EXRULE',
  options: {
    excludeDTSTART?: boolean;
  } = {},
): string {
  // First validate options object, but don't use the result
  buildValidatedRuleOptions(dateAdapterConstructor, ruleConfig);

  const dateAdapter: IDateAdapterConstructor<T> = dateAdapterConstructor as any;

  let icalString: string;

  const start = dateAdapter.isInstance(ruleConfig.start)
    ? ruleConfig.start
    : new dateAdapter(ruleConfig.start);

  let until: IDateAdapter | undefined;
  if (ruleConfig.until) {
    until = dateAdapter.isInstance(ruleConfig.until)
      ? ruleConfig.until
      : new dateAdapter(ruleConfig.until);
  }

  icalString = options.excludeDTSTART
    ? `${type}:`
    : `${buildDTStart(start)}\n${type}:`;

  const stringOptions: string[] = [];

  for (const option in ruleConfig) {
    if (ruleConfig.hasOwnProperty(option)) {
      switch (option) {
        case 'frequency':
          stringOptions.push(`FREQ=${ruleConfig.frequency}`);
          break;
        case 'interval':
          stringOptions.push(`INTERVAL=${ruleConfig.interval}`);
          break;
        case 'until':
          stringOptions.push(
            `UNTIL=${until!.toICal({
              format: !!start.get('timezone') ? 'UTC' : undefined,
            })}`,
          );
          break;
        case 'count':
          stringOptions.push(`COUNT=${ruleConfig.count}`);
          break;
        case 'bySecondOfMinute':
          stringOptions.push(
            `BYSECOND=${ruleConfig.bySecondOfMinute!.join(',')}`,
          );
          break;
        case 'byMinuteOfHour':
          stringOptions.push(
            `BYMINUTE=${ruleConfig.byMinuteOfHour!.join(',')}`,
          );
          break;
        case 'byHourOfDay':
          stringOptions.push(`BYHOUR=${ruleConfig.byHourOfDay!.join(',')}`);
          break;
        case 'byDayOfWeek':
          stringOptions.push(
            `BYDAY=${serializeByDayOfWeek(ruleConfig.byDayOfWeek!)}`,
          );
          break;
        case 'byDayOfMonth':
          stringOptions.push(
            `BYMONTHDAY=${ruleConfig.byDayOfMonth!.join(',')}`,
          );
          break;
        case 'byMonthOfYear':
          stringOptions.push(`BYMONTH=${ruleConfig.byMonthOfYear!.join(',')}`);
          break;
        case 'weekStart':
          stringOptions.push(`WKST=${ruleConfig.weekStart}`);
          break;
      }
    }
  }

  return icalString.concat(stringOptions.join(';'));
}

function serializeByDayOfWeek(args: Options.ByDayOfWeek[]) {
  return args
    .map(arg => (Array.isArray(arg) ? `${arg[1]}${arg[0]}` : arg))
    .join(',');
}

/**
 * Converts an array of dates into an ICAL string containing RDATEs/EXDATEs.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
export function datesToIcalString<T extends DateAdapterConstructor>(
  dates: Array<DateAdapter<T>>,
  type: 'RDATE' | 'EXDATE' = 'RDATE',
  options: {
    excludeDTSTART?: boolean;
  } = {},
) {
  if (dates.length === 0) {
    throw new ICalStringSerialzeError(
      '`datesToIcalString()` must recieve at least one date',
    );
  }
  dates = dates.slice();

  let icalString: string;

  dates.sort((a, b) => {
    if (a.isAfter(b)) {
      return 1;
    } else if (b.isAfter(a)) {
      return -1;
    } else {
      return 0;
    }
  });

  const start = dates.pop()!;
  const seperator = [undefined, 'UTC'].includes(start.get('timezone'))
    ? ':'
    : ';';

  icalString = options.excludeDTSTART
    ? `${type}${seperator}${start.toICal()}`
    : `${buildDTStart(start)}\n${type}${seperator}${start.toICal()}`;

  dates.forEach(date => {
    const seperator = [undefined, 'UTC'].includes(date.get('timezone'))
      ? ':'
      : ';';

    icalString.concat(`\n${type}${seperator}${date.toICal()}`);
  });

  return icalString;
}

export function dateAdapterToICal<T extends DateAdapterConstructor>(
  date: DateAdapter<T>,
  utc?: boolean,
) {
  const timezone = utc ? 'UTC' : date.get('timezone');

  switch (timezone) {
    case undefined:
      return `${Utils.dateToStandardizedString(date)}`;
    case 'UTC':
      return `${Utils.dateToStandardizedString(date)}Z`;
    default:
      return `TZID=${date.get('timezone')}:${Utils.dateToStandardizedString(
        date,
      )}`;
  }
}

export function buildDTStart<T extends DateAdapterConstructor>(
  start: DateAdapter<T>,
) {
  const seperator = [undefined, 'UTC'].includes(start.get('timezone'))
    ? ':'
    : ';';

  return `DTSTART${seperator}${start.toICal()}`;
}

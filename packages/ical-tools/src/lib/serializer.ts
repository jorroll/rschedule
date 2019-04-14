import {
  DateAdapter,
  Dates,
  DateTime,
  IProvidedRuleOptions,
  normalizeDateInput,
  RuleOption,
  WEEKDAYS,
} from '@rschedule/rschedule';
import { stringify } from 'ical.js';
import { VEvent } from './vevent';

export class SerializeICalError extends Error {}

export interface IJCalProperty extends Array<any> {
  [0]: string;
  [1]: { [property: string]: string };
  [2]: string;
  [3]: any;
}

export interface IJCalComponent {
  [0]: string;
  [1]: IJCalProperty[];
  [2]: IJCalComponent[];
}

/**
 * Serializes an array of date adapters into JCal format.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
function datesToJCalProps<T extends typeof DateAdapter>(
  type: 'RDATE' | 'EXDATE',
  dates: Dates<T>,
): IJCalProperty[] {
  const adapters = dates.adapters.map(adapter => adapter.toDateTime());

  // group dates by timezone
  const timezones = new Map<string, string[]>();

  adapters
    .slice()
    .sort((a, b) => {
      if (a.isAfter(b)) {
        return 1;
      } else if (b.isAfter(a)) {
        return -1;
      } else {
        return 0;
      }
    })
    .forEach(date => {
      const timezone = date.timezone || 'local';

      if (!timezones.has(timezone)) {
        timezones.set(timezone, []);
      }

      timezones.get(timezone)!.push(dateTimeToJCal(date));
    });

  const result: Array<[string, {} | { tzid: string }, string, ...string[]]> = [];

  for (const [timezone, dateStrings] of timezones) {
    if (timezone === 'local' || timezone === 'UTC') {
      result.push([type.toLowerCase(), {}, 'date-time', ...dateStrings]);
    } else {
      result.push([type.toLowerCase(), { tzid: timezone }, 'date-time', ...dateStrings]);
    }
  }

  return result as IJCalProperty;
}

/**
 * Converts an options object to an [ICAL](https://tools.ietf.org/html/rfc5545)
 * complient string.
 *
 * @param options ProvidedOptions
 * @param type Determins if the serialized options object is labeled as an
 * "RRULE" or an "EXRULE".
 */
function ruleOptionsToJCalProp<T extends typeof DateAdapter>(
  type: 'RRULE' | 'EXRULE',
  dateAdapter: T,
  ruleOptions: IProvidedRuleOptions<T>,
): IJCalProperty {
  const start = normalizeDateInput(ruleOptions.start, dateAdapter);

  let end: DateTime | undefined;

  if (ruleOptions.end) {
    end = normalizeDateInput(ruleOptions.end, dateAdapter);

    if (start.timezone) {
      end = dateAdapter
        .fromDateTime(end)
        .set('timezone', 'UTC')
        .toDateTime();
    }
  }

  const stringOptions: any = {};

  for (const option in ruleOptions) {
    if (ruleOptions.hasOwnProperty(option) && (ruleOptions as any)[option] !== undefined) {
      switch (option) {
        case 'frequency':
          stringOptions.freq = ruleOptions.frequency;
          break;
        case 'interval':
          stringOptions.interval = ruleOptions.interval;

          stringOptions.push(`INTERVAL=${ruleOptions.interval}`);
          break;
        case 'end':
          stringOptions.until = dateTimeToJCal(end!);
          break;
        case 'count':
          stringOptions.count = ruleOptions.count;
          break;
        case 'bySecondOfMinute':
          stringOptions.bysecond = ruleOptions.bySecondOfMinute!;
          break;
        case 'byMinuteOfHour':
          stringOptions.byminute = ruleOptions.byMinuteOfHour;
          break;
        case 'byHourOfDay':
          stringOptions.byhour = ruleOptions.byHourOfDay;
          break;
        case 'byDayOfWeek':
          stringOptions.byday = ruleOptions.byDayOfWeek!.map(day => serializeByDayOfWeek(day));
          break;
        case 'byDayOfMonth':
          stringOptions.bymonthday = ruleOptions.byDayOfMonth;
          break;
        case 'byMonthOfYear':
          stringOptions.bymonth = ruleOptions.byMonthOfYear;
          break;
        case 'weekStart':
          stringOptions.wkst = WEEKDAYS.indexOf(ruleOptions.weekStart!) + 1;
          break;
      }
    }
  }

  return [type.toLowerCase(), {}, 'recur', stringOptions];
}

function vEventToJCal<T extends typeof DateAdapter>(vevent: VEvent<T>): IJCalComponent {
  return wrapInVEVENT(
    dateToJCalDTSTART(vevent.start.toDateTime()),
    ...(vevent.rrule
      ? [ruleOptionsToJCalProp('RRULE', vevent.dateAdapter, vevent.rrule.options)]
      : []),
    ...(vevent.exrule
      ? [ruleOptionsToJCalProp('EXRULE', vevent.dateAdapter, vevent.exrule.options)]
      : []),
    ...(vevent.rdates ? datesToJCalProps('RDATE', vevent.rdates) : []),
    ...(vevent.exdates ? datesToJCalProps('EXDATE', vevent.exdates) : []),
  );
}

export function serializeToJCal<T extends typeof DateAdapter>(inputs: VEvent<T>): IJCalComponent;
export function serializeToJCal<T extends typeof DateAdapter>(
  ...inputs: VEvent<T>[]
): IJCalComponent[];
export function serializeToJCal<T extends typeof DateAdapter>(
  ...inputs: VEvent<T>[]
): IJCalComponent[] | IJCalComponent {
  const jCal = inputs.map(input => {
    if (VEvent.isVEvent(input)) {
      return vEventToJCal(input);
    } else {
      throw new SerializeICalError(`Unsupported input type "${input}"`);
    }
  });

  return jCal.length > 1 ? jCal : jCal[0];
}

export function serializeToICal<T extends typeof DateAdapter>(inputs: VEvent<T>): string;
export function serializeToICal<T extends typeof DateAdapter>(...inputs: VEvent<T>[]): string[];
export function serializeToICal<T extends typeof DateAdapter>(
  ...inputs: VEvent<T>[]
): string[] | string {
  const jCal = serializeToJCal(...inputs);

  const iCal = (inputs.length === 1 ? [(jCal as unknown) as IJCalComponent] : jCal).map(
    (jcal: any) =>
      // ical.js makes new lines with `\r\n` instead of just `\n`
      // `\r` is a "Carriage Return" character. We'll remove it.
      stringify(jcal).replace(/\r/g, ''),
  );

  return iCal.length > 1 ? iCal : iCal[0];
}

function serializeByDayOfWeek(arg: RuleOption.ByDayOfWeek) {
  return Array.isArray(arg) ? `${arg[1]}${arg[0]}` : arg;
}

function dateToJCalDTSTART(date: DateTime) {
  const timezone = date.timezone || 'UTC';

  return [
    'dtstart',
    timezone !== 'UTC' ? { tzid: timezone } : {},
    'date-time',
    dateTimeToJCal(date),
  ];
}

function dateTimeToJCal(input: DateTime) {
  const ints = [
    input.get('year'),
    input.get('month'),
    input.get('day'),
    input.get('hour'),
    input.get('minute'),
    input.get('second'),
  ].map(int => normalizeTimeLength(int));

  let text = `${ints[0]}-${ints[1]}-${ints[2]}T` + `${ints[3]}:${ints[4]}:${ints[5]}`;

  if (input.timezone === 'UTC') {
    text = `${text}Z`;
  }

  return text;
}

function normalizeTimeLength(input: number) {
  const int = input.toString();

  return int.length > 1 ? int : `0${int}`;
}

function wrapInVEVENT(...inputs: any[]): IJCalComponent {
  return ['vevent', [...inputs], []];
}

import {
  Calendar,
  DateAdapter,
  Dates,
  DateTime,
  IProvidedRuleOptions,
  normalizeDateInput,
  Rule,
  RuleOption,
  Schedule,
  WEEKDAYS,
} from '@rschedule/rschedule';
import { stringify } from 'ical.js';

export class SerializeICalError extends Error {}

/**
 * Serializes an array of date adapters into JCal format.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
function datesToJCalProps<T extends typeof DateAdapter>(
  dates: Dates<T>,
  type: 'RDATE' | 'EXDATE' = 'RDATE',
) {
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

  const result: Array<Array<string | { tzid?: string }>> = [];

  for (const [timezone, dateStrings] of timezones) {
    if (timezone === 'local' || timezone === 'UTC') {
      result.push([type.toLowerCase(), {}, 'date-time', ...dateStrings]);
    } else {
      result.push([type.toLowerCase(), { tzid: timezone }, 'date-time', ...dateStrings]);
    }
  }

  return result;
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
  dateAdapter: T,
  ruleOptions: IProvidedRuleOptions<T>,
  type: 'RRULE' | 'EXRULE',
) {
  const start = normalizeDateInput(ruleOptions.start, dateAdapter);

  let end: DateTime | undefined;

  if (ruleOptions.end) {
    end = normalizeDateInput(ruleOptions.end, dateAdapter);

    if (start.timezone) {
      end = dateAdapter
        .fromJSON(end.toJSON())
        .set('timezone', 'UTC')
        .toDateTime();
    }
  }

  const stringOptions: any = {};

  for (const option in ruleOptions) {
    if (ruleOptions.hasOwnProperty(option)) {
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

function scheduleToJCal<T extends typeof DateAdapter>(schedule: Schedule<T>) {
  const start = schedule.firstDate;

  if (!start) return [];

  if (
    schedule.rrules.some(rule => !rule.firstDate.isEqual(start)) ||
    schedule.exrules.some(rule => !rule.firstDate.isEqual(start)) ||
    schedule.rdates.adapters.some(adapter => adapter.isBefore(start)) ||
    schedule.exdates.adapters.some(adapter => adapter.isBefore(start))
  ) {
    return [
      'vcalendar',
      [['x-rschedule-type', {}, 'unknown', 'SCHEDULE']],
      [
        ...schedule.rrules.map(rule =>
          wrapInVEVENT(
            dateToJCalDTSTART(rule.firstDate!),
            ruleOptionsToJCalProp(rule['dateAdapter'], rule.options as any, 'RRULE'),
          ),
        ),
        ...schedule.exrules.map(rule =>
          wrapInVEVENT(
            dateToJCalDTSTART(rule.firstDate!),
            ruleOptionsToJCalProp(rule['dateAdapter'], rule.options as any, 'EXRULE'),
          ),
        ),
        ...(schedule.rdates.length > 0
          ? wrapInVEVENT(
              dateToJCalDTSTART(schedule.rdates.firstDate!),
              ...datesToJCalProps(schedule.rdates, 'RDATE'),
            )
          : []),
        ...(schedule.exdates.length > 0
          ? wrapInVEVENT(
              dateToJCalDTSTART(schedule.exdates.firstDate!),
              ...datesToJCalProps(schedule.exdates, 'EXDATE'),
            )
          : []),
      ],
    ];
  } else {
    return wrapInVEVENT(
      dateToJCalDTSTART(start),
      ...schedule.rrules.map(rule =>
        ruleOptionsToJCalProp(rule['dateAdapter'], rule.options as any, 'RRULE'),
      ),
      ...schedule.exrules.map(rule =>
        ruleOptionsToJCalProp(rule['dateAdapter'], rule.options as any, 'EXRULE'),
      ),
      ...datesToJCalProps(schedule.rdates, 'RDATE'),
      ...datesToJCalProps(schedule.exdates, 'EXDATE'),
    );
  }
}

// function calendarToJCal<T extends typeof DateAdapter>(calendar: Calendar<T, any>) {
//   if (calendar.schedules.some(schedule => !Schedule.isSchedule(schedule))) {
//     throw new SerializeICalError(
//       `Cannot serialize complex Calendar objects. ` +
//         `You can only serialize Calendar objects which are entirely made up ` +
//         `of simple Schedule objects. This Calendar contains an OperatorObject ` +
//         `which isn't a Schedule. See the @rschedule/ical-tools docs for more info.`,
//     );
//   }

//   calendar.schedules.forEach(schedule => {
//     const sched = schedule as Schedule<T>;
//     const start = sched.firstDate;

//     if (
//       start &&
//       (sched.rrules.some(rrule => rrule.firstDate.isEqual(start)) ||
//         sched.exrules.some(exrule => exrule.firstDate.isEqual(start)))
//     ) {
//       throw new SerializeICalError(
//         `Cannot serialize complex Calendar objects. ` +
//           `You can only serialize Calendar objects which are entirely made up ` +
//           `of simple Schedule objects. This Calendar contains a Schedule object ` +
//           `which contains rules with multiple DTSTART times. ` +
//           `See the @rschedule/ical-tools docs for more info.`,
//       );
//     }
//   });

//   return [
//     'vcalendar',
//     [],
//     calendar.schedules.map(schedule => scheduleToJCal(schedule as Schedule<T>)),
//   ];
// }

export function serializeToJCal<T extends typeof DateAdapter>(...inputs: Schedule<T>[]): any[] {
  return inputs.map(input => {
    if (Schedule.isSchedule(input)) {
      return scheduleToJCal(input);
    } else {
      throw new SerializeICalError(`Unsupported input type "${input}"`);
    }
  });
}

export function serializeToICal<T extends typeof DateAdapter>(...inputs: Schedule<T>[]): string[] {
  return serializeToJCal(...inputs).map((jcal: any) =>
    // ical.js makes new lines with `\r\n` instead of just `\n`
    // `\r` is a "Carriage Return" character. We'll remove it.
    stringify(jcal).replace(/\r/g, ''),
  );
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

function wrapInVEVENT(...inputs: any[]) {
  return ['vevent', [...inputs], []];
}

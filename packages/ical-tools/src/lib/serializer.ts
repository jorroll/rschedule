import {
  Calendar,
  DateAdapter,
  DateAdapterConstructor,
  Dates,
  EXDates,
  EXRule,
  IDateAdapter,
  IDateAdapterConstructor,
  Options,
  RDates,
  RRule,
  Schedule,
  Utils,
} from '@rschedule/rschedule';
import { stringify } from 'ical.js';

export class ICalStringSerializeError extends Error {}

/**
 * Serializes an array of date adapters into JCal format.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
function datesToJCalProps<T extends DateAdapterConstructor>(
  dates: Dates<T>,
  type: 'RDATE' | 'EXDATE' = 'RDATE',
) {
  // group dates by timezone
  const timezones = new Map<string, string[]>();
  // @ts-ignore access protected method `buildDateAdapter()`
  const adapters = dates.dates.map(date => dates.buildDateAdapter(date)!);

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
      const timezone = date.get('timezone') || 'local';

      if (!timezones.has(timezone)) {
        timezones.set(timezone, []);
      }

      timezones.get(timezone)!.push(adapterToJCal(date));
    });

  const result: Array<Array<string | { tzid?: string }>> = [];

  for (const [timezone, dateStrings] of timezones) {
    if (timezone === 'local' || timezone === 'UTC') {
      result.push([type.toLowerCase(), {}, 'date-time', ...dateStrings]);
    } else {
      result.push([
        type.toLowerCase(),
        { tzid: timezone },
        'date-time',
        ...dateStrings,
      ]);
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
function ruleOptionsToJCalProp<T extends DateAdapterConstructor>(
  dateAdapterConstructor: T,
  ruleOptions: Options.ProvidedOptions<T>,
  type: 'RRULE' | 'EXRULE',
) {
  const dateAdapter: IDateAdapterConstructor<T> = dateAdapterConstructor as any;

  const start = dateAdapter.isInstance(ruleOptions.start)
    ? ruleOptions.start
    : new dateAdapter(ruleOptions.start);

  let until: IDateAdapter | undefined;

  if (ruleOptions.until) {
    until = dateAdapter.isInstance(ruleOptions.until)
      ? ruleOptions.until
      : new dateAdapter(ruleOptions.until);
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
        case 'until':
          stringOptions.until = start.get('timezone')
            ? adapterToJCal(until!.set('timezone', 'UTC'))
            : adapterToJCal(until!);
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
          stringOptions.byday = ruleOptions.byDayOfWeek!.map(day =>
            serializeByDayOfWeek(day),
          );
          break;
        case 'byDayOfMonth':
          stringOptions.bymonthday = ruleOptions.byDayOfMonth;
          break;
        case 'byMonthOfYear':
          stringOptions.bymonth = ruleOptions.byMonthOfYear;
          break;
        case 'weekStart':
          stringOptions.wkst =
            Utils.WEEKDAYS.indexOf(ruleOptions.weekStart!) + 1;
          break;
      }
    }
  }

  return [type.toLowerCase(), {}, 'recur', stringOptions];
}

function scheduleToJCal<T extends DateAdapterConstructor>(
  schedule: Schedule<T>,
) {
  const start = schedule.startDate;

  if (!start) {
    return [];
  }

  if (
    schedule.rrules.some(rule => !rule.startDate.isEqual(start)) ||
    schedule.exrules.some(rule => !rule.startDate.isEqual(start))
  ) {
    return [
      'vcalendar',
      [['x-rschedule-type', {}, 'text', 'SCHEDULE']],
      [
        ...schedule.rrules.map(rule => serializeRScheduleToJCal(rule)),
        ...schedule.exrules.map(rule => serializeRScheduleToJCal(rule)),
        ...serializeRScheduleToJCal(schedule.rdates),
        ...serializeRScheduleToJCal(schedule.exdates),
      ],
    ];
  } else {
    return wrapInVEVENT(
      dateToJCalDTSTART(start),
      ...schedule.rrules.map(rule =>
        // @ts-ignore
        ruleOptionsToJCalProp(rule.dateAdapter, rule.options, 'RRULE'),
      ),
      ...schedule.exrules.map(rule =>
        // @ts-ignore
        ruleOptionsToJCalProp(rule.dateAdapter, rule.options, 'EXRULE'),
      ),
      ...datesToJCalProps(schedule.rdates, 'RDATE'),
      ...datesToJCalProps(schedule.exdates, 'EXDATE'),
    );
  }
}

function calendarToJCal<T extends DateAdapterConstructor>(
  calendar: Calendar<T, any>,
) {
  if (calendar.schedules.some(schedule => !Schedule.isSchedule(schedule))) {
    throw new ICalStringSerializeError(
      `Cannot serialize complex Calendar objects. ` +
        `You can only serialize Calendar objects which are entirely made up ` +
        `of simple Schedule objects. This Calendar contains an OperatorObject ` +
        `which isn't a Schedule. See the @rschedule/ical-tools docs for more info.`,
    );
  }

  calendar.schedules.forEach(schedule => {
    const sched = schedule as Schedule<T>;
    const start = sched.startDate;

    if (
      start &&
      (sched.rrules.some(rrule => rrule.startDate.isEqual(start)) ||
        sched.exrules.some(exrule => exrule.startDate.isEqual(start)))
    ) {
      throw new ICalStringSerializeError(
        `Cannot serialize complex Calendar objects. ` +
          `You can only serialize Calendar objects which are entirely made up ` +
          `of simple Schedule objects. This Calendar contains a Schedule object ` +
          `which contains rules with multiple DTSTART times. ` +
          `See the @rschedule/ical-tools docs for more info.`,
      );
    }
  });

  return [
    'vcalendar',
    [],
    calendar.schedules.map(schedule => scheduleToJCal(schedule as Schedule<T>)),
  ];
}

export function serializeRScheduleToJCal<T extends DateAdapterConstructor>(
  ...inputs: Array<
    | Calendar<T, any>
    | Schedule<T>
    | RDates<T>
    | EXDates<T>
    | RRule<T>
    | EXRule<T>
  >
): any[] {
  return inputs.map(input => {
    if (RDates.isRDates(input)) {
      return wrapInVEVENT(
        dateToJCalDTSTART(input.startDate!),
        ...datesToJCalProps(input, 'RDATE'),
      );
    } else if (EXDates.isEXDates(input)) {
      return wrapInVEVENT(
        dateToJCalDTSTART(input.startDate!),
        ...datesToJCalProps(input, 'EXDATE'),
      );
    } else if (RRule.isRRule(input)) {
      return wrapInVEVENT(
        dateToJCalDTSTART(input.startDate!),
        // @ts-ignore
        ruleOptionsToJCalProp(input.dateAdapter, input.options as any, 'RRULE'),
      );
    } else if (EXRule.isEXRule(input)) {
      return wrapInVEVENT(
        dateToJCalDTSTART(input.startDate!),
        ruleOptionsToJCalProp(
          // @ts-ignore
          input.dateAdapter,
          input.options as any,
          'EXRULE',
        ),
      );
    } else if (Schedule.isSchedule(input)) {
      return scheduleToJCal(input);
    } else if (Calendar.isCalendar(input)) {
      return calendarToJCal(input);
    } else {
      throw new Error(`Unsupported input type "${input}"`);
    }
  });
}

export function serializeRScheduleToICal<T extends DateAdapterConstructor>(
  ...inputs: Array<
    | Calendar<T, any>
    | Schedule<T>
    | RDates<T>
    | EXDates<T>
    | RRule<T>
    | EXRule<T>
  >
): string[] {
  return serializeRScheduleToJCal(...inputs).map((jcal: any) =>
    // ical.js makes new lines with `\r\n` instead of just `\n`
    // `\r` is a "Carriage Return" character. We'll remove it.
    stringify(jcal).replace(/\r/g, ''),
  );
}

function serializeByDayOfWeek(arg: Options.ByDayOfWeek) {
  return Array.isArray(arg) ? `${arg[1]}${arg[0]}` : arg;
}

function dateToJCalDTSTART<T extends DateAdapterConstructor>(
  date: DateAdapter<T>,
) {
  const timezone = date.get('timezone') || 'UTC';

  return [
    'dtstart',
    timezone !== 'UTC' ? { tzid: timezone } : {},
    'date-time',
    adapterToJCal(date),
  ];
}

function adapterToJCal<T extends DateAdapterConstructor>(
  input: DateAdapter<T>,
) {
  const ints = [
    input.get('year'),
    input.get('month'),
    input.get('day'),
    input.get('hour'),
    input.get('minute'),
    input.get('second'),
  ].map(int => normalizeTimeLength(int));

  let text =
    `${ints[0]}-${ints[1]}-${ints[2]}T` + `${ints[3]}:${ints[4]}:${ints[5]}`;

  if (input.get('timezone') === 'UTC') {
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

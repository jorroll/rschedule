import {
  Calendar,
  DateAdapter,
  IDateAdapter,
  IProvidedRuleOptions,
  RuleOption,
  Schedule,
  WEEKDAYS,
} from '@rschedule/rschedule';
import { parse } from 'ical.js';
import clone from 'lodash.clonedeep';

export class ParseICalError extends Error {}

const LINE_REGEX = /^.*\n?/;

export interface IParsedICalProperty extends Array<any> {
  [0]: string;
  [1]: { [property: string]: string };
  [2]: string;
  [3]: any;
}

export type IDtstartProperty<T extends typeof DateAdapter> = IParsedICalProperty & {
  processedValue: T['date'];
};

export interface IParsedICalComponent {
  [0]: string;
  [1]: IParsedICalProperty[];
  [2]: IParsedICalComponent[];
}

export interface IProcessedVEvent<T extends typeof DateAdapter> {
  rrules: Array<IProvidedRuleOptions<T>>;
  exrules: Array<IProvidedRuleOptions<T>>;
  rdates: Array<T['date']>;
  exdates: Array<T['date']>;
  data: { iCalendar: IParsedICalComponent };
}

export interface IProcessedVCalendar<T extends typeof DateAdapter> {
  schedules: Array<IProcessedVEvent<T>>;
  data: { iCalendar: IParsedICalComponent };
}

export interface IProcessedICalendar<T extends typeof DateAdapter> {
  vevents: Array<IProcessedVEvent<T>>;
  vcalendars: Array<IProcessedVCalendar<T>>;
  iCalendar: IParsedICalComponent[];
}

export function parseICal<T extends typeof DateAdapter>(
  input: string | string[],
  dateAdapter: T,
  options: {
    optionalDTSTART?: boolean;
    returnOptionsObjects?: boolean;
  } = {},
) {
  // normalize input
  if (!Array.isArray(input)) {
    input = [input];
  }

  return input.map(ical => {
    const match = ical.trim().match(LINE_REGEX);

    if (match && match[0] && !(match[0].toUpperCase().split(':')[0] === 'BEGIN')) {
      ical = `BEGIN:VEVENT\n${ical}\nEND:VEVENT`;
    }

    let parsedICal: any;

    try {
      parsedICal = parse(ical);
    } catch (e) {
      throw new ParseICalError(e.message);
    }

    const processedICal = processParsedICalString(parsedICal, dateAdapter, options);

    if (options.returnOptionsObjects) {
      return {
        calendars: processedICal.vcalendars,
        events: processedICal.vevents,
        iCalendar: processedICal.iCalendar,
      };
    }

    const result: {
      calendars: Array<
        Calendar<
          T,
          {
            iCalendar: IParsedICalComponent;
          }
        >
      >;
      events: Array<
        Schedule<
          T,
          {
            iCalendar: IParsedICalComponent;
          }
        >
      >;
      iCalendar: IParsedICalComponent[];
    } = {
      calendars: [],
      events: [],
      iCalendar: processedICal.iCalendar,
    };

    processedICal.vcalendars.forEach(vcalendar => {
      if (
        vcalendar.data.iCalendar[1].some(
          prop => prop[0] === 'x-rschedule-type' && prop[3] === 'SCHEDULE',
        )
      ) {
        const rrules: Array<IProvidedRuleOptions<T>> = [];
        const exrules: Array<IProvidedRuleOptions<T>> = [];
        const rdates: Array<T['date']> = [];
        const exdates: Array<T['date']> = [];

        vcalendar.schedules.forEach(event => {
          event.rrules.forEach(rrule => {
            rrules.push(rrule);
          });

          event.exrules.forEach(exrule => {
            exrules.push(exrule);
          });

          event.rdates.forEach(date => {
            rdates.push(date);
          });

          event.exdates.forEach(date => {
            exdates.push(date);
          });
        });

        result.events.push(
          new Schedule({
            data: vcalendar.data,
            rrules,
            exrules,
            rdates,
            exdates,
            dateAdapter,
          }),
        );
      } else {
        result.calendars.push(
          new Calendar({
            schedules: vcalendar.schedules.map(
              schedule =>
                new Schedule({
                  ...schedule,
                  dateAdapter,
                }),
            ),
            data: vcalendar.data,
            dateAdapter,
          }),
        );
      }
    });

    result.events.push(
      ...processedICal.vevents.map(vevent => new Schedule({ ...vevent, dateAdapter })),
    );

    return result;
  });
}

function processParsedICalString<T extends typeof DateAdapter>(
  input: IParsedICalComponent | IParsedICalComponent[],
  dateAdapter: T,
  options: {
    optionalDTSTART?: boolean;
  } = {},
) {
  const root =
    typeof (input as any)[0] === 'string'
      ? [input as IParsedICalComponent]
      : (input as IParsedICalComponent[]);

  const iCalendar: IProcessedICalendar<T> = {
    vevents: [],
    vcalendars: [],
    iCalendar: root,
  };

  root.forEach(component => {
    switch (component[0]) {
      case 'vevent':
        return iCalendar.vevents.push(processParsedVEvent(component, dateAdapter, options));
      case 'vcalendar':
        return iCalendar.vcalendars.push(processParsedVCalendar(component, dateAdapter, options));
      default:
        return;
    }
  });

  return iCalendar;
}

function processParsedVEvent<T extends typeof DateAdapter>(
  input: IParsedICalComponent,
  dateAdapter: T,
  options: {
    optionalDTSTART?: boolean;
  } = {},
) {
  input = clone(input);

  const params: IProcessedVEvent<T> = {
    rrules: [],
    exrules: [],
    rdates: [],
    exdates: [],
    data: {
      iCalendar: clone(input),
    },
  };

  const dtstartIndex = input[1].findIndex(property => property[0] === 'dtstart');

  if (dtstartIndex === -1) {
    throw new ParseICalError(`Invalid VEVENT component: "DTSTART" property missing.`);
  }

  const dtstartProperty: IDtstartProperty<T> = [...input[1].splice(dtstartIndex, 1)[0]] as any;

  dtstartProperty.processedValue = processDTSTART(dtstartProperty, dateAdapter);

  input[1].forEach(property => {
    switch (property[0]) {
      case 'dtstart':
        throw new ParseICalError(
          `Invalid VEVENT component: must have exactly 1 "DTSTART" property.`,
        );
      case 'rrule':
        return params.rrules.push(processRRULE(property, dateAdapter, dtstartProperty));
      case 'exrule':
        return params.exrules.push(processRRULE(property, dateAdapter, dtstartProperty));
      case 'rdate':
        return params.rdates.push(...convertJCalDateTimeToDate(property, dateAdapter));
      case 'exdate':
        return params.exdates.push(...convertJCalDateTimeToDate(property, dateAdapter));
      default:
        return;
    }
  });

  // If the DTSTART time is not optional, add the DTSTART time
  // to the VEVENT as an RDATE if there isn't already an RDATE
  // equal to the DTSTART time.
  if (!options.optionalDTSTART) {
    const start = new dateAdapter(dtstartProperty.processedValue);

    if (!params.rdates.map(date => new dateAdapter(date)).some(date => date.isEqual(start))) {
      params.rdates.push(dtstartProperty.processedValue);
    }
  }

  return params;
}

function parseJCalDateTime(input: IParsedICalProperty): IDateAdapter.JSON[] {
  input = clone(input);

  input.shift();
  const params = input.shift()!;
  const type = input.shift()!;

  const results: IDateAdapter.JSON[] = [];

  let regex: RegExp;

  if (type === 'date-time') {
    regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
  } else if (type === 'date') {
    regex = /^(\d{4})-(\d{2})-(\d{2})/;
  } else if (type === 'time') {
    regex = /^(\d{2}):(\d{2}):(\d{2})/;
  } else {
    throw new ParseICalError(`Invalid date/time property value type "${type}".`);
  }

  input.forEach((value: string) => {
    const match = value.match(regex);

    if (!(match && match.shift())) {
      throw new ParseICalError(`Invalid date/time value "${input}"`);
    }

    const result: IDateAdapter.JSON = {
      timezone: params.tzid,
      year: parseInt(match[0], 10),
      month: parseInt(match[1], 10),
      day: parseInt(match[2], 10),
      hour: parseInt(match[3], 10),
      minute: parseInt(match[4], 10),
      second: parseInt(match[5], 10),
      millisecond: 0,
    };

    if (value[value.length - 1] === 'Z') {
      result.timezone = 'UTC';
    }

    results.push(result);
  });

  return results;
}

function convertJCalDateTimeToDate<T extends typeof DateAdapter>(
  input: IParsedICalProperty,
  dateAdapter: T,
  options: {
    dtstart?: IDtstartProperty<T>;
  } = {},
): Array<T['date']> {
  const results = parseJCalDateTime(input).map(result => dateAdapter.fromJSON(result));

  if (options.dtstart && options.dtstart![1].tzid) {
    return results.map(adapter => adapter.set('timezone', options.dtstart![1].tzid).date);
  } else {
    return results.map(adapter => adapter.date);
  }
}

export function processDTSTART<T extends typeof DateAdapter>(
  input: IParsedICalProperty,
  dateAdapterConstructor: T,
): T['date'] {
  const type = input[2];

  if (!['date-time', 'date'].includes(type)) {
    throw new ParseICalError(`Invalid DTSTART value type "${type}".`);
  }

  const dates = convertJCalDateTimeToDate(input, dateAdapterConstructor);

  if (dates.length !== 1) {
    throw new ParseICalError(`Invalid DTSTART: must have exactly 1 value.`);
  }

  return dates[0];
}

export function processRRULE<T extends typeof DateAdapter>(
  input: IParsedICalProperty,
  dateAdapterConstructor: T,
  dtstart: IDtstartProperty<T>,
): IProvidedRuleOptions<T> {
  if (!(input[3] && input[3].freq)) {
    throw new ParseICalError(`Invalid RRULE property: must contain a "FREQ" value.`);
  }

  const result: IProvidedRuleOptions<T> = {
    frequency: parseFrequency(input[3].freq),
    start: dtstart.processedValue,
  };

  if (input[3].hasOwnProperty('until')) {
    result.end = parseUNTIL(input, dateAdapterConstructor, dtstart);
  }
  if (input[3].hasOwnProperty('count')) {
    result.count = parseCOUNT(input[3].count);
  }
  if (input[3].hasOwnProperty('interval')) {
    result.interval = parseINTERVAL(input[3].interval);
  }
  if (input[3].hasOwnProperty('bysecond')) {
    result.bySecondOfMinute = parseBYSECOND(input[3].bysecond);
  }
  if (input[3].hasOwnProperty('byminute')) {
    result.byMinuteOfHour = parseBYMINUTE(input[3].byminute);
  }
  if (input[3].hasOwnProperty('byhour')) {
    result.byHourOfDay = parseBYHOUR(input[3].byhour);
  }
  if (input[3].hasOwnProperty('byday')) {
    result.byDayOfWeek = parseBYDAY(input[3].byday);
  }
  if (input[3].hasOwnProperty('bymonthday')) {
    result.byDayOfMonth = parseBYMONTHDAY(input[3].bymonthday);
  }
  if (input[3].hasOwnProperty('byyearday')) {
    parseBYYEARDAY(input[3].byyearday);
  }
  if (input[3].hasOwnProperty('byweekno')) {
    parseBYWEEKNO(input[3].byweekno);
  }
  if (input[3].hasOwnProperty('bymonth')) {
    result.byMonthOfYear = parseBYMONTH(input[3].bymonth);
  }
  if (input[3].hasOwnProperty('bysetpos')) {
    parseBYSETPOS(input[3].bysetpos);
  }
  if (input[3].hasOwnProperty('wkst')) {
    result.weekStart = parseWKST(input[3].wkst);
  }

  return result;
}

export function parseFrequency(text: string) {
  if (!['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(text)) {
    throw new ParseICalError(`Invalid FREQ value "${text}"`);
  } else {
    return text as RuleOption.Frequency;
  }
}

// Here we say that the type `T` must be a constructor that returns a DateAdapter
// complient type
export function parseUNTIL<T extends typeof DateAdapter>(
  input: IParsedICalProperty,
  dateAdapterConstructor: T,
  dtstart: IDtstartProperty<T>,
) {
  const until = convertJCalDateTimeToDate(
    ['until', {}, dtstart[2], input[3].until],
    dateAdapterConstructor,
    { dtstart },
  );

  if (until.length !== 1) {
    throw new ParseICalError(`Invalid RRULE "UNTIL" property. Must specify one value.`);
  } else if (
    new dateAdapterConstructor(until[0]).valueOf() <
    new dateAdapterConstructor(dtstart.processedValue).valueOf()
  ) {
    throw new ParseICalError(
      `Invalid RRULE "UNTIL" property. ` + `"UNTIL" value cannot be less than "DTSTART" value.`,
    );
  }

  return until[0];
}

export function parseCOUNT(int: number) {
  if (typeof int !== 'number' || isNaN(int) || int < 1) {
    throw new ParseICalError(`Invalid COUNT value "${int}"`);
  }
  return int;
}

export function parseINTERVAL(int: number) {
  if (typeof int !== 'number' || isNaN(int) || int < 1) {
    throw new ParseICalError(`Invalid INTERVAL value "${int}"`);
  }
  return int;
}

export function parseBYSECOND(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int < 0 || int > 60) {
      throw new ParseICalError(`Invalid BYSECOND value "${int}"`);
    }
  });

  return input as RuleOption.BySecondOfMinute[];
}

export function parseBYMINUTE(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int < 0 || int > 59) {
      throw new ParseICalError(`Invalid BYMINUTE value "${int}"`);
    }
  });

  return input as RuleOption.ByMinuteOfHour[];
}

export function parseBYHOUR(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int < 0 || int > 23) {
      throw new ParseICalError(`Invalid BYHOUR value "${int}"`);
    }
  });

  return input as RuleOption.ByHourOfDay[];
}

export function parseBYDAY(input: string | string[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  return input.map(text => {
    if (text.length > 2 && text.length < 5) {
      let int: number;
      let weekday: string;

      if (text[0] === '-') {
        int = parseInt(text.slice(0, 2), 10);
        weekday = text.slice(2);
      } else {
        int = parseInt(text[0], 10);
        weekday = text.slice(1);
      }

      if (!WEEKDAYS.includes(weekday as any)) {
        throw new ParseICalError(`Invalid BYDAY value "${text}"`);
      }

      return [weekday, int] as [IDateAdapter.Weekday, number];
    } else if (!WEEKDAYS.includes(text as any)) {
      throw new ParseICalError(`Invalid BYDAY value "${text}"`);
    } else {
      return text as IDateAdapter.Weekday;
    }
  });
}

export function parseBYMONTHDAY(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int === 0 || int < -31 || int > 31) {
      throw new ParseICalError(`Invalid BYMONTHDAY value "${int}"`);
    }
  });

  return input as RuleOption.ByDayOfMonth[];
}

export function parseBYYEARDAY(input: any) {
  console.warn(`Parsing "BYYEARDAY" rrule property is not implemented.`);
  return input;
}

export function parseBYMONTH(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int < 1 || int > 12) {
      throw new ParseICalError(`Invalid BYMONTH value "${int}"`);
    }
  });

  return input as RuleOption.ByMonthOfYear[];
}

export function parseBYWEEKNO(input: any) {
  console.warn(`Parsing "BYYEARDAY" rrule property is not implemented.`);
  return input;
}

export function parseBYSETPOS(input: any) {
  console.warn(`Parsing "BYYEARDAY" rrule property is not implemented.`);
  return input;
}

export function parseWKST(input: number) {
  if (typeof input !== 'number' || input > 7 || input < 1) {
    throw new ParseICalError(`Invalid WKST value "${input}"`);
  }

  return WEEKDAYS[input - 1];
}

function processParsedVCalendar<T extends typeof DateAdapter>(
  input: IParsedICalComponent,
  dateAdapterConstructor: T,
  options: {
    optionalDTSTART?: boolean;
  } = {},
): IProcessedVCalendar<T> {
  input = clone(input);

  const vCalendar: IProcessedVCalendar<T> = {
    schedules: [],
    data: {
      iCalendar: input,
    },
  };

  input[2].forEach(component => {
    switch (component[0]) {
      case 'vevent':
        return vCalendar.schedules.push(
          processParsedVEvent(component, dateAdapterConstructor, options),
        );
      default:
        return;
    }
  });

  return vCalendar;
}

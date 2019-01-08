import {
  Calendar,
  DateAdapterConstructor,
  DateProp,
  IDateAdapter,
  IDateAdapterConstructor,
  IDateAdapterJSON,
  Options,
  Schedule,
  Utils,
} from '@rschedule/rschedule';
import { parse } from 'ical.js';
import { ParseError } from '../shared';

const LINE_REGEX = /^.*\n?/;

export interface IParsedICalProperty extends Array<any> {
  [0]: string;
  [1]: { [property: string]: string };
  [2]: string;
  [3]: any;
}

export type IDtstartProperty<
  T extends DateAdapterConstructor
> = IParsedICalProperty & {
  processedValue: DateProp<T>;
};

export interface IParsedICalComponent {
  [0]: string;
  [1]: IParsedICalProperty[];
  [2]: IParsedICalComponent[];
}

export interface IProcessedVEvent<T extends DateAdapterConstructor> {
  rrules: Array<Options.ProvidedOptions<T>>;
  exrules: Array<Options.ProvidedOptions<T>>;
  rdates: Array<DateProp<T>>;
  exdates: Array<DateProp<T>>;
  data: { iCalendar: IParsedICalComponent };
}

export interface IProcessedVCalendar<T extends DateAdapterConstructor> {
  schedules: Array<IProcessedVEvent<T>>;
  data: { iCalendar: IParsedICalComponent };
}

export interface IProcessedICalendar<T extends DateAdapterConstructor> {
  vevents: Array<IProcessedVEvent<T>>;
  vcalendars: Array<IProcessedVCalendar<T>>;
  iCalendar: IParsedICalComponent[];
}

export function parseICal<T extends DateAdapterConstructor>(
  input: string | string[],
  dateAdapterConstructor: T,
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

    if (
      match &&
      match[0] &&
      !(match[0].toUpperCase().split(':')[0] === 'BEGIN')
    ) {
      ical = `BEGIN:VEVENT\n${ical}\nEND:VEVENT`;
    }

    let parsedICal: any;

    try {
      parsedICal = parse(ical);
    } catch (e) {
      throw new ParseError(e.message);
    }

    const processedICal = processParsedICalString(
      parsedICal,
      dateAdapterConstructor,
      options,
    );

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
          Schedule<
            T,
            {
              iCalendar: IParsedICalComponent;
            }
          >,
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
        const rrules: Array<Options.ProvidedOptions<T>> = [];
        const exrules: Array<Options.ProvidedOptions<T>> = [];
        const rdates: Array<DateProp<T>> = [];
        const exdates: Array<DateProp<T>> = [];

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
            dateAdapter: dateAdapterConstructor,
          }),
        );
      } else {
        result.calendars.push(
          new Calendar({
            schedules: vcalendar.schedules.map(
              schedule =>
                new Schedule({
                  ...schedule,
                  dateAdapter: dateAdapterConstructor,
                }),
            ),
            data: vcalendar.data,
            dateAdapter: dateAdapterConstructor,
          }),
        );
      }
    });

    result.events.push(
      ...processedICal.vevents.map(
        vevent =>
          new Schedule({ ...vevent, dateAdapter: dateAdapterConstructor }),
      ),
    );

    return result;
  });
}

function processParsedICalString<T extends DateAdapterConstructor>(
  input: IParsedICalComponent | IParsedICalComponent[],
  dateAdapterConstructor: T,
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
        return iCalendar.vevents.push(
          processParsedVEvent(component, dateAdapterConstructor, options),
        );
      case 'vcalendar':
        return iCalendar.vcalendars.push(
          processParsedVCalendar(component, dateAdapterConstructor, options),
        );
      default:
        return;
    }
  });

  return iCalendar;
}

function processParsedVEvent<T extends DateAdapterConstructor>(
  input: IParsedICalComponent,
  dateAdapterConstructor: T,
  options: {
    optionalDTSTART?: boolean;
  } = {},
) {
  input = Utils.clone(input);

  const params: IProcessedVEvent<T> = {
    rrules: [],
    exrules: [],
    rdates: [],
    exdates: [],
    data: {
      iCalendar: Utils.clone(input),
    },
  };

  const dtstartIndex = input[1].findIndex(
    property => property[0] === 'dtstart',
  );

  if (dtstartIndex === -1) {
    throw new ParseError(
      `Invalid VEVENT component: "DTSTART" property missing.`,
    );
  }

  const dtstartProperty: IDtstartProperty<T> = [
    ...input[1].splice(dtstartIndex, 1)[0],
  ] as any;

  dtstartProperty.processedValue = processDTSTART(
    dtstartProperty,
    dateAdapterConstructor,
  );

  input[1].forEach(property => {
    switch (property[0]) {
      case 'dtstart':
        throw new ParseError(
          `Invalid VEVENT component: must have exactly 1 "DTSTART" property.`,
        );
      case 'rrule':
        return params.rrules.push(
          processRRULE(property, dateAdapterConstructor, dtstartProperty),
        );
      case 'exrule':
        return params.exrules.push(
          processRRULE(property, dateAdapterConstructor, dtstartProperty),
        );
      case 'rdate':
        return params.rdates.push(
          ...convertJCalDateTimeToDate(property, dateAdapterConstructor),
        );
      case 'exdate':
        return params.exdates.push(
          ...convertJCalDateTimeToDate(property, dateAdapterConstructor),
        );
      default:
        return;
    }
  });

  // If the DTSTART time is not optional, add the DTSTART time
  // to the VEVENT as an RDATE if there isn't already an RDATE
  // equal to the DTSTART time.
  if (!options.optionalDTSTART) {
    const dateAdapter: IDateAdapterConstructor<
      T
    > = dateAdapterConstructor as any;

    const start = new dateAdapter(dtstartProperty.processedValue);

    if (
      !params.rdates
        .map(date => new dateAdapter(date))
        .some(date => date.isEqual(start))
    ) {
      params.rdates.push(dtstartProperty.processedValue);
    }
  }

  return params;
}

function parseJCalDateTime(
  input: IParsedICalProperty,
): IDateAdapterJSON[] {
  input = Utils.clone(input);

  input.shift();
  const params = input.shift()!;
  const type = input.shift()!;

  const results: IDateAdapterJSON[] = [];

  let regex: RegExp;

  if (type === 'date-time') {
    regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
  } else if (type === 'date') {
    regex = /^(\d{4})-(\d{2})-(\d{2})/;
  } else if (type === 'time') {
    regex = /^(\d{2}):(\d{2}):(\d{2})/;
  } else {
    throw new ParseError(`Invalid date/time property value type "${type}".`);
  }

  input.forEach((value: string) => {
    const match = value.match(regex);

    if (!(match && match.shift())) {
      throw new ParseError(`Invalid date/time value "${input}"`);
    }

    const result = {
      zone: params.tzid,
      year: parseInt(match[0], 10),
      month: parseInt(match[1], 10),
      day: parseInt(match[2], 10),
      hour: parseInt(match[3], 10),
      minute: parseInt(match[4], 10),
      second: parseInt(match[5], 10),
      millisecond: 0,
    };

    if (value[value.length - 1] === 'Z') {
      result.zone = 'UTC';
    }

    results.push(result);
  });

  return results;
}

function convertJCalDateTimeToDate<T extends DateAdapterConstructor>(
  input: IParsedICalProperty,
  dateAdapterConstructor: T,
  options: {
    dtstart?: IDtstartProperty<T>;
  } = {},
): Array<DateProp<T>> {
  const dateAdapter: IDateAdapterConstructor<T> = dateAdapterConstructor as any;

  const results = parseJCalDateTime(input).map(result =>
    dateAdapter.fromJSON(result),
  );

  if (options.dtstart && options.dtstart![1].tzid) {
    return results.map(
      adapter => adapter.set('timezone', options.dtstart![1].tzid).date,
    );
  } else {
    return results.map(adapter => adapter.date);
  }
}

export function processDTSTART<T extends DateAdapterConstructor>(
  input: IParsedICalProperty,
  dateAdapterConstructor: T,
): DateProp<T> {
  const type = input[2];

  if (!['date-time', 'date'].includes(type)) {
    throw new ParseError(`Invalid DTSTART value type "${type}".`);
  }

  const dates = convertJCalDateTimeToDate(input, dateAdapterConstructor);

  if (dates.length !== 1) {
    throw new ParseError(`Invalid DTSTART: must have exactly 1 value.`);
  }

  return dates[0];
}

export function processRRULE<T extends DateAdapterConstructor>(
  input: IParsedICalProperty,
  dateAdapterConstructor: T,
  dtstart: IDtstartProperty<T>,
): Options.ProvidedOptions<T> {
  if (!(input[3] && input[3].freq)) {
    throw new ParseError(
      `Invalid RRULE property: must contain a "FREQ" value.`,
    );
  }

  const result: Options.ProvidedOptions<T> = {
    frequency: parseFrequency(input[3].freq),
    start: dtstart.processedValue,
  };

  if (input[3].hasOwnProperty('until')) {
    result.until = parseUNTIL(input, dateAdapterConstructor, dtstart);
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
    throw new ParseError(`Invalid FREQ value "${text}"`);
  } else {
    return text as Options.Frequency;
  }
}

// Here we say that the type `T` must be a constructor that returns a DateAdapter
// complient type
export function parseUNTIL<T extends DateAdapterConstructor>(
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
    throw new ParseError(
      `Invalid RRULE "UNTIL" property. Must specify one value.`,
    );
  } else if (
    new dateAdapterConstructor(until[0]).valueOf() <
    new dateAdapterConstructor(dtstart.processedValue).valueOf()
  ) {
    throw new ParseError(
      `Invalid RRULE "UNTIL" property. ` +
        `"UNTIL" value cannot be less than "DTSTART" value.`,
    );
  }

  return until[0];
}

export function parseCOUNT(int: number) {
  if (typeof int !== 'number' || isNaN(int) || int < 1) {
    throw new ParseError(`Invalid COUNT value "${int}"`);
  }
  return int;
}

export function parseINTERVAL(int: number) {
  if (typeof int !== 'number' || isNaN(int) || int < 1) {
    throw new ParseError(`Invalid INTERVAL value "${int}"`);
  }
  return int;
}

export function parseBYSECOND(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int < 0 || int > 60) {
      throw new ParseError(`Invalid BYSECOND value "${int}"`);
    }
  });

  return input as Options.BySecondOfMinute[];
}

export function parseBYMINUTE(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int < 0 || int > 59) {
      throw new ParseError(`Invalid BYMINUTE value "${int}"`);
    }
  });

  return input as Options.ByMinuteOfHour[];
}

export function parseBYHOUR(input: number | number[]) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  input.forEach(int => {
    if (typeof int !== 'number' || isNaN(int) || int < 0 || int > 23) {
      throw new ParseError(`Invalid BYHOUR value "${int}"`);
    }
  });

  return input as Options.ByHourOfDay[];
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

      if (!Utils.WEEKDAYS.includes(weekday as any)) {
        throw new ParseError(`Invalid BYDAY value "${text}"`);
      }

      return [weekday, int] as [IDateAdapter.Weekday, number];
    } else if (!Utils.WEEKDAYS.includes(text as any)) {
      throw new ParseError(`Invalid BYDAY value "${text}"`);
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
    if (
      typeof int !== 'number' ||
      isNaN(int) ||
      int === 0 ||
      int < -31 ||
      int > 31
    ) {
      throw new ParseError(`Invalid BYMONTHDAY value "${int}"`);
    }
  });

  return input as Options.ByDayOfMonth[];
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
      throw new ParseError(`Invalid BYMONTH value "${int}"`);
    }
  });

  return input as Options.ByMonthOfYear[];
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
    throw new ParseError(`Invalid WKST value "${input}"`);
  }

  return Utils.WEEKDAYS[input - 1];
}

function processParsedVCalendar<T extends DateAdapterConstructor>(
  input: IParsedICalComponent,
  dateAdapterConstructor: T,
  options: {
    optionalDTSTART?: boolean;
  } = {},
): IProcessedVCalendar<T> {
  input = Utils.clone(input);

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

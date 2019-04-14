import {
  ArgumentError,
  ConstructorReturnType,
  DateAdapter,
  IDateAdapter,
  IProvidedRuleOptions,
  RScheduleConfig,
  RuleOption,
  WEEKDAYS,
} from '@rschedule/rschedule';
import { parse } from 'ical.js';
import { IJCalComponent, IJCalProperty } from './serializer';
import { IVEventRuleOptions, VEvent } from './vevent';

export class ParseICalError extends Error {}

const LINE_REGEX = /^.*\n?/;

type IDtstartProperty<T extends typeof DateAdapter> = IJCalProperty & {
  processedValue: ConstructorReturnType<T>;
};

export interface IVEventArgs<T extends typeof DateAdapter> {
  start: ConstructorReturnType<T>;
  rrule?: IVEventRuleOptions<T>;
  exrule?: IVEventRuleOptions<T>;
  rdates?: ConstructorReturnType<T>[];
  exdates?: ConstructorReturnType<T>[];
  data: { jCal: IJCalComponent };
}

export interface IParsedICalString<T extends typeof DateAdapter> {
  vEvents: VEvent<T, { jCal: IJCalComponent }>[];
  iCal: string;
  jCal: IJCalComponent[];
}
export function parseICal<T extends typeof DateAdapter>(
  iCalString: string,
  options: {
    dateAdapter?: T;
  },
): IParsedICalString<T>;
export function parseICal<T extends typeof DateAdapter>(
  iCalString: string[],
  options: {
    dateAdapter?: T;
  },
): IParsedICalString<T>[];
export function parseICal<T extends typeof DateAdapter>(
  iCalString: string | string[],
  options: {
    dateAdapter?: T;
  } = {},
): IParsedICalString<T> | IParsedICalString<T>[] {
  const dateAdapter = options.dateAdapter || (RScheduleConfig.defaultDateAdapter as T);

  if (!dateAdapter) {
    throw new ArgumentError(
      'No `dateAdapter` option provided to `parseICal()`. Additionally, ' +
        '`RScheduleConfig.defaultDateAdapter` not set.',
    );
  }

  // normalize input
  const input = Array.isArray(iCalString) ? iCalString : [iCalString];

  const results = input.map(iCal => {
    const match = iCal.trim().match(LINE_REGEX);

    if (match && match[0] && !(match[0].toUpperCase().split(':')[0] === 'BEGIN')) {
      iCal = `BEGIN:VEVENT\n${iCal}\nEND:VEVENT`;
    } else if (match && match[0] && !(match[0].toUpperCase().split(':')[1] !== 'VEVENT')) {
      throw new ParseICalError(
        `"parseICal()" currently only supports parsing VEVENT ical components.`,
      );
    }

    let jCal: IJCalComponent;

    try {
      jCal = parse(iCal);
    } catch (e) {
      throw new ParseICalError(e.message);
    }

    const parsedJCal = parseJCal(jCal, dateAdapter);

    const parsedICal: IParsedICalString<T> = {
      vEvents: [],
      iCal,
      jCal: parsedJCal.jCal,
    };

    parsedJCal.vEvents.forEach(vEvent => {
      parsedICal.vEvents.push(new VEvent<T, { jCal: IJCalComponent }>({ ...vEvent, dateAdapter }));
    });

    return parsedICal;
  });

  return results.length > 1 ? results : results[0];
}

function parseJCal<T extends typeof DateAdapter>(
  input: IJCalComponent | IJCalComponent[],
  dateAdapter: T,
) {
  const root =
    typeof (input as any)[0] === 'string' ? [input as IJCalComponent] : (input as IJCalComponent[]);

  const parsedJCal: {
    vEvents: IVEventArgs<T>[];
    jCal: IJCalComponent[];
  } = {
    vEvents: [],
    jCal: root,
  };

  root.forEach(component => {
    switch (component[0]) {
      case 'vevent':
        return parsedJCal.vEvents.push(parseVEvent(component, dateAdapter));
      default:
        return;
    }
  });

  return parsedJCal;
}

function parseVEvent<T extends typeof DateAdapter>(rawInput: IJCalComponent, dateAdapter: T) {
  const input = cloneJSON(rawInput);

  const dtstartIndex = input[1].findIndex(property => property[0] === 'dtstart');

  if (dtstartIndex === -1) {
    throw new ParseICalError(`Invalid VEVENT component: "DTSTART" property missing.`);
  }

  const dtstartProperty: IDtstartProperty<T> = [...input[1].splice(dtstartIndex, 1)[0]] as any;

  dtstartProperty.processedValue = parseDTSTART(dtstartProperty, dateAdapter);

  const params: IVEventArgs<T> = {
    start: dtstartProperty.processedValue,
    rdates: [],
    exdates: [],
    data: {
      jCal: cloneJSON(rawInput),
    },
  };

  input[1].forEach(property => {
    switch (property[0]) {
      case 'dtstart':
        throw new ParseICalError(
          `Invalid VEVENT component: must have exactly 1 "DTSTART" property.`,
        );
      case 'rrule':
        return (params.rrule = parseRule(property, dateAdapter, dtstartProperty));
      case 'exrule':
        return (params.exrule = parseRule(property, dateAdapter, dtstartProperty));
      case 'rdate':
        return params.rdates!.push(...jCalDateTimeToDateAdapter(property, dateAdapter));
      case 'exdate':
        return params.exdates!.push(...jCalDateTimeToDateAdapter(property, dateAdapter));
      default:
        return;
    }
  });

  return params;
}

function parseJCalDateTime(input: IJCalProperty): IDateAdapter.JSON[] {
  input = cloneJSON(input);

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
      timezone: params.tzid || null,
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

function jCalDateTimeToDateAdapter<T extends typeof DateAdapter>(
  input: IJCalProperty,
  dateAdapter: T,
  options: {
    timezone?: string | null;
  } = {},
): ConstructorReturnType<T>[] {
  const results = parseJCalDateTime(input).map(result =>
    dateAdapter.fromJSON(result),
  ) as ConstructorReturnType<T>[];

  if (options.timezone !== undefined) {
    return results.map(
      adapter =>
        adapter.set('timezone', options.timezone as string | null) as ConstructorReturnType<T>,
    );
  } else {
    return results;
  }
}

export function parseDTSTART<T extends typeof DateAdapter>(
  input: IJCalProperty,
  dateAdapterConstructor: T,
): ConstructorReturnType<T> {
  const type = input[2];

  if (!['date-time', 'date'].includes(type)) {
    throw new ParseICalError(`Invalid DTSTART value type "${type}".`);
  }

  const dates = jCalDateTimeToDateAdapter(input, dateAdapterConstructor);

  if (dates.length !== 1) {
    throw new ParseICalError(`Invalid DTSTART: must have exactly 1 value.`);
  }

  return dates[0];
}

export function parseRule<T extends typeof DateAdapter>(
  input: IJCalProperty,
  dateAdapterConstructor: T,
  dtstart: IDtstartProperty<T>,
): IProvidedRuleOptions<T> {
  if (!(input[3] && input[3].freq)) {
    throw new ParseICalError(`Invalid RRULE/EXRULE property: must contain a "FREQ" value.`);
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
  input: IJCalProperty,
  dateAdapterConstructor: T,
  dtstart: IDtstartProperty<T>,
) {
  const until = jCalDateTimeToDateAdapter(
    ['until', {}, dtstart[2], input[3].until],
    dateAdapterConstructor,
    { timezone: dtstart.processedValue.timezone },
  );

  if (until.length !== 1) {
    throw new ParseICalError(`Invalid RRULE "UNTIL" property. Must specify one value.`);
  } else if (until[0].valueOf() < dtstart.processedValue.valueOf()) {
    throw new ParseICalError(
      `Invalid RRULE "UNTIL" property. "UNTIL" value cannot be less than "DTSTART" value.`,
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

function cloneJSON<T>(json: T): T {
  return JSON.parse(JSON.stringify(json));
}

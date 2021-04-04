import { DateAdapter, DateAdapterBase, RuleOption } from '@rschedule/core';
import { ICalRuleFrequency, IRRuleOptions } from '@rschedule/core/rules/ICAL_RULES';
import { IJCalComponent, IJCalProperty } from './serializer';

export class ParseICalError extends Error {}

export type IVEventRuleOptions = Omit<IRRuleOptions, 'start' | 'byMillisecondOfSecond'>;

type IDtstartProperty = IJCalProperty & {
  processedValue: DateAdapter;
};

export interface IParsedVEventArgs {
  start: DateAdapter;
  duration?: number | DateAdapter;
  rrules?: IVEventRuleOptions[];
  exrules?: IVEventRuleOptions[];
  rdates?: DateAdapter[];
  exdates?: DateAdapter[];
  data: { jCal: IJCalComponent };
}

export function parseJCal(
  input: IJCalComponent | IJCalComponent[],
): {
  vEvents: IParsedVEventArgs[];
  jCal: IJCalComponent[];
} {
  const root =
    typeof (input as any)[0] === 'string' ? [input as IJCalComponent] : (input as IJCalComponent[]);

  const parsedJCal: {
    vEvents: IParsedVEventArgs[];
    jCal: IJCalComponent[];
  } = {
    vEvents: [],
    jCal: root,
  };

  root.forEach(component => {
    switch (component[0]) {
      case 'vevent':
        return parsedJCal.vEvents.push(parseVEvent(component));
      default:
        return;
    }
  });

  return parsedJCal;
}

function parseVEvent(rawInput: IJCalComponent): IParsedVEventArgs {
  const input = cloneJSON(rawInput);

  const dtstartIndex = input[1].findIndex(property => property[0] === 'dtstart');

  if (dtstartIndex === -1) {
    throw new ParseICalError(`Invalid VEVENT component: "DTSTART" property missing.`);
  }

  const dtstartProperty: IDtstartProperty = [...input[1].splice(dtstartIndex, 1)[0]] as any;

  dtstartProperty.processedValue = parseDTSTART(dtstartProperty);

  let dtend: DateAdapter | undefined;
  let duration: number | undefined;

  const dtendIndex = input[1].findIndex(property => property[0] === 'dtend');
  const durationIndex = input[1].findIndex(property => property[0] === 'duration');

  if (dtendIndex !== -1) {
    dtend = parseDTEND(input[1].splice(dtendIndex, 1)[0]);
  } else if (durationIndex !== -1) {
    duration = parseDURATION(input[1].splice(durationIndex, 1)[0]);
  }

  const params: IParsedVEventArgs = {
    start: dtstartProperty.processedValue,
    duration: dtend || duration,
    rrules: [],
    exrules: [],
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
        return params.rrules!.push(parseRule(property, dtstartProperty));
      case 'exrule':
        return params.exrules!.push(parseRule(property, dtstartProperty));
      case 'rdate':
        return params.rdates!.push(...jCalDateTimeToDateAdapter(property));
      case 'exdate':
        return params.exdates!.push(...jCalDateTimeToDateAdapter(property));
      default:
        return;
    }
  });

  return params;
}

function parseJCalDateTime(input: IJCalProperty): DateAdapter.JSON[] {
  input = cloneJSON(input);

  input.shift();
  const params = input.shift()!;
  const type = input.shift()!;

  const results: DateAdapter.JSON[] = [];

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

    const result: DateAdapter.JSON = {
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

function jCalDateTimeToDateAdapter(
  input: IJCalProperty,
  options: {
    timezone?: string | null;
  } = {},
): DateAdapter[] {
  const results = parseJCalDateTime(input).map(result =>
    DateAdapterBase.adapter.fromJSON(result),
  ) as DateAdapter[];

  if (options.timezone !== undefined) {
    return results.map(adapter => adapter.set('timezone', options.timezone!));
  } else {
    return results;
  }
}

export function parseDTSTART(input: IJCalProperty): DateAdapter {
  const type = input[2];

  if (!['date-time', 'date'].includes(type)) {
    throw new ParseICalError(`Invalid DTSTART value type "${type}".`);
  }

  const dates = jCalDateTimeToDateAdapter(input);

  if (dates.length !== 1) {
    throw new ParseICalError(`Invalid DTSTART: must have exactly 1 value.`);
  }

  return dates[0];
}

export function parseDTEND(input: IJCalProperty): DateAdapter {
  const type = input[2];

  if (!['date-time', 'date'].includes(type)) {
    throw new ParseICalError(`Invalid DTEND value type "${type}".`);
  }

  const dates = jCalDateTimeToDateAdapter(input);

  if (dates.length !== 1) {
    throw new ParseICalError(`Invalid DTEND: must have exactly 1 value.`);
  }

  return dates[0];
}

export function parseDURATION(input: IJCalProperty): number {
  const durationString = input[3];
  let weeks = 0;
  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let match: RegExpMatchArray | null = null;

  const [date, time] = durationString.split('T');

  match = date.match(/\d+[Ww]/);
  if (match) weeks = parseInt(match[0].match(/\d+/)![0], 10);

  match = date.match(/\d+[Dd]/);
  if (match) days = parseInt(match[0].match(/\d+/)![0], 10);

  if (time) {
    match = time.match(/\d+[Hh]/);
    if (match) hours = parseInt(match[0].match(/\d+/)![0], 10);

    match = time.match(/\d+[Mm]/);
    if (match) minutes = parseInt(match[0].match(/\d+/)![0], 10);

    match = time.match(/\d+[Ss]/);
    if (match) seconds = parseInt(match[0].match(/\d+/)![0], 10);
  }

  return (
    weeks * DateAdapter.MILLISECONDS_IN_WEEK +
    days * DateAdapter.MILLISECONDS_IN_DAY +
    hours * DateAdapter.MILLISECONDS_IN_HOUR +
    minutes * DateAdapter.MILLISECONDS_IN_MINUTE +
    seconds * DateAdapter.MILLISECONDS_IN_SECOND
  );
}

export function parseRule(input: IJCalProperty, dtstart: IDtstartProperty): IVEventRuleOptions {
  if (!(input[3] && input[3].freq)) {
    throw new ParseICalError(`Invalid RRULE/EXRULE property: must contain a "FREQ" value.`);
  }

  const result: IVEventRuleOptions = {
    frequency: parseFrequency(input[3].freq),
  };

  if (input[3].hasOwnProperty('until')) {
    result.end = parseUNTIL(input, dtstart);
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

export function parseFrequency(text: string): ICalRuleFrequency {
  if (!['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(text)) {
    throw new ParseICalError(`Invalid FREQ value "${text}"`);
  } else {
    return text as ICalRuleFrequency;
  }
}

// Here we say that the type `T` must be a constructor that returns a DateAdapter
// complient type
export function parseUNTIL(input: IJCalProperty, dtstart: IDtstartProperty): DateAdapter {
  const until = jCalDateTimeToDateAdapter(['until', {}, dtstart[2], input[3].until], {
    timezone: dtstart.processedValue.timezone,
  });

  if (until.length !== 1) {
    throw new ParseICalError(`Invalid RRULE "UNTIL" property. Must specify one value.`);
  } else if (until[0].valueOf() < dtstart.processedValue.valueOf()) {
    throw new ParseICalError(
      `Invalid RRULE "UNTIL" property. "UNTIL" value cannot be less than "DTSTART" value.`,
    );
  }

  return until[0];
}

export function parseCOUNT(int: number): RuleOption.Count {
  if (typeof int !== 'number' || isNaN(int) || int < 1) {
    throw new ParseICalError(`Invalid COUNT value "${int}"`);
  }
  return int;
}

export function parseINTERVAL(int: number): RuleOption.Interval {
  if (typeof int !== 'number' || isNaN(int) || int < 1) {
    throw new ParseICalError(`Invalid INTERVAL value "${int}"`);
  }
  return int;
}

export function parseBYSECOND(input: number | number[]): RuleOption.BySecondOfMinute[] {
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

export function parseBYMINUTE(input: number | number[]): RuleOption.ByMinuteOfHour[] {
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

export function parseBYHOUR(input: number | number[]): RuleOption.ByHourOfDay[] {
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

export function parseBYDAY(input: string | string[]): RuleOption.ByDayOfWeek[] {
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

      if (!DateAdapter.WEEKDAYS.includes(weekday as any)) {
        throw new ParseICalError(`Invalid BYDAY value "${text}"`);
      }

      return [weekday, int] as [DateAdapter.Weekday, number];
    } else if (!DateAdapter.WEEKDAYS.includes(text as any)) {
      throw new ParseICalError(`Invalid BYDAY value "${text}"`);
    } else {
      return text as DateAdapter.Weekday;
    }
  });
}

export function parseBYMONTHDAY(input: number | number[]): RuleOption.ByDayOfMonth[] {
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

export function parseBYYEARDAY(_: any): never {
  throw new Error(`Parsing "BYYEARDAY" rrule property is not implemented.`);
}

export function parseBYMONTH(input: number | number[]): RuleOption.ByMonthOfYear[] {
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

export function parseBYWEEKNO(_: any): never {
  throw new Error(`Parsing "BYWEEKNO" rrule property is not implemented.`);
}

export function parseBYSETPOS(_: any): never {
  throw new Error(`Parsing "BYSETPOS" rrule property is not implemented.`);
}

export function parseWKST(input: number): DateAdapter.Weekday {
  if (typeof input !== 'number' || input > 7 || input < 1) {
    throw new ParseICalError(`Invalid WKST value "${input}"`);
  }

  return DateAdapter.WEEKDAYS[input - 1];
}

function cloneJSON<T>(json: T): T {
  return JSON.parse(JSON.stringify(json));
}

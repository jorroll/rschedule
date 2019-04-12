import { StandardDateAdapter } from '@rschedule/standard-date-adapter';

import { Moment as MomentST } from 'moment';
const momentST = require('moment');
import { Moment as MomentTZ } from 'moment-timezone';
const momentTZ = require('moment-timezone');
import { DateAdapter, DateTime, IOccurrencesArgs, OccurrenceGenerator } from '@rschedule/rschedule';
import { DateTime as LuxonDateTime } from 'luxon';

// This function allows me to use the test's name as a
// variable inside the test
export function test<T extends any>(name: T, fn: (name: T) => any) {
  return it(`${name}`, () => fn(name));
}

// This function allows me to use the describe block's name as a
// variable inside tests
export function context<T>(name: T, fn: (name: T) => any) {
  if (Array.isArray(name)) {
    return describe(`${name[0]}`, () => fn(name));
  } else {
    return describe(`${name}`, () => fn(name));
  }
}

// This function allows me to test multiple, disperate objects with the
// same test suite
export function environment<T>(object: T, fn: (object: T) => any) {
  if (typeof object === 'function') {
    return describe((object as any).name, () => fn(object));
  } else if (Array.isArray(object)) {
    return describe(object[0].name, () => fn(object));
  } else {
    throw new Error('"environment()" utility function received unexpected value');
  }
}

export const TIMEZONES = [
  null,
  'UTC',
  'Africa/Johannesburg',
  'America/Los_Angeles',
  'America/New_York',
  'America/Santiago',
  'Europe/London',
  'Asia/Shanghai',
  'Asia/Jakarta',
  'Australia/Melbourne',
] as const;

export interface DatetimeFn<R> {
  (): R;
  (year: number): R;
  (year: number, month: number): R;
  (year: number, month: number, day: number): R;
  (year: number, month: number, day: number, hour: number): R;
  (year: number, month: number, day: number, hour: number, minute: number): R;
  (year: number, month: number, day: number, hour: number, minute: number, second: number): R;
  (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
  ): R;
  (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    timezone?: string,
  ): R;
}

export function standardDatetimeFn(...args: Array<number | string>) {
  if (args.length === 0) {
    return new Date();
  }

  const numbers: number[] = [];
  let timezone: string | null = null;

  args.forEach(arg => {
    if (typeof arg === 'string' || arg === null) {
      timezone = arg;
    } else {
      numbers.push(arg);
    }
  });

  if (numbers.length > 1) {
    numbers[1] = numbers[1] - 1;
  }

  if (timezone === 'UTC') {
    // @ts-ignore
    return new Date(Date.UTC(...numbers));
  } else {
    // @ts-ignore
    return new Date(...numbers);
  }
}

export function momentDatetimeFn(...args: Array<number | string>): MomentST {
  if (args.length === 0) {
    return momentST();
  }

  const numbers: number[] = [];
  let timezone: string | null = null;

  args.forEach(arg => {
    if (typeof arg === 'string' || arg === null) {
      timezone = arg;
    } else {
      numbers.push(arg);
    }
  });

  if (numbers.length > 1) {
    numbers[1] = numbers[1] - 1;
  }

  if (timezone === 'UTC') {
    return momentST.utc(numbers);
  } else {
    return momentST(numbers);
  }
}

export function momentTZDatetimeFn(...args: Array<number | string>): MomentTZ {
  if (args.length === 0) {
    return momentTZ();
  }

  const numbers: number[] = [];
  let timezone: string | null = null;

  args.forEach(arg => {
    if (typeof arg === 'string' || arg === null) {
      timezone = arg;
    } else {
      numbers.push(arg);
    }
  });

  if (numbers.length > 1) {
    numbers[1] = numbers[1] - 1;
  }

  if (timezone) {
    return momentTZ.tz(numbers, timezone);
  } else {
    return momentTZ(numbers);
  }
}

export function luxonDatetimeFn(...args: Array<number | string>): LuxonDateTime {
  if (args.length === 0) {
    return LuxonDateTime.local();
  }

  const numbers: number[] = [];
  let timezone: string | null = null;

  args.forEach(arg => {
    if (typeof arg === 'string' || arg === null) {
      timezone = arg;
    } else {
      numbers.push(arg);
    }
  });

  if (timezone) {
    return LuxonDateTime.local(...numbers).setZone(timezone, {
      keepLocalTime: true,
    });
  } else {
    return LuxonDateTime.local(...numbers);
  }
}

export function datetime(): Date;
export function datetime(a: number): Date;
export function datetime(a: number, b: number): Date;
export function datetime(a: number, b: number, c: number): Date;
export function datetime(a: number, b: number, c: number, d: number): Date;
export function datetime(a: number, b: number, c: number, d: number, e: number): Date;
export function datetime(a: number, b: number, c: number, d: number, e: number, f: number): Date;
export function datetime(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
): Date;
export function datetime(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  timezone?: string,
): Date;
export function datetime(...args: Array<number | string | undefined>) {
  if (args.length > 1) {
    args[1] = (args[1] as number) - 1;
  }

  const lastArg = args[args.length - 1];

  if (typeof lastArg === 'string') {
    args.pop();
    return new Date(Date.UTC(...(args as [number, number, number])));
  } else if (lastArg === null) {
    args.pop();
  }

  return new Date(...(args as [number, number, number]));
}

export function isoString(): string;
export function isoString(a: number): string;
export function isoString(a: number, b: number): string;
export function isoString(a: number, b: number, c: number): string;
export function isoString(a: number, b: number, c: number, d: number): string;
export function isoString(a: number, b: number, c: number, d: number, e: number): string;
export function isoString(a: number, b: number, c: number, d: number, e: number, f: number): string;
export function isoString(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
): string;
export function isoString(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  timezone?: string,
): string;
export function isoString(...args: Array<number | string | undefined>) {
  // @ts-ignore
  return datetime(...args).toISOString();
}

export function dateAdapter(): StandardDateAdapter;
export function dateAdapter(a: number): StandardDateAdapter;
export function dateAdapter(a: number, b: number): StandardDateAdapter;
export function dateAdapter(a: number, b: number, c: number): StandardDateAdapter;
export function dateAdapter(a: number, b: number, c: number, d: number): StandardDateAdapter;
export function dateAdapter(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
): StandardDateAdapter;
export function dateAdapter(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
): StandardDateAdapter;
export function dateAdapter(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
): StandardDateAdapter;
export function dateAdapter(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  timezone?: string,
): StandardDateAdapter;
export function dateAdapter(...args: Array<number | string | undefined>) {
  // @ts-ignore
  return new StandardDateAdapter(datetime(...args));
}

// function to create new dateAdapter instances
export function timezoneDateAdapterFn(
  dateAdapterConstructor: typeof DateAdapter,
  datetimeFn: (...args: any[]) => any,
  timezone: string | null,
): (...args: number[]) => DateAdapter {
  return (...args: number[]) => {
    const dateAdapterArgs: (string | number)[] = args;

    if (timezone !== null) {
      dateAdapterArgs.push(timezone);
    }

    return new dateAdapterConstructor(datetimeFn(...dateAdapterArgs), { timezone });
  };
}

// function to get the given time array as an ISO string
export function timezoneIsoStringFn(
  dateAdapterFn: (...args: number[]) => DateAdapter,
): (...args: number[]) => string {
  return (...args: number[]) => dateAdapterFn(...args).toISOString();
}

// function to get the given time array as an ISO string
export function occurrencesToIsoStrings(...args: OccurrenceGenerator<any>[]): string[] {
  const strings: string[] = [];

  args.forEach(arg =>
    strings.push(
      ...arg
        .occurrences()
        .toArray()!
        .map(date => date.toISOString()),
    ),
  );

  strings.sort();

  return strings;
}

export function dateTimeToAdapterFn(
  dateAdapterConstructor: typeof DateAdapter,
  timezone: string | null,
) {
  return (date: DateTime, options: { keepZone?: boolean } = {}) =>
    options.keepZone
      ? dateAdapterConstructor.fromDateTime(date)
      : dateAdapterConstructor.fromDateTime(date).set('timezone', timezone);
}

export function dateTimeFn(dateAdapter: (...args: number[]) => DateAdapter) {
  return (...args: number[]) => DateTime.fromDateAdapter(dateAdapter(...args));
}

export function toISOStrings<T extends typeof DateAdapter>(
  schedule: OccurrenceGenerator<T> | DateAdapter[],
  args: IOccurrencesArgs<T> = {},
) {
  if (Array.isArray(schedule)) {
    return schedule.map(date => date.toISOString());
  }

  return schedule
    .occurrences(args)
    .toArray()!
    .map(occ => occ.toISOString());
}

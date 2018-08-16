import { StandardDateAdapter } from '@rschedule/standard-date-adapter'
import { Moment as MomentST } from 'moment';
var momentST = require('moment');
import { Moment as MomentTZ } from 'moment-timezone';
var momentTZ = require('moment-timezone');
import { DateTime } from 'luxon';

// This function allows me to use the test's name as a
// variable inside the test
export function test<T extends string>(name: T, fn: (name: T) => any) {
  return it(name, () => fn(name))
}

// This function allows me to use the describe block's name as a
// variable inside tests
export function context<T>(name: T, fn: (name: T) => any) {
  if (Array.isArray(name))
    return describe(`${name[0]}`, () => fn(name))
  else
    return describe(`${name}`, () => fn(name))
}

// This function allows me to test multiple, disperate objects with the 
// same test suite
export function environment<T>(object: T, fn: (object: T) => any) {
  if (typeof object === 'function')
    return describe((object as any).name, () => fn(object))
  else if (Array.isArray(object))
    return describe(object[0].name, () => fn(object))
  else
    throw new Error('"environment()" utility function received unexpected value')
}

export const TIMEZONES = [
  undefined,
  "UTC",
  "Africa/Johannesburg",
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",
  "America/Santiago",
  "Europe/Athens",
  "Europe/London",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Melbourne",
];

export type DatetimeFn<R> = {
  (): R;
  (year: number): R;
  (year: number, month: number): R;
  (year: number, month: number, day: number): R;
  (year: number, month: number, day: number, hour: number): R;
  (year: number, month: number, day: number, hour: number, minute: number): R;
  (year: number, month: number, day: number, hour: number, minute: number, second: number): R;
  (year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number): R;
  (year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number, timezone?: string): R;
}

export function standardDatetimeFn(...args: (number|string)[]) {
  if (args.length === 0) return new Date();

  const numbers: number[] = [];
  let timezone: string | undefined = undefined;

  args.forEach(arg => {
    if (typeof arg === 'string')
      timezone = arg
    else
      numbers.push(arg)
  })

  if (numbers.length > 1) numbers[1] = numbers[1] - 1;

  if (timezone === 'UTC') {
    // @ts-ignore
    return new Date(Date.UTC(...numbers))
  }
  else {
    // @ts-ignore
    return new Date(...numbers)
  }
}

export function momentDatetimeFn(...args: (number|string)[]): MomentST {
  if (args.length === 0) return momentST();

  const numbers: number[] = [];
  let timezone: string | undefined = undefined;

  args.forEach(arg => {
    if (typeof arg === 'string')
      timezone = arg
    else
      numbers.push(arg)
  })

  if (numbers.length > 1) numbers[1] = numbers[1] - 1;

  if (timezone === 'UTC') {
    // @ts-ignore
    return momentST.utc(numbers)
  }
  else {
    // @ts-ignore
    return momentST(numbers)
  }
}

export function momentTZDatetimeFn(...args: (number|string)[]): MomentTZ {
  if (args.length === 0) return momentTZ();

  const numbers: number[] = [];
  let timezone: string | undefined = undefined;

  args.forEach(arg => {
    if (typeof arg === 'string')
      timezone = arg
    else
      numbers.push(arg)
  })

  if (numbers.length > 1) numbers[1] = numbers[1] - 1;

  if (timezone) {
    // @ts-ignore
    return momentTZ.tz(numbers, timezone)
  }
  else {
    // @ts-ignore
    return momentTZ(numbers)
  }
}

export function luxonDatetimeFn(...args: (number|string)[]): DateTime {
  if (args.length === 0) return DateTime.local();

  const numbers: number[] = [];
  let timezone: string | undefined = undefined;

  args.forEach(arg => {
    if (typeof arg === 'string')
      timezone = arg
    else
      numbers.push(arg)
  })

  if (timezone) {
    // @ts-ignore
    return DateTime.local(...numbers).setZone(timezone, {keepLocalTime: true})
  }
  else {
    // @ts-ignore
    return DateTime.local(...numbers)
  }
}

export function datetime(): Date
export function datetime(a: number): Date
export function datetime(a: number, b: number): Date
export function datetime(a: number, b: number, c: number): Date
export function datetime(a: number, b: number, c: number, d: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number, f: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number, f: number, g: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number, f: number, g: number, timezone?: string): Date
export function datetime(...args: (number|string|undefined)[]) {
  if (args.length > 1) args[1] = (args[1] as number) - 1

  if (args.length === 8) {
    // @ts-ignore
    return args.pop() === 'UTC' ? new Date(Date.UTC(...args)) : new Date(...args)
  }
  // @ts-ignore
  else return new Date(...args)
}

export function isoString(): string
export function isoString(a: number): string
export function isoString(a: number, b: number): string
export function isoString(a: number, b: number, c: number): string
export function isoString(a: number, b: number, c: number, d: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number, f: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number, f: number, g: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number, f: number, g: number,  timezone?: string): string
export function isoString(...args: (number|string|undefined)[]) {
  // @ts-ignore
  return datetime(...args).toISOString()
}

export function dateAdapter(): StandardDateAdapter
export function dateAdapter(a: number): StandardDateAdapter
export function dateAdapter(a: number, b: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number, f: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number, f: number, g: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number, f: number, g: number,  timezone?: string): StandardDateAdapter
export function dateAdapter(...args: (number|string|undefined)[]) {
  // @ts-ignore
  return new StandardDateAdapter(datetime(...args))
}

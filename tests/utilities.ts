// import { StandardDateAdapter } from '@rschedule/standard-date-adapter';

// import { Moment as MomentST } from 'moment';
// const momentST = require('moment');
// import { Moment as MomentTZ } from 'moment-timezone';
// const momentTZ = require('moment-timezone');
// import { ZonedDateTime as JodaDateTime, ZoneId } from '@js-joda/core';
// import '@js-joda/timezone';
import { DateAdapter, DateAdapterBase, DateTime } from '@rschedule/core';
import { IOccurrencesArgs, OccurrenceGenerator, Rule } from '@rschedule/core/generators';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
// import { DateTime as LuxonDateTime } from 'luxon';

// This function allows me to use the test's name as a
// variable inside the test
export function test<T>(name: T, fn: (name: T) => any) {
  if (name instanceof DateAdapterBase) {
    it(name.toISOString(), () => {
      fn(name);
    });
  } else {
    it(`${name}`, () => {
      fn(name);
    });
  }
}

// This function allows me to use the describe block's name as a
// variable inside tests
export function context<T>(name: T, fn: (name: T) => any) {
  if (Array.isArray(name)) {
    describe(`${name[0]}`, () => {
      fn(name);
    });
  } else if (name instanceof DateAdapterBase || name instanceof DateTime) {
    describe(name.toISOString(), () => {
      fn(name);
    });
  } else {
    describe(`${name}`, () => {
      fn(name);
    });
  }
}

export namespace context {
  export function skip<T>(name: T, fn: (name: T) => any) {
    if (Array.isArray(name)) {
      describe.skip(`${name[0]}`, () => {
        fn(name);
      });
    } else if (name instanceof DateAdapterBase || name instanceof DateTime) {
      describe.skip(name.toISOString(), () => {
        fn(name);
      });
    } else {
      describe.skip(`${name}`, () => {
        fn(name);
      });
    }
  }
}

// This function allows me to test multiple, disperate objects with the
// same test suite
export function environment<T>(object: T, fn: (object: T) => any) {
  if (typeof object === 'function') {
    describe((object as any).name, () => {
      fn(object);
    });
  } else if (Array.isArray(object)) {
    describe(object[0].name, () => {
      fn(object);
    });
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
];

Rule.recurrenceRules = ICAL_RULES;

// export interface DatetimeFn<R> {
//   (): R;
//   (year: number): R;
//   (year: number, month: number): R;
//   (year: number, month: number, day: number): R;
//   (year: number, month: number, day: number, hour: number): R;
//   (year: number, month: number, day: number, hour: number, minute: number): R;
//   (year: number, month: number, day: number, hour: number, minute: number, second: number): R;
//   (
//     year: number,
//     month: number,
//     day: number,
//     hour: number,
//     minute: number,
//     second: number,
//     millisecond: number,
//   ): R;
//   (
//     year: number,
//     month: number,
//     day: number,
//     hour: number,
//     minute: number,
//     second: number,
//     millisecond: number,
//     timezone?: string,
//   ): R;
// }

// export function standardDatetimeFn(...args: Array<number | string>) {
//   if (args.length === 0 || typeof args[0] !== 'number') {
//     return new Date();
//   }

//   const numbers: number[] = [];
//   let timezone: string | null = null;

//   args.forEach(arg => {
//     if (typeof arg === 'string' || arg === null) {
//       timezone = arg;
//     } else {
//       numbers.push(arg);
//     }
//   });

//   if (numbers.length > 1) {
//     numbers[1] = numbers[1] - 1;
//   }

//   if (timezone === 'UTC') {
//     // @ts-ignore
//     return new Date(Date.UTC(...numbers));
//   } else {
//     // @ts-ignore
//     return new Date(...numbers);
//   }
// }

// export function momentDatetimeFn(...args: Array<number | string>): MomentST {
//   if (args.length === 0 || typeof args[0] !== 'number') {
//     return args[0] === 'UTC' ? momentST().utc() : momentST();
//   }

//   const numbers: number[] = [];
//   let timezone: string | null = null;

//   args.forEach(arg => {
//     if (typeof arg === 'string' || arg === null) {
//       timezone = arg;
//     } else {
//       numbers.push(arg);
//     }
//   });

//   if (numbers.length > 1) {
//     numbers[1] = numbers[1] - 1;
//   }

//   if (timezone === 'UTC') {
//     return momentST.utc(numbers);
//   } else {
//     return momentST(numbers);
//   }
// }

// export function momentTZDatetimeFn(...args: Array<number | string>): MomentTZ {
//   if (args.length === 0 || typeof args[0] !== 'number') {
//     const tz = args[0];
//     return tz === 'UTC'
//       ? momentTZ().tz('UTC')
//       : [null, undefined].includes((tz as unknown) as null | undefined)
//       ? momentTZ()
//       : momentTZ().tz(tz);
//   }

//   const numbers: number[] = [];
//   let timezone: string | null = null;

//   args.forEach(arg => {
//     if (typeof arg === 'string' || arg === null) {
//       timezone = arg;
//     } else {
//       numbers.push(arg);
//     }
//   });

//   if (numbers.length > 1) {
//     numbers[1] = numbers[1] - 1;
//   }

//   if (timezone) {
//     return momentTZ.tz(numbers, timezone);
//   } else {
//     return momentTZ(numbers);
//   }
// }

// export function luxonDatetimeFn(...args: Array<number | string>): LuxonDateTime {
//   if (args.length === 0 || typeof args[0] !== 'number') {
//     const tz = args[0];

//     // prettier-ignore
//     return tz === 'UTC' ? LuxonDateTime.utc()
//       : [null, undefined].includes((tz as unknown) as null | undefined) ? LuxonDateTime.local()
//       : LuxonDateTime.fromObject({zone: tz as string});
//   }

//   if (args.length === 0) {
//     return LuxonDateTime.local();
//   }

//   const numbers: number[] = [];
//   let timezone: string | null = null;

//   args.forEach(arg => {
//     if (typeof arg === 'string' || arg === null) {
//       timezone = arg;
//     } else {
//       numbers.push(arg);
//     }
//   });

//   if (timezone) {
//     return LuxonDateTime.fromObject({
//       year: numbers[0],
//       month: numbers[1],
//       day: numbers[2],
//       hour: numbers[3],
//       minute: numbers[4],
//       second: numbers[5],
//       millisecond: numbers[6],
//       zone: timezone,
//     });
//   } else {
//     return LuxonDateTime.local(...numbers);
//   }
// }

// export function jodaDatetimeFn(...args: Array<number | string>): JodaDateTime {
//   if (args.length === 0 || typeof args[0] !== 'number') {
//     const tz = args[0];

//     // prettier-ignore
//     return tz === 'UTC' ? JodaDateTime.now(ZoneId.UTC)
//       : [null, undefined].includes((tz as unknown) as null | undefined) ? JodaDateTime.now(ZoneId.SYSTEM)
//       : JodaDateTime.now(ZoneId.of(tz as string));
//   }

//   if (args.length === 0) {
//     return JodaDateTime.now(ZoneId.SYSTEM);
//   }

//   const numbers: number[] = [];
//   let timezone: string | null = null;

//   args.forEach(arg => {
//     if (typeof arg === 'string' || arg === null) {
//       timezone = arg;
//     } else {
//       numbers.push(arg);
//     }
//   });

//   const zone =
//     timezone === 'UTC'
//       ? ZoneId.UTC
//       : [null, undefined].includes((timezone as unknown) as null | undefined)
//       ? ZoneId.SYSTEM
//       : ZoneId.of((timezone as unknown) as string);

//   return JodaDateTime.of(
//     numbers[0],
//     numbers[1] || 1,
//     numbers[2] || 1,
//     numbers[3] || 0,
//     numbers[4] || 0,
//     numbers[5] || 0,
//     (numbers[6] || 0) * 1_000_000,
//     zone,
//   );
// }

// export function datetime(): Date;
// export function datetime(a: number): Date;
// export function datetime(a: number, b: number): Date;
// export function datetime(a: number, b: number, c: number): Date;
// export function datetime(a: number, b: number, c: number, d: number): Date;
// export function datetime(a: number, b: number, c: number, d: number, e: number): Date;
// export function datetime(a: number, b: number, c: number, d: number, e: number, f: number): Date;
// export function datetime(
//   a: number,
//   b: number,
//   c: number,
//   d: number,
//   e: number,
//   f: number,
//   g: number,
// ): Date;
// export function datetime(
//   a: number,
//   b: number,
//   c: number,
//   d: number,
//   e: number,
//   f: number,
//   g: number,
//   timezone?: string,
// ): Date;
// export function datetime(...args: Array<number | string | undefined>) {
//   if (args.length > 1) {
//     args[1] = (args[1] as number) - 1;
//   }

//   const lastArg = args[args.length - 1];

//   if (typeof lastArg === 'string') {
//     args.pop();
//     return new Date(Date.UTC(...(args as [number, number, number])));
//   } else if (lastArg === null) {
//     args.pop();
//   }

//   return new Date(...(args as [number, number, number]));
// }

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
  const num = args as number[];

  return DateTime.fromJSON({
    timezone: (num[7] as any) || null,
    year: num[0]!,
    month: num[1] || 1,
    day: num[2] || 1,
    hour: num[3] || 0,
    minute: num[4] || 0,
    second: num[5] || 0,
    millisecond: num[6] || 0,
  }).toISOString();
}

// export function dateAdapter(): StandardDateAdapter;
// export function dateAdapter(a: number): StandardDateAdapter;
// export function dateAdapter(a: number, b: number): StandardDateAdapter;
// export function dateAdapter(a: number, b: number, c: number): StandardDateAdapter;
// export function dateAdapter(a: number, b: number, c: number, d: number): StandardDateAdapter;
// export function dateAdapter(
//   a: number,
//   b: number,
//   c: number,
//   d: number,
//   e: number,
// ): StandardDateAdapter;
// export function dateAdapter(
//   a: number,
//   b: number,
//   c: number,
//   d: number,
//   e: number,
//   f: number,
// ): StandardDateAdapter;
// export function dateAdapter(
//   a: number,
//   b: number,
//   c: number,
//   d: number,
//   e: number,
//   f: number,
//   g: number,
// ): StandardDateAdapter;
// export function dateAdapter(
//   a: number,
//   b: number,
//   c: number,
//   d: number,
//   e: number,
//   f: number,
//   g: number,
//   timezone?: string,
// ): StandardDateAdapter;
// export function dateAdapter(...args: Array<number | string | undefined>) {
//   // @ts-ignore
//   return new StandardDateAdapter(datetime(...args));
// }

// // function to create new dateAdapter instances
// export function timezoneDateAdapterFn(
//   dateAdapterConstructor: DateAdapterCTor,
//   datetimeFn: (...args: any[]) => any,
//   timezone: string | null,
// ): (...args: (number | { duration?: number; timezone?: string | null })[]) => DateAdapter {
//   return (...args: (number | { duration?: number; timezone?: string | null })[]) => {
//     let options: { duration?: number; timezone?: string | null } = { timezone };

//     if (args.length !== 0 && typeof args[args.length - 1] === 'object') {
//       options = {
//         ...options,
//         ...(args.pop() as { duration?: number; timezone?: string | null }),
//       };
//     }

//     const dateAdapterArgs: (string | number | null)[] = args as number[];

//     dateAdapterArgs.push(options.timezone!);

//     return dateAdapterConstructor.fromDate(datetimeFn(...dateAdapterArgs), options);
//   };
// }

export function dateAdapterFn(timezone: string | null) {
  return (...args: (number | { duration?: number; timezone?: string | null })[]) => {
    if (args.length === 0) {
      const now = new Date();
      args = [
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds(),
      ];
    }

    let options: { duration?: number; timezone?: string | null } = {};

    if (typeof args[args.length - 1] === 'object') {
      options = args.pop() as any;
    }

    const num = args as number[];

    return DateAdapterBase.adapter.fromJSON({
      timezone: options.timezone === undefined ? timezone : options.timezone,
      duration: options.duration,
      year: num[0]!,
      month: num[1] || 1,
      day: num[2] || 1,
      hour: num[3] || 0,
      minute: num[4] || 0,
      second: num[5] || 0,
      millisecond: num[6] || 0,
    });
  };
}

// // function to get the given time array as an ISO string
export function isoStringFn(timezone: string | null): (...args: number[]) => string {
  const dateAdapter = dateAdapterFn(timezone);
  return (...args: number[]) => dateAdapter(...args).toISOString();
}

// // function to get the given time array as an ISO string
export function occurrencesToIsoStrings(...args: OccurrenceGenerator[]): string[] {
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

export function dateTimeToAdapterFn(timezone: string | null) {
  return (date: DateTime, options: { keepZone?: boolean } = {}) =>
    options.keepZone
      ? DateAdapterBase.adapter.fromDateTime(date)
      : DateAdapterBase.adapter.fromDateTime(date).set('timezone', timezone);
}

export function dateTimeFn(dateAdapter: (...args: number[]) => DateAdapter) {
  return (...args: number[]) => DateTime.fromDateAdapter(dateAdapter(...args));
}

export function toISOStrings(
  schedule: OccurrenceGenerator | DateAdapter[],
  args: IOccurrencesArgs = {},
) {
  if (Array.isArray(schedule)) {
    return schedule.map(date => date.toISOString());
  }

  return schedule
    .occurrences(args)
    .toArray()!
    .map(occ => occ.toISOString());
}

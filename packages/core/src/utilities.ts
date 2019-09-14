import { DateAdapter, DateAdapterBase, DateInput, DateTime } from './DateAdapter';

export class ArgumentError extends Error {}
export class InfiniteLoopError extends Error {}

export function numberSortComparer(a: number, b: number) {
  if (a > b) {
    return 1;
  } else if (b > a) {
    return -1;
  } else {
    return 0;
  }
}

export function freqToGranularity(freq: string) {
  switch (freq) {
    case 'YEARLY':
      return 'year';
    case 'MONTHLY':
      return 'month';
    case 'WEEKLY':
      return 'week';
    case 'DAILY':
      return 'day';
    case 'HOURLY':
      return 'hour';
    case 'MINUTELY':
      return 'minute';
    case 'SECONDLY':
      return 'second';
    case 'MILLISECONDLY':
      return 'millisecond';
    default:
      throw new Error('unknown freq passed to freqToGranularity()');
  }
}

export function cloneJSON<T>(json: T): T {
  return JSON.parse(JSON.stringify(json));
}

export function dateInputToDateAdapter(date: DateInput): DateAdapter {
  // prettier-ignore
  return date instanceof DateTime ? DateAdapterBase.adapter.fromDateTime(date) :
    date instanceof DateAdapterBase ? date :
    DateAdapterBase.adapter.fromDate(date);
}

export function dateInputToDateTime(date: DateInput, timezone: string | null): DateTime {
  if (date instanceof DateTime) {
    if (date.timezone !== timezone) {
      return DateAdapterBase.adapter
        .fromDateTime(date)
        .set('timezone', timezone)
        .toDateTime();
    }

    return date;
  }

  return date instanceof DateAdapterBase
    ? date.set('timezone', timezone).toDateTime()
    : DateAdapterBase.adapter
        .fromDate(date)
        .set('timezone', timezone)
        .toDateTime();
}

// export function normalizeDateInput<T extends DateAdapter>(
//   dateAdapter: DateAdapterConstructor<T>,
//   input: DateInput<T>,
//   timezone: string | null,
// ): DateTime {
//   if (input instanceof DateTime) {
//     if (input.timezone !== timezone) {
//       return dateAdapter
//         .fromDateTime(input)
//         .set('timezone', timezone)
//         .toDateTime();
//     }

//     return input;
//   }

//   return input instanceof DateAdapter
//     ? input.set('timezone', timezone).toDateTime()
//     : new dateAdapter(input).toDateTime();
// }

export function normalizeDateTimeTimezone(date: DateTime, timezone: string | null): DateTime {
  if (date.timezone !== timezone) {
    return DateAdapterBase.adapter
      .fromDateTime(date)
      .set('timezone', timezone)
      .toDateTime();
  }

  return date;
}

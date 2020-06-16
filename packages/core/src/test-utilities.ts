import { DateTime } from '@rschedule/core';

export function dateTime(...args: number[]) {
  return DateTime.fromJSON({
    timezone: null,
    year: args[0],
    month: args[1] || 1,
    day: args[2] || 1,
    hour: args[3] || 0,
    minute: args[4] || 0,
    second: args[5] || 0,
    millisecond: args[6] || 0,
  });
}

export function isoString(...args: number[]) {
  return dateTime(...args).toISOString();
}

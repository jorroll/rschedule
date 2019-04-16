export class ArgumentError extends Error {}

export class InfiniteLoopError extends Error {}

export type ConstructorReturnType<T extends new (...args: any[]) => any> = T extends new (
  ...args: any[]
) => infer R
  ? R
  : any;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

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
    default:
      return 'millisecond';
  }
}

export function cloneJSON<T>(json: T): T {
  return JSON.parse(JSON.stringify(json));
}

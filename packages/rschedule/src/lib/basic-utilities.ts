export class ArgumentError extends Error {}

export class InfiniteLoopError extends Error {}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Include<T, U> = Exclude<T, Exclude<T, U>>;

// Taken from https://stackoverflow.com/a/53985533/5490505
// export type TupleUnshift<A, B extends readonly [...any[]]> = ((a: A, ...r: ForcedTuple<B>) => void) extends (
//   ...a: infer R
// ) => any
//   ? R
//   : never;

// type ForcedTuple<T> = T extends [
//   infer A,
//   infer B,
//   infer C,
//   infer D,
//   infer E,
//   infer F,
//   infer G,
//   infer H,
//   infer I,
//   infer J,
//   infer K,
//   infer L,
//   infer M,
//   infer N,
//   infer O,
//   infer P,
//   infer Q,
//   infer R,
//   infer S,
//   infer T,
//   infer U,
//   infer V,
//   infer W,
//   infer X,
//   infer Y,
//   infer Z
// ]
//   ? [A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z]
//   : T;

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

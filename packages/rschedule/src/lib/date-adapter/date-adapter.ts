export type ParsedDatetime =
  | [number, number, number, number, number, number, number]
  | [number, number, number, number, number, number]
  | [number, number, number, number, number]
  | [number, number, number, number]
  | [number, number, number];

export interface IDateAdapterJSON {
  zone: string | undefined;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface IDateAdapter<D = {}> {
  /**
   * This property contains an ordered array of the generator objects
   * responsible for producing this IDateAdapter.
   *
   * - If this IDateAdapter was produced by a `RRule` object, this array
   *   will just contain the `RRule` object.
   * - If this IDateAdapter was produced by a `Schedule` object, this
   *   array will contain the `Schedule` object as well as the `RRule`
   *   or `RDates` object which generated it.
   * - If this IDateAdapter was produced by a `Calendar` object, this
   *   array will contain, at minimum, the `Calendar`, `Schedule`, and
   *   `RRule`/`RDates` objects which generated it.
   */
  generators: any[];

  /** Returns the date object this IDateAdapter is wrapping */
  date: D;

  /** Returns a duplicate of original IDateAdapter */
  clone(): IDateAdapter<any>;

  /** mutates original object */
  add(amount: number, unit: IDateAdapter.Unit | 'week'): this;

  /** mutates original object */
  subtract(amount: number, unit: IDateAdapter.Unit | 'week'): this;

  get(unit: 'year'): number;
  get(unit: 'month'): number;
  get(unit: 'yearday'): number;
  get(unit: 'weekday'): IDateAdapter.Weekday;
  get(unit: 'day'): number;
  get(unit: 'hour'): number;
  get(unit: 'minute'): number;
  get(unit: 'second'): number;
  get(unit: 'millisecond'): number;
  /**
   * Returns the date's timezone
   *
   * - if "UTC" then `"UTC"`
   * - if local then `undefined`
   * - otherwise then `string`
   */
  get(unit: 'timezone'): string | undefined;

  /** mutates original object */
  set(unit: IDateAdapter.Unit, value: number): this;
  set(
    unit: 'timezone',
    value: string | undefined,
    options?: { keepLocalTime?: boolean },
  ): this;

  /** same format as `new Date().toISOString()` */
  toISOString(): string;

  toJSON(): IDateAdapterJSON;

  // returns the underlying date ordinal. The value in milliseconds.
  valueOf(): number;

  // Compares to `IDateAdapter` objects using `valueOf()`
  // to see if they are occuring at the same time.
  isEqual(object?: { valueOf: () => number }): boolean;
  isBefore(date: { valueOf: () => number }): boolean;
  isBeforeOrEqual(date: { valueOf: () => number }): boolean;
  isAfter(date: { valueOf: () => number }): boolean;
  isAfterOrEqual(date: { valueOf: () => number }): boolean;

  /**
   * If the IDateAdapter object is valid, returns `true`.
   * Otherwise, throws `IDateAdapter.InvalidDateError`
   */
  assertIsValid(): boolean;

  toDateTime(): {};
}

export type DateAdapterConstructor = new (...args: any[]) => IDateAdapter;

export interface IDateAdapterConstructor<T extends DateAdapterConstructor> {
  date: DateProp<T>;
  hasTimezoneSupport: boolean;
  new (date?: any, options?: any): DateAdapter<T>;
  isInstance(object?: any): object is DateAdapter<T>;
  isDate(object?: any): object is DateProp<T>;
  fromJSON(args: IDateAdapterJSON): DateAdapter<T>;
}

export type DateAdapter<T extends DateAdapterConstructor> = T extends new (
  ...args: any[]
) => infer R
  ? R
  : IDateAdapter;

export type DateProp<T extends DateAdapterConstructor> = DateAdapter<T>['date'];

export namespace IDateAdapter {
  export class InvalidDateError extends Error {
    constructor(public message = 'IDateAdapter has invalid date') {
      super(message);
    }
  }

  export type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

  export type Unit =
    | 'year'
    | 'month'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second'
    | 'millisecond';

  export enum Month {
    JAN = 1,
    FEB,
    MAR,
    APR,
    MAY,
    JUN,
    JUL,
    AUG,
    SEP,
    OCT,
    NOV,
    DEC,
  }

  export type IMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

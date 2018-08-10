export interface DateAdapter<T, R = any, S = any, C = any> {
    /** Returns a duplicate of original DateAdapter */
    clone(): T;
    /** The `Rule` which generated this `DateAdapter` */
    rule: R | undefined;
    /** The `Schedule` which generated this `DateAdapter` */
    schedule: S | undefined;
    /** The `Calendar` which generated this `DateAdapter` */
    calendar: C | undefined;
    /** mutates original object */
    add(amount: number, unit: DateAdapter.Unit): T;
    /** mutates original object */
    subtract(amount: number, unit: DateAdapter.Unit): T;
    get(unit: 'year'): number;
    get(unit: 'month'): number;
    get(unit: 'yearday'): number;
    get(unit: 'weekday'): DateAdapter.Weekday;
    get(unit: 'day'): number;
    get(unit: 'hour'): number;
    get(unit: 'minute'): number;
    get(unit: 'second'): number;
    get(unit: 'millisecond'): number;
    get(unit: 'ordinal'): number;
    get(unit: 'tzoffset'): number;
    get(unit: 'timezone'): string | undefined;
    /** mutates original object */
    set(unit: DateAdapter.Unit, value: number): T;
    set(unit: 'timezone', value: string | undefined): T;
    /** same format as new Date().toISOString() */
    toISOString(): string;
    toICal(utc?: boolean): string;
    isSameClass(object: any): object is T;
    isEqual(object: any): object is T;
    isBefore(date: T): boolean;
    isBeforeOrEqual(date: T): boolean;
    isAfter(date: T): boolean;
    isAfterOrEqual(date: T): boolean;
    /**
     * If the DateAdapter object is valid, returns `true`.
     * Otherwise, throws `DateAdapter.InvalidDateError`
     */
    assertIsValid(): boolean;
}
export interface Constructor {
    new (...args: any[]): any;
}
export declare type DateAdapterConstructor<T extends Constructor> = new (...args: any[]) => DateAdapter<InstanceType<T>>;
export interface IDateAdapterConstructor<T extends Constructor> {
    new (n: any): InstanceType<T>;
    isInstance(object: any): object is InstanceType<T>;
    fromTimeObject(args: {
        datetimes: [number, number, number, number | undefined, number | undefined, number | undefined][];
        timezone?: string;
        raw: string;
    }): InstanceType<T>[];
}
export declare namespace DateAdapter {
    class InvalidDateError extends Error {
        message: string;
        constructor(message?: string);
    }
    type Unit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond' | 'ordinal';
    type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';
    enum Month {
        JAN = 1,
        FEB = 2,
        MAR = 3,
        APR = 4,
        MAY = 5,
        JUN = 6,
        JUL = 7,
        AUG = 8,
        SEP = 9,
        OCT = 10,
        NOV = 11,
        DEC = 12
    }
    type IMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

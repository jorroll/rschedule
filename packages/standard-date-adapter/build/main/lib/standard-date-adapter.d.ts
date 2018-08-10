import { DateAdapter } from '@rschedule/rschedule';
export declare class StandardDateAdapter<R = any, S = any, C = any> implements DateAdapter<StandardDateAdapter> {
    date: Date;
    timezone: 'UTC' | undefined;
    /** The `Rule` which generated this `DateAdapter` */
    rule: R | undefined;
    /** The `Schedule` which generated this `DateAdapter` */
    schedule: S | undefined;
    /** The `Calendar` which generated this `DateAdapter` */
    calendar: C | undefined;
    constructor(date?: Date);
    static isInstance(object: any): object is StandardDateAdapter;
    static fromTimeObject(args: {
        datetimes: [number, number, number, number | undefined, number | undefined, number | undefined][];
        timezone: string | undefined;
        raw: string;
    }): StandardDateAdapter[];
    clone(): StandardDateAdapter;
    isSameClass(object: any): object is StandardDateAdapter;
    isEqual(object: any): object is StandardDateAdapter;
    isBefore(object: StandardDateAdapter): boolean;
    isBeforeOrEqual(object: StandardDateAdapter): boolean;
    isAfter(object: StandardDateAdapter): boolean;
    isAfterOrEqual(object: StandardDateAdapter): boolean;
    add(amount: number, unit: DateAdapter.Unit): StandardDateAdapter;
    subtract(amount: number, unit: DateAdapter.Unit): StandardDateAdapter;
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
    get(unit: 'timezone'): 'UTC' | undefined;
    set(unit: DateAdapter.Unit, value: number): StandardDateAdapter;
    set(unit: 'timezone', value: 'UTC' | undefined): StandardDateAdapter;
    toISOString(): string;
    toICal(utc?: boolean): string;
    assertIsValid(): boolean;
}

import { DateAdapter } from '../date-adapter';
import { Options } from '../rule/rule-options';
export interface IPipeRunFn<T extends DateAdapter<T>> {
    date: T;
    invalidDate?: boolean;
    skipToIntervalOnOrAfter?: T;
}
export interface IPipeRule<T extends DateAdapter<T>> {
    nextPipe: IPipeRule<T> | null;
    controller: IPipeController<T>;
    run(args: IPipeRunFn<T>): T | null;
}
export interface IPipeController<T extends DateAdapter<T>> {
    start: T;
    end?: T;
    count?: number;
    isIteratingInReverseOrder: boolean;
    options: Options.ProcessedOptions<T>;
    invalid: boolean;
    expandingPipes: IPipeRule<T>[];
    focusedPipe: IPipeRule<T>;
}
export declare abstract class PipeRule<T extends DateAdapter<T>> {
    controller: IPipeController<T>;
    nextPipe: IPipeRule<T>;
    constructor(controller: IPipeController<T>);
    readonly options: Options.ProcessedOptions<T>;
    readonly start: T;
    readonly end: T | undefined;
    readonly count: number | undefined;
    readonly isIteratingInReverseOrder: boolean;
    readonly expandingPipes: IPipeRule<T>[];
    readonly focusedPipe: IPipeRule<T>;
    protected cloneDateWithGranularity(date: T, granularity: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'): T;
}

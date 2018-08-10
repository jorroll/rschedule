import { DateAdapter } from './date-adapter';
export interface Serializable {
    toICal(): string | string[];
}
export interface RunnableIterator<T extends DateAdapter<T>> {
    _run(args?: any): IterableIterator<T>;
    isInfinite: boolean;
    startDate: T | null;
}
export interface OccurrencesArgs<T extends DateAdapter<T>> {
    start?: T;
    end?: T;
    take?: number;
}
export interface IHasOccurrences<T extends DateAdapter<T>, K extends RunnableIterator<T>> {
    occurrences(args: OccurrencesArgs<T>): OccurrenceIterator<T, K>;
    occursBetween(start: T, end: T, options: {
        excludingEnds?: boolean;
    }): boolean;
    occursOn(date: T): boolean;
    occursAfter(date: T, options: {
        excludeStart?: boolean;
    }): boolean;
}
export declare abstract class HasOccurrences<T extends DateAdapter<T>> {
    occurrences(args: any): OccurrenceIterator<T, any>;
    occursBetween(start: T, end: T, options?: {
        excludingEnds?: boolean;
    }): boolean;
    occursOn(date: T): boolean;
    occursAfter(date: T, options?: {
        excludeStart?: boolean;
    }): boolean;
}
export declare class OccurrenceIterator<T extends DateAdapter<T>, K extends RunnableIterator<T>> {
    private iterable;
    private args;
    private iterator;
    constructor(iterable: K, args: OccurrencesArgs<T>);
    [Symbol.iterator]: () => IterableIterator<T>;
    next(): IteratorResult<T>;
    toArray(): T[] | undefined;
}

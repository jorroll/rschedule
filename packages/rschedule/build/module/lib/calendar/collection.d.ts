import { DateAdapter } from '../date-adapter';
import { Options } from '../rule';
import { RunnableIterator } from '../interfaces';
export declare class Collection<T extends DateAdapter<T>> {
    readonly dates: T[];
    readonly period: 'INSTANTANIOUSLY' | Options.Frequency;
    readonly periodStart: T;
    readonly periodEnd: T;
    constructor(dates: T[], period: 'INSTANTANIOUSLY' | Options.Frequency, periodStart: T, periodEnd: T);
}
export declare type CollectionsGranularity = 'INSTANTANIOUSLY' | Options.Frequency;
export interface CollectionsArgs<T extends DateAdapter<T>> {
    start?: T;
    end?: T;
    take?: number;
    granularity?: CollectionsGranularity;
    weekStart?: DateAdapter.Weekday;
}
export declare class CollectionIterator<T extends DateAdapter<T>, K extends RunnableIterator<T>> {
    private iterable;
    private args;
    private iterator;
    readonly granularity: CollectionsGranularity;
    readonly weekStart?: DateAdapter.Weekday;
    readonly startDate: T | null;
    constructor(iterable: K, args: CollectionsArgs<T>);
    [Symbol.iterator]: () => IterableIterator<Collection<T>>;
    iterateCollection(iterator: IterableIterator<T>): IterableIterator<Collection<T>>;
    next(): IteratorResult<Collection<T>>;
    /**
     * While `next()` and `[Symbol.iterator]` both share state,
     * `toArray()` does not share state and always returns the whole
     * collections array (or `undefined`, in the case of collection of
     * infinite length)
     */
    toArray(): Collection<T>[] | undefined;
    private getPeriodStart;
    private getPeriodEnd;
    private getIterator;
}

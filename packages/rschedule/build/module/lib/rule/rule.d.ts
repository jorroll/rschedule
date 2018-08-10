import { Options } from './rule-options';
import { DateAdapter } from '../date-adapter';
import { HasOccurrences, Serializable, OccurrencesArgs, RunnableIterator, IHasOccurrences, OccurrenceIterator } from '../interfaces';
export declare abstract class Rule<T extends DateAdapter<T, Rule<T, D>>, D = any> extends HasOccurrences<T> implements Serializable, RunnableIterator<T>, IHasOccurrences<T, Rule<T, D>> {
    private _options;
    /**
     * NOTE: The options object is frozen. To make changes you must assign a new options object.
     */
    options: Options.ProvidedOptions<T>;
    readonly isInfinite: boolean;
    /** From `options.start`. Note: you should not mutate the start date directly */
    readonly startDate: T;
    /** Convenience property for holding arbitrary data */
    data?: D;
    private usedPipeControllers;
    private processedOptions;
    constructor(options: Options.ProvidedOptions<T>);
    occurrences(args?: OccurrencesArgs<T>): OccurrenceIterator<T, Rule<T, D>>;
    /**  @private use occurrences() instead */
    _run(args?: OccurrencesArgs<T>): IterableIterator<T>;
    toICal(): string;
}
export declare class RRule<T extends DateAdapter<T>> extends Rule<T> {
    toICal(): string;
}
/**
 * This base class provides an iterable wrapper around the RDATEs array so that
 * it can be interacted with in the same manner as `Rule`
 */
export declare class RDatesBase<T extends DateAdapter<T>> extends HasOccurrences<T> implements Serializable, RunnableIterator<T>, IHasOccurrences<T, RDatesBase<T>> {
    dates: T[];
    readonly isInfinite: boolean;
    readonly length: number;
    readonly startDate: T | null;
    constructor(dates: T[]);
    occurrences(args?: OccurrencesArgs<T>): OccurrenceIterator<T, this>;
    _run(args?: OccurrencesArgs<T>): IterableIterator<T>;
    toICal(): string;
}
export declare class RDates<T extends DateAdapter<T>> extends RDatesBase<T> {
    toICal(): string;
}
export declare class EXDates<T extends DateAdapter<T>> extends RDatesBase<T> {
    toICal(): string;
}

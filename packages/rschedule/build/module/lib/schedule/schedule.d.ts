import { DateAdapter, DateAdapterConstructor, IDateAdapterConstructor } from '../date-adapter';
import { RRule, RDates, EXDates, Rule } from '../rule';
import { Options } from '../rule/rule-options';
import { HasOccurrences, Serializable, OccurrencesArgs, IHasOccurrences, RunnableIterator, OccurrenceIterator } from '../interfaces';
export declare class Schedule<T extends DateAdapter<T, Rule<T>, Schedule<T, D>>, D = any> extends HasOccurrences<T> implements Serializable, RunnableIterator<T>, IHasOccurrences<T, Schedule<T, D>> {
    rrules: RRule<T>[];
    rdates: RDates<T>;
    exdates: EXDates<T>;
    /** Convenience property for holding arbitrary data */
    data?: D;
    /**
     * The start date is the earliest RDATE or RRULE start date. The first valid
     * occurrence of the schedule does not necessarily equal the start date because
     * exdates are not taken into consideration.
     */
    readonly startDate: T | null;
    readonly isInfinite: boolean;
    constructor(args?: {
        rrules?: Options.ProvidedOptions<T>[];
        rdates?: T[];
        exdates?: T[];
    });
    static fromICal<T extends DateAdapterConstructor<T>>(icals: string | string[], dateAdapterConstructor: IDateAdapterConstructor<T>): Schedule<InstanceType<T>, any>;
    toICal(): string[];
    occurrences(args?: OccurrencesArgs<T>): OccurrenceIterator<T, Schedule<T, D>>;
    /**  @private use occurrences() instead */
    _run(args?: OccurrencesArgs<T>): IterableIterator<T>;
}

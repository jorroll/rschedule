import { DateAdapter } from '../date-adapter';
import { Schedule } from '../schedule/schedule';
import { HasOccurrences, OccurrenceIterator, IHasOccurrences, RunnableIterator, OccurrencesArgs } from '../interfaces';
import { CollectionsArgs, CollectionIterator } from './collection';
import { Rule } from '../rule';
export declare class Calendar<T extends DateAdapter<T, Rule<T>, Schedule<T>, Calendar<T, D>>, D = any> extends HasOccurrences<T> implements RunnableIterator<T>, IHasOccurrences<T, Calendar<T, D>> {
    schedules: Schedule<T>[];
    /** Convenience property for holding arbitrary data */
    data?: D;
    readonly startDate: T | null;
    readonly isInfinite: boolean;
    constructor(args?: {
        schedules?: Schedule<T>[] | Schedule<T>;
    });
    /**
     * Iterates over the calendar's occurrences and bundles them into collections
     * with a specified granularity (default is `"INSTANTANIOUS"`). Each `Collection`
     * object has:
     *
     *   - a `dates` property containing an array of DateAdapter objects.
     *   - a `period` property containing the granularity.
     *   - a `periodStart` property containing a DateAdapter equal to the period's
     *     start time.
     *   - a `periodEnd` property containing a DateAdapter equal to the period's
     *     end time.
     *
     * The `periodStart` value of `Collection` objects produced by this method does not
     * necessarily increment linearly. A collection *always* contains at least one date,
     * so the `periodStart` from one collection to the next can "jump".
     *
     * Example: If your granularity is `"DAILY"` and you start in January, but the earliest
     * a schedule outputs a date is in February, the first Collection produced will have a
     * `periodStart` in February.
     *
     * Another thing: when giving a `take` argument to `collections()`, you are specifying
     * the number of `Collection` objects to return (rather than occurrences).
     *
     * @param args
     */
    collections(args?: CollectionsArgs<T>): CollectionIterator<T, this>;
    /**
     * Iterates over the calendar's occurrences and simply spits them out in order.
     * Unlike `Schedule#occurrences()`, this method may spit out duplicate dates,
     * each of which are associated with a different `Schedule`. To see what
     * `Schedule` a date is associated with, you may use `DateAdapter#schedule`.
     *
     * @param args
     */
    occurrences(args?: OccurrencesArgs<T>): OccurrenceIterator<T, this>;
    /**  @private use collections() instead */
    _run(args?: CollectionsArgs<T>): IterableIterator<T>;
}

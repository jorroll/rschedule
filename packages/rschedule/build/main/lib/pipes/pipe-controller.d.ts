import { DateAdapter } from '../date-adapter';
import { IPipeRule, IPipeController } from './interfaces';
import { Options } from '../rule/rule-options';
import { RunnableIterator } from '../interfaces';
/**
 * Steps
 *
 * 1. Figure out start date and, optionally, end date
 * 2. Figure out which months are applicable to that start date and end date
 * 3. remove `byMonthOfYear` months that aren't applicable
 *
 * - for whatever `byXXX` rules aren't supplied, have pipes at the end that fill
 *   in the date with the appropriate bits of the starting date.
 *
 * - the start date needs to be a valid occurrence
 */
export declare class PipeController<T extends DateAdapter<T>> implements IPipeController<T>, RunnableIterator<T> {
    options: Options.ProcessedOptions<T>;
    start: T;
    end?: T;
    count?: number;
    isIteratingInReverseOrder: boolean;
    expandingPipes: IPipeRule<T>[];
    readonly focusedPipe: IPipeRule<T>;
    readonly startDate: T;
    /**
     * If the parent of this pipe controller (`Rule` object) changes the `options` object
     * this pipe controller will be invalid. To prevent someone from accidently continuing
     * to use an invalid iterator, we invalidate the old one so it will throw an error.
     */
    invalid: boolean;
    readonly isInfinite: boolean;
    private pipes;
    constructor(options: Options.ProcessedOptions<T>, args: {
        start?: T;
        end?: T;
        reverse?: boolean;
        take?: number;
    });
    _run(): IterableIterator<T>;
    private addPipe;
    private setStartDate;
    private setEndDate;
    private setCount;
}

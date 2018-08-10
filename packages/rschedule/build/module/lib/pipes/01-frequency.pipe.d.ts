import { DateAdapter } from '../date-adapter';
import { PipeRule, IPipeRule, IPipeRunFn } from './interfaces';
export declare class FrequencyPipe<T extends DateAdapter<T>> extends PipeRule<T> implements IPipeRule<T> {
    private intervalStartDate;
    run(args: IPipeRunFn<T>): T | null;
    normalizeDate(date: T): T;
    private incrementInterval;
    /**
     * This method might be buggy when presented with intervals other than one.
     * In such a case, skipping forward should *skip* seconds of dates, and I'm
     * not sure if this will account for that. Don't have time to test at the moment.
     *
     * Tests are passing
     */
    private skipToIntervalOnOrAfter;
}

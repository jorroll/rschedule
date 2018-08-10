import { DateAdapter } from '../date-adapter';
import { PipeRule, IPipeRule, IPipeRunFn } from './interfaces';
export declare class ByDayOfMonthPipe<T extends DateAdapter<T>> extends PipeRule<T> implements IPipeRule<T> {
    run(args: IPipeRunFn<T>): T | null;
    private upcomingMonthDays;
    yearlyExpand(args: IPipeRunFn<T>): T | null;
    private upcomingDays;
    expand(args: IPipeRunFn<T>): T | null;
    filter(args: IPipeRunFn<T>): T | null;
}

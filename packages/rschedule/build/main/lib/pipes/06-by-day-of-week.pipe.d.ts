import { DateAdapter } from '../date-adapter';
import { PipeRule, IPipeRule, IPipeRunFn } from './interfaces';
export declare class ByDayOfWeekPipe<T extends DateAdapter<T>> extends PipeRule<T> implements IPipeRule<T> {
    run(args: IPipeRunFn<T>): T | null;
    private cachedValidMonthDays;
    private cachedValidYearDays;
    private upcomingDays;
    yearlyExpand(args: IPipeRunFn<T>): T | null;
    monthlyExpand(args: IPipeRunFn<T>): T | null;
    weeklyExpand(args: IPipeRunFn<T>): T | null;
    yearlyFilter(args: IPipeRunFn<T>): T | null;
    monthlyFilter(args: IPipeRunFn<T>): T | null;
    simpleFilter(args: IPipeRunFn<T>): T | null;
}

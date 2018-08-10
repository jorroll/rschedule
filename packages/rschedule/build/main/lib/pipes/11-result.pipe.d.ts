import { DateAdapter } from '../date-adapter';
import { PipeRule, IPipeRule, IPipeRunFn } from './interfaces';
export declare class PipeError extends Error {
}
export declare class ResultPipe<T extends DateAdapter<T>> extends PipeRule<T> implements IPipeRule<T> {
    private invalidIterationCount;
    private previousIterationDate?;
    run(args: IPipeRunFn<T>): T | null;
}

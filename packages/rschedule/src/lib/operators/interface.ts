import { DateAdapter, DateAdapterConstructor } from '../date-adapter';
import { RunArgs } from '../interfaces';

export interface OperatorObject<T extends DateAdapterConstructor> {
  isInfinite: boolean;
  _run: (args?: RunArgs<T>) => IterableIterator<DateAdapter<T>>;
  setTimezone(
    timezone: string | undefined,
    options?: { keepLocalTime?: boolean },
  ): void;
  clone(): any;
}

export interface OperatorOutputOptions<T extends DateAdapterConstructor> {
  dateAdapter: T;
  base?: IterableIterator<DateAdapter<T>>;
  baseIsInfinite?: boolean;
}

export type OperatorInput<T extends DateAdapterConstructor> = OperatorObject<T>;
export type OperatorOutput<T extends DateAdapterConstructor> = (
  options: OperatorOutputOptions<T>,
) => OperatorObject<T>;

export type OccurrenceStream<T extends DateAdapterConstructor> = (
  dateAdapter: T,
) => OperatorObject<T>;

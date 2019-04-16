import { ConstructorReturnType } from '../basic-utilities';
import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';

export interface IRunnable<T extends typeof DateAdapter> {
  readonly timezone: string | null;
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  firstDate: ConstructorReturnType<T> | null;
  lastDate: ConstructorReturnType<T> | undefined | null;
  _run(args?: any): IterableIterator<DateTime>;
  set(prop: 'timezone', value: string | null): IRunnable<T>;
}

export interface IRunArgs {
  start?: DateTime;
  end?: DateTime;
  take?: number;
  reverse?: boolean;
}

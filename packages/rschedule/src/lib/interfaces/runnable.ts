import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';

export interface IRunnable<T extends typeof DateAdapter> {
  readonly timezone: string | null;
  readonly isInfinite: boolean;
  /** note: an iterator without any occurrences hasDuration === true */
  readonly hasDuration: boolean;
  firstDate: InstanceType<T> | null;
  lastDate: InstanceType<T> | undefined | null;
  /** @internal */
  _run(args?: any): IterableIterator<DateTime>;
  set(prop: 'timezone', value: string | null): IRunnable<T>;
}

export interface IRunArgs {
  start?: DateTime;
  end?: DateTime;
  take?: number;
  reverse?: boolean;
}

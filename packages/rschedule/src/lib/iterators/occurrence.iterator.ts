import { ConstructorReturnType, InfiniteLoopError } from '../basic-utilities';
import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IOccurrenceGenerator } from '../interfaces';
import { IRunArgs } from '../interfaces/runnable';
import { DateInput } from '../utilities';

export class OccurrenceIterator<T extends typeof DateAdapter> {
  private readonly iterator: IterableIterator<DateTime>;
  private readonly isInfinite: boolean;

  constructor(private iterable: IOccurrenceGenerator<T>, private args: IRunArgs) {
    this.iterator = iterable._run(args);
    this.isInfinite = iterable.isInfinite;
  }

  [Symbol.iterator] = () => this._run();

  next(args?: { skipToDate?: DateInput<T> }) {
    return this._run(args).next();
  }

  toArray() {
    if (this.args.end || this.args.take || !this.isInfinite) {
      return Array.from(this._run());
    }

    throw new InfiniteLoopError(
      'OccurrenceIterator#toArray() can only be called if the iterator ' +
        'is not infinite, or you provide and `end` argument, or you provide ' +
        'a `take` argument.',
    );
  }

  private *_run(rawArgs?: { skipToDate?: DateInput<T> }) {
    let args = this.normalizeRunArgs(rawArgs);

    let date = this.iterator.next(args).value;

    while (date) {
      const yieldArgs = yield this.normalizeDateOutput(date);

      args = this.normalizeRunArgs(yieldArgs);

      date = this.iterator.next(args).value;
    }
  }

  private normalizeRunArgs(args?: { skipToDate?: DateInput<T> }) {
    return {
      skipToDate: this.normalizeDateInput(args && args.skipToDate),
    };
  }

  private normalizeDateInput(date?: DateInput<T>) {
    if (!date) {
      return;
    }

    return DateAdapter.isInstance(date)
      ? date.set('timezone', this.iterable.timezone).toDateTime()
      : new this.iterable.dateAdapter(date).set('timezone', this.iterable.timezone).toDateTime();
  }

  private normalizeDateOutput(date: DateTime): ConstructorReturnType<T>;
  private normalizeDateOutput(date?: DateTime): undefined;
  private normalizeDateOutput(date?: DateTime) {
    if (!date) {
      return;
    }

    return this.iterable.dateAdapter.fromDateTime(date) as ConstructorReturnType<T>;
  }
}

export interface IOccurrencesArgs<T extends typeof DateAdapter> {
  start?: DateInput<T>;
  end?: DateInput<T>;
  take?: number;
  reverse?: boolean;
}

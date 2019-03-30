import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { DateInput, IHasOccurrences } from '../interfaces';
import { IRunArgs } from '../interfaces/runnable';
import { ConstructorReturnType } from '../utilities';

export class OccurrenceIterator<T extends typeof DateAdapter> {
  private readonly iterator: IterableIterator<DateTime>;
  private readonly isInfinite: boolean;

  constructor(private iterable: IHasOccurrences<T>, private args: IRunArgs) {
    this.iterator = iterable._run(args);
    this.isInfinite = iterable.isInfinite;
  }

  [Symbol.iterator] = () => this._run();

  next(args?: { skipToDate?: DateInput<T> }): IteratorResult<ConstructorReturnType<T>> {
    return this._run(args).next() as any;
  }

  toArray() {
    if (this.args.end || this.args.take || !this.isInfinite) {
      return Array.from(this._run());
    }
  }

  private *_run(rawArgs?: { skipToDate?: DateInput<T> }) {
    let args = this.normalizeRunArgs(rawArgs);

    let date = this.iterator.next(args).value;

    while (date) {
      const yieldArgs = yield this.normalizeDateOutput(date)!;

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

  private normalizeDateOutput(date?: DateTime) {
    if (!date) {
      return;
    }

    return this.iterable.dateAdapter.fromJSON(date.toJSON());
  }
}

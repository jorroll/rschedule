import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { DateInput, IHasOccurrences, IRunArgs, IRunnable } from '../interfaces';
import { ConstructorReturnType } from '../utilities';

export abstract class Operator<T extends typeof DateAdapter> implements IRunnable<T> {
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  readonly timezone: string | undefined;

  /** Returns the first occurrence or, if there are no occurrences, null. */
  get firstDate(): ConstructorReturnType<T> | null {
    const start = this._run().next().value;

    if (!start) return null;

    return this.config.dateAdapter.fromJSON(start.toJSON()) as ConstructorReturnType<T>;
  }

  /** If generator is infinite, returns `null`. Otherwise returns the end date */
  get lastDate(): ConstructorReturnType<T> | null {
    if (this.isInfinite) return null;

    const end = this._run({ reverse: true }).next().value;

    if (!end) return null;

    return this.config.dateAdapter.fromJSON(end.toJSON()) as ConstructorReturnType<T>;
  }

  constructor(readonly _streams: IHasOccurrences<T>[], protected config: IOperatorConfig<T>) {
    this._streams = _streams.map(stream =>
      stream instanceof Operator ? stream : stream.set('timezone', config.timezone),
    );

    this.isInfinite =
      (!this.config.base || this.config.base.isInfinite) &&
      this._streams.every(stream => stream.isInfinite);

    this.hasDuration =
      (!this.config.base || this.config.base.hasDuration) &&
      this._streams.every(stream => stream.hasDuration);
  }

  abstract set(_: 'timezone', value: string | undefined): Operator<T>;

  abstract _run(args?: IRunArgs): IterableIterator<DateTime>;

  protected normalizeDateInput(date?: DateInput<T>) {
    if (!date) {
      return;
    } else if (DateTime.isInstance(date)) {
      return date;
    }

    return DateAdapter.isInstance(date)
      ? date.set('timezone', this.config.timezone).toDateTime()
      : new this.config.dateAdapter(date).set('timezone', this.config.timezone).toDateTime();
  }

  protected normalizeRunOutput(date: DateTime) {
    if (date.timezone !== this.config.timezone) {
      return this.config.dateAdapter
        .fromJSON(date.toJSON())
        .set('timezone', this.config.timezone)
        .toDateTime();
    }

    return date;
  }
}

export type OperatorFn<T extends typeof DateAdapter> = () => OperatorFnOutput<T>;

export type OperatorFnOutput<T extends typeof DateAdapter> = (
  options: IOperatorConfig<T>,
) => Operator<T>;

export interface IOperatorConfig<T extends typeof DateAdapter> {
  dateAdapter: T;
  timezone: string | undefined;
  base?: IRunnable<T>;
}

import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IOccurrenceGenerator, IRunArgs, IRunnable } from '../interfaces';
import { RScheduleConfig } from '../rschedule-config';
import { DateInput, dateInputToDateTime } from '../utilities';

const OPERATOR_ID = Symbol.for('aa6007dc-1d7f-4955-b7f1-86a226463f7e');

export abstract class Operator<T extends typeof DateAdapter> implements IRunnable<T> {
  static isOperator<T extends typeof DateAdapter = typeof DateAdapter>(
    object: unknown,
  ): object is Operator<T> {
    return !!(object && typeof object === 'object' && (object as any)[OPERATOR_ID]);
  }

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  readonly timezone: string | null;

  /** Returns the first occurrence or, if there are no occurrences, null. */
  get firstDate(): InstanceType<T> | null {
    const start = this._run().next().value;

    if (!start) return null;

    return this.config.dateAdapter.fromDateTime(start) as InstanceType<T>;
  }

  /** If generator is infinite, returns `null`. Otherwise returns the end date */
  get lastDate(): InstanceType<T> | null {
    if (this.isInfinite) return null;

    const end = this._run({ reverse: true }).next().value;

    if (!end) return null;

    return this.config.dateAdapter.fromDateTime(end) as InstanceType<T>;
  }

  protected readonly [OPERATOR_ID] = true;

  constructor(readonly _streams: IOccurrenceGenerator<T>[], protected config: IOperatorConfig<T>) {
    this.timezone = config.timezone;

    this._streams = _streams.map(stream =>
      stream instanceof Operator ? stream : stream.set('timezone', this.timezone),
    );

    this.isInfinite =
      (!this.config.base || this.config.base.isInfinite) &&
      this._streams.every(stream => stream.isInfinite);

    this.hasDuration =
      (!this.config.base || this.config.base.hasDuration) &&
      this._streams.every(stream => stream.hasDuration);
  }

  abstract set(_: 'timezone', value: string | null): Operator<T>;

  abstract _run(args?: IRunArgs): IterableIterator<DateTime>;

  protected normalizeDateInput(date: DateInput<T>): DateTime;
  protected normalizeDateInput(date?: DateInput<T>): undefined;
  protected normalizeDateInput(date?: DateInput<T>) {
    if (!date) return;

    return dateInputToDateTime(date, this.timezone, this.config.dateAdapter);
  }

  protected normalizeRunOutput(date: DateTime) {
    if (date.timezone !== this.timezone) {
      return this.config.dateAdapter
        .fromDateTime(date)
        .set('timezone', this.timezone)
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
  timezone: string | null;
  base?: IRunnable<T>;
}

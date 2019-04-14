import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IRunArgs, OccurrenceGenerator } from '../interfaces';
import { ArgumentError } from '../utilities';
import { add } from './add.operator';
import { Operator, OperatorFnOutput } from './interface';

const OCCURRENCE_STREAM_ID = Symbol.for('dfe5463b-8eb2-46c4-a769-c641c241221c');

/**
 * `OccurrenceStream` allows you to combine occurrence generators using
 * operator functions to produce new, complex recurrence schedules.
 * For example: internally, `Schedule` relies on an `OccurrenceStream` to combine
 * rrules, exrules, rdates, and exdates appropriately.
 * 
 * ### Example
 ```
 const schedule1 = new Schedule();
 const schedule2 = new Rule();
 const dates = new Dates();

 const stream = new OccurrenceStream({
   operators: [
     add(schedule1),
     subtract(schedule2, dates)
   ]
 })

 stream.occurrences().toArray() // occurrences

 new Calendar({ schedules: stream }).occurrences().toArray() // occurrences
 ```
 * In general, you should not need to manually create an `OccurrenceStream`.
 * Instead, you can use `OccurrenceGenerater#pipe()` to pass an occurrence
 * generator's occurrences through various operator functions (similar to
 * rxjs pipes).
 * 
 * ### Example
 ```
 const schedule = new Schedule().pipe(
  add(schedule1),
  subtract(schedule2, dates)
 )

 schedule.occurrences().toArray() // occurrences
 ```
 * 
 * Operator functions:
 * - add()
 * - subtract()
 * - intersection()
 * - unique()
 */

export class OccurrenceStream<T extends typeof DateAdapter> extends OccurrenceGenerator<T> {
  /**
   * Similar to `Array.isArray()`, `isOccurrenceStream()` provides a surefire method
   * of determining if an object is an `OccurrenceStream` by checking against the
   * global symbol registry.
   */
  static isOccurrenceStream(object: unknown): object is OccurrenceStream<any> {
    return !!(object && typeof object === 'object' && (object as any)[OCCURRENCE_STREAM_ID]);
  }

  pipe: (...operatorFns: OperatorFnOutput<T>[]) => OccurrenceStream<T> = pipeFn(this);

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  readonly timezone!: string | null;

  readonly operators: ReadonlyArray<Operator<T>> = [];

  get _run() {
    return this.lastOperator ? this.lastOperator._run.bind(this.lastOperator) : this.emptyIterator;
  }

  private readonly lastOperator: Operator<T> | undefined;

  constructor(args: {
    operators: OperatorFnOutput<T>[] | Operator<T>[];
    dateAdapter?: T;
    timezone?: string | null;
  }) {
    super(args);

    if (!args.operators || args.operators.length === 0) {
      throw new ArgumentError('OccurrenceStream must be provided an array of operators)');
    }

    if (args.operators[0] instanceof Operator) {
      this.operators = args.operators as Operator<T>[];
    } else {
      const operatorFns = args.operators as OperatorFnOutput<T>[];

      if (operatorFns.length === 1) {
        this.operators = [
          operatorFns[0]({ dateAdapter: this.dateAdapter, timezone: this.timezone }),
        ];
      } else if (operatorFns.length > 1) {
        this.operators = operatorFns.reduce(
          (prev, curr) => {
            const base = prev[prev.length - 1];

            prev.push(curr({ dateAdapter: this.dateAdapter, base, timezone: this.timezone }));

            return prev;
          },
          [] as Operator<T>[],
        );
      }
    }

    this.lastOperator = this.operators[this.operators.length - 1];
    this.isInfinite = (this.lastOperator && this.lastOperator.isInfinite) || false;
    this.hasDuration = (this.lastOperator && this.lastOperator.hasDuration) || false;
  }

  set(_: 'timezone', value: string | null): OccurrenceStream<T> {
    return new OccurrenceStream({
      operators: this.operators.map(operator => operator.set('timezone', value)),
      dateAdapter: this.dateAdapter,
      timezone: value,
    });
  }

  private *emptyIterator(args?: IRunArgs | undefined): IterableIterator<DateTime> {
    return;
  }
}

export function pipeFn<T extends typeof DateAdapter>(self: OccurrenceGenerator<T>) {
  return (...operatorFns: OperatorFnOutput<T>[]) =>
    new OccurrenceStream({
      operators: [add<T>(self), ...operatorFns],
      dateAdapter: self.dateAdapter,
      timezone: self.timezone,
    });
}

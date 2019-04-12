import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IRunArgs, OccurrenceGenerator } from '../interfaces';
import { ArgumentError } from '../utilities';
import { add } from './add.operator';
import { Operator, OperatorFnOutput } from './interface';

const OCCURRENCE_STREAM_ID = Symbol.for('dfe5463b-8eb2-46c4-a769-c641c241221c');

/**
 * This function allows you to build a new, complex recurrance schedule by
 * combining the output of other schedules using various operator
 * functions. You can then feed the result into a `Calendar` object
 * as input.
 * 
 * ### Example
 ```
 const includeDatesFromTheseSchedules = [new Schedule()]

 const excludeDatesFromTheseSchedules = [
   new Schedule(),
   new EXRule()
  ]

 const includeTheseSpecificDates = new RDates()
 const excludeTheseSpecificDates = new EXDates()

 const customSchedule = occurrenceStream(
    add(...includeDatesFromTheseSchedules),
    subtract(...excludeDatesFromTheseSchedules),
    add(includeTheseSpecificDates),
    subtract(excludeTheseSpecificDates),
    unique(),
  )

 new Calendar({
   schedules: customSchedule
 })
 ```
 * This function works similarly to the `pipe()` method in rxjs, in that
 * it receives an arbitrary number of `operator()` functions as arguments
 * and uses the functions to create a new, single stream of occurrences.
 * 
 * Internally, it uses the result of one operator function as the input for
 * the next operator function, meaning that the order of functions matters.
 * 
 * @param operators a spread of operator functions
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

  pipe = pipeFn(this);

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  readonly timezone!: string | null;

  /** @private do not use */
  readonly _operators: ReadonlyArray<Operator<T>> = [];

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
      this._operators = args.operators as Operator<T>[];
    } else {
      const operatorFns = args.operators as OperatorFnOutput<T>[];

      if (operatorFns.length === 1) {
        this._operators = [
          operatorFns[0]({ dateAdapter: this.dateAdapter, timezone: this.timezone }),
        ];
      } else if (operatorFns.length > 1) {
        this._operators = operatorFns.reduce(
          (prev, curr) => {
            const base = prev[prev.length - 1];

            prev.push(curr({ dateAdapter: this.dateAdapter, base, timezone: this.timezone }));

            return prev;
          },
          [] as Operator<T>[],
        );
      }
    }

    this.lastOperator = this._operators[this._operators.length - 1];
    this.isInfinite = (this.lastOperator && this.lastOperator.isInfinite) || false;
    this.hasDuration = (this.lastOperator && this.lastOperator.hasDuration) || false;
  }

  set(_: 'timezone', value: string | null): OccurrenceStream<T> {
    return new OccurrenceStream({
      operators: this._operators.map(operator => operator.set('timezone', value)),
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

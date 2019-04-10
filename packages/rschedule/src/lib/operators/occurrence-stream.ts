import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { DateInput, HasOccurrences, IRunArgs } from '../interfaces';
import { ArgumentError } from '../utilities';
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

export class OccurrenceStream<T extends typeof DateAdapter> extends HasOccurrences<T> {
  /**
   * Similar to `Array.isArray()`, `isOccurrenceStream()` provides a surefire method
   * of determining if an object is an `OccurrenceStream` by checking against the
   * global symbol registry.
   */
  static isOccurrenceStream(object: unknown): object is OccurrenceStream<any> {
    return !!(object && typeof object === 'object' && (object as any)[OCCURRENCE_STREAM_ID]);
  }

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;
  readonly timezone!: string | null;

  /** @private do not use */
  readonly _operators: Operator<T>[] = [];

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

  set(_: 'timezone', value: string | null) {
    return new OccurrenceStream({
      operators: this._operators.map(operator => operator.set('timezone', value)),
      dateAdapter: this.dateAdapter,
      timezone: value,
    });
  }

  /**
   * Checks to see if an occurrence exists which equals the given date.
   */
  occursOn(rawArgs: { date: DateInput<T> }): boolean;
  /**
   * Checks to see if an occurrence exists with a weekday === the `weekday` argument.
   * At the moment, the `before` argument is required.
   *
   * Arguments:
   *
   * - `after` and `before` arguments can be provided which limit the
   *   possible occurrences to ones *after or equal* or *before or equal* the given dates.
   *   - If `excludeEnds` is `true`, then the after/before arguments become exclusive rather
   *       than inclusive.
   */
  // tslint:disable-next-line: unified-signatures
  occursOn(rawArgs: {
    weekday: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean;

  occursOn(rawArgs: {
    date?: DateInput<T>;
    weekday?: IDateAdapter.Weekday;
    after?: DateInput<T>;
    before?: DateInput<T>;
    excludeEnds?: boolean;
  }): boolean {
    const args = this.processOccursOnArgs(rawArgs);

    if (args.weekday) {
      return this.occursOnWeekday(args);
    }

    for (const day of this._run({ start: args.date, end: args.date })) {
      return !!day;
    }

    return false;
  }

  private *emptyIterator(args?: IRunArgs | undefined): IterableIterator<DateTime> {
    return;
  }

  private occursOnWeekday(args: {
    weekday?: IDateAdapter.Weekday;
    after?: DateTime;
    before?: DateTime;
    excludeEnds?: boolean;
    excludeDates?: DateTime[];
  }) {
    const weekday = args.weekday!;

    if (!args.before) {
      throw new ArgumentError(
        'At the moment, ' +
          'OccurrenceStream#occursOn() with a `weekday` argument ' +
          'requires that the `before` argument be present.',
      );
    }

    let end: DateTime | null = this.lastDate && DateTime.fromJSON(this.lastDate.toJSON());
    let start: DateTime | null = this.firstDate && DateTime.fromJSON(this.firstDate.toJSON());

    if (!start) return false;

    const before = args.before && (args.excludeEnds ? args.before.subtract(1, 'day') : args.before);

    const after = args.after && (args.excludeEnds ? args.after.add(1, 'day') : args.after);

    if (end && before) {
      end = before.isBefore(end) ? before : end;
    } else if (!end && before) {
      end = before;
    }

    if (after) {
      start = after.isAfter(start) ? after : start;
    }

    if (end && (end.isBefore(start) || end.isBefore(start))) {
      return false;
    }

    if (!end) {
      end = start.add(11, 'year');
    }

    // This function allows for an "intelligent" brute forcing of occurrences.
    // For rules with a frequency less than a day, it only checks one
    // iteration on any given day.
    const bruteForceCheck = () => {
      let date = getNextDateNotInExdates(args.excludeDates, after, end!);

      if (date && date.get('weekday') === weekday) {
        return true;
      }

      while (date) {
        date = date.granularity('day').add(24, 'hour');

        date = getNextDateNotInExdates(args.excludeDates, date, end!);

        if (date && date.get('weekday') === weekday) {
          return true;
        }
      }

      return false;
    };

    const getNextDateNotInExdates = (
      exdates?: Array<DateTime>,
      start?: DateTime,
      end?: DateTime,
    ) => {
      let date = this._run({ start, end }).next().value;

      if (!exdates || exdates.length === 0) {
        return date;
      }

      while (date && exdates.some(exdate => exdate.isEqual(date))) {
        date = date.granularity('day').add(24, 'hour');

        date = this._run({ start: date, end }).next().value;
      }

      return date;
    };

    return bruteForceCheck();
  }
}

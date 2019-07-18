import { DateTime } from '../../date-time';
import { INormalizedRuleOptions } from '../rule-options';

export class PipeError extends Error {}

export interface IPipeRunFn {
  /**
   * The current date to be evaluated by the rule pipe.
   */
  date: DateTime;

  /**
   * This argument is added by a pipe to indicate that the current date
   * is invalid.
   */
  invalidDate?: boolean;

  /**
   * If present, contains the next potentially valid date
   * from the perspective of the Pipe which adds the `skipToDate`
   * argument. It serves as a way of skipping potentially large blocks of
   * dates that will be invalid.
   *
   * The date contained in `skipToDate` will either be in the future or
   * the past, depending on if `isIteratingInReverseOrder`. The `FrequencyPipe` will
   * either skip to the date in `skipToDate`, if the date is a valid one
   * given the rule's `frequency`, `interval`, and `start` options, or it will
   * skip to the first valid date after the `skipToDate` date.
   */
  skipToDate?: DateTime;
}

export interface IPipeRule<T> {
  nextPipe?: IPipeRule<unknown>;
  start: DateTime;
  end?: DateTime;
  options: T;

  run(args: IPipeRunFn): DateTime | null;
}

export abstract class PipeRuleBase<T> {
  nextPipe!: IPipeRule<unknown>;
  start: DateTime;
  end?: DateTime;
  options: T;

  constructor(args: { start: DateTime; end?: DateTime; options: T }) {
    this.start = args.start;
    this.end = args.end;
    this.options = args.options;
  }
}

export abstract class PipeRule<T> extends PipeRuleBase<T> {
  protected nextValidDate(args: IPipeRunFn, skipToDate: DateTime) {
    return this.nextPipe.run({
      date: args.date,
      invalidDate: true,
      skipToDate,
    });
  }
}

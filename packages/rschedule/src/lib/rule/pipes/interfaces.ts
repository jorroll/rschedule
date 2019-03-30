import { DateTime } from '../../date-time';
import { INormalizedRuleOptions } from '../rule-options';
// import { Utils } from '../../utilities';

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

export interface IPipeRule {
  nextPipe: IPipeRule | null;
  controller: IPipeController;

  run(args: IPipeRunFn): DateTime | null;
}

export interface IPipeController {
  start: DateTime;
  end?: DateTime;
  count?: number;
  reverse: boolean;
  options: INormalizedRuleOptions;

  firstPipe: IPipeRule;
}

export abstract class PipeRuleBase {
  nextPipe!: IPipeRule;

  constructor(public controller: IPipeController) {}

  get options() {
    return this.controller.options;
  }
  get start() {
    return this.controller.start;
  }
  get end() {
    return this.controller.end;
  }
  get count() {
    return this.controller.count;
  }
  get firstPipe() {
    return this.controller.firstPipe;
  }
}

export abstract class PipeRule extends PipeRuleBase {
  protected nextValidDate(args: IPipeRunFn, skipToDate: DateTime) {
    return this.nextPipe.run({
      date: args.date,
      invalidDate: true,
      skipToDate,
    });
  }
}

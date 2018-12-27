import { DateTime } from '../../date-time';
import { Utils } from '../../utilities';
import { PipeControllerOptions } from './pipe-controller';

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
  options: PipeControllerOptions;
  invalid: boolean;

  expandingPipes: IPipeRule[];
  focusedPipe: IPipeRule;
}

export abstract class PipeRuleBase {
  public nextPipe!: IPipeRule;

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
  get expandingPipes() {
    return this.controller.expandingPipes;
  }
  get focusedPipe() {
    return this.controller.focusedPipe;
  }
}

export abstract class PipeRule extends PipeRuleBase {
  protected cloneDateWithGranularity(
    date: DateTime,
    granularity: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
  ) {
    date = date.clone();

    switch (granularity) {
      case 'year':
        date.set('month', 1);
      case 'month':
        date.set('day', 1);
      case 'day':
        date.set('hour', 0);
      case 'hour':
        date.set('minute', 0);
      case 'minute':
        date.set('second', 0);
      case 'second':
        return date;
      default:
        throw new Error(
          'Woops! the PipeController somehow has invalid options...',
        );
    }
  }
}

export abstract class ReversePipeRule extends PipeRuleBase {
  protected cloneDateWithGranularity(
    date: DateTime,
    granularity: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
  ) {
    date = date.clone();

    switch (granularity) {
      case 'year':
        date.set('month', 12);
      case 'month':
        Utils.setDateToEndOfMonth(date);
      case 'day':
        date.set('hour', 23);
      case 'hour':
        date.set('minute', 59);
      case 'minute':
        date.set('second', 59);
      case 'second':
        return date;
      default:
        throw new Error(
          'Woops! the PipeController somehow has invalid options...',
        );
    }
  }
}

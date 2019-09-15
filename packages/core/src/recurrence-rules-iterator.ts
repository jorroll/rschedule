import { DateTime } from './DateAdapter';
import { INormRuleOptionsBase } from './recurrence-rule-options';

import {
  InvalidDateTime,
  IRecurrenceRule,
  IRecurrenceRulesIterator,
  RecurrenceRuleError,
  RecurrenceRuleResult,
  ValidDateTime,
} from './recurrence-rule';
import { cloneJSON } from './utilities';

export interface IRecurrenceRulesIteratorArgs {
  start?: DateTime;
  end?: DateTime;
  reverse?: boolean;
}

export class RecurrenceRulesIterator<T extends INormRuleOptionsBase>
  implements IRecurrenceRulesIterator<T>, IterableIterator<DateTime | undefined> {
  readonly start!: DateTime;
  readonly end?: DateTime;
  readonly reverse: boolean;
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  protected readonly rules: IRecurrenceRule[] = [];

  protected iterator =
    // prettier-ignore
    this.options.count === undefined ? this.iterate() :
    this.args.reverse ? this.iterateWithReverseCount() :
    this.iterateWithCount();

  constructor(
    recurrenceRules:
      | IRecurrenceRule[]
      | ((iterator: IRecurrenceRulesIterator<T>) => IRecurrenceRule[]),
    readonly options: T,
    protected readonly args: IRecurrenceRulesIteratorArgs,
  ) {
    this.options = { ...cloneJSON(options), start: options.start, end: options.end };
    this.reverse = (this.options.count === undefined && args.reverse) || false;

    if (options.count !== undefined) {
      this.start = options.start;
    } else if (args.start && options.start) {
      this.start = args.start.isAfterOrEqual(options.start) ? args.start : options.start;
    } else {
      this.start = args.start || options.start;
    }

    if (args.end && options.end) {
      this.end = args.end.isBeforeOrEqual(options.end) ? args.end : options.end;
    } else {
      this.end = args.end || options.end;
    }

    if (this.args.reverse && !(options.count !== undefined || this.end)) {
      throw new Error(
        'When iterating in reverse, the rule must have an `end` or `count` ' +
          'property or you must provide an `end` argument.',
      );
    }

    this.isInfinite = !this.end && this.options.count === undefined;
    this.hasDuration = !!this.options.duration;
    this.rules = Array.isArray(recurrenceRules) ? recurrenceRules : recurrenceRules(this);
  }

  [Symbol.iterator]() {
    return this.iterator;
  }

  next(args?: { skipToDate?: DateTime }) {
    return this.iterator.next(args);
  }

  /**
   * In the pipe controller, we have an extra level of indirection with
   * the `run()` and `iterate()` methods. The `iterate()` method is the
   * method which actually runs the logic in the pipes. If we didn't
   * need to account for the `count` property of a rule, we would *only*
   * need the iterate method... so much simpler. But we do need to account
   * for rules with a `count` property.
   *
   * Rules with a `count` property need to begin iteration at the beginning
   * because the `count` is always from the rule's start time. So if someone
   * passes in a new start time as an argument to a rule with `count`, we
   * need to secretly iterate from the beginning, tracking the number of
   * iterations, and then only start yielding dates when we reach the section
   * the user cares about (or, if we hit our `count` quota, cancel iterating).
   *
   * Additionally, we need to handle iterating in reverse. In this case, we build
   * up a cache of dates between the rule's start time and the reverse iteration
   * start date. Once we hit the reverse iteration start date, we start
   * yielding dates in the cache, in reverse order.
   *
   * In general, I imagine the count number, if used, will be small. But a large
   * count will definitely have a negative performance affect. I don't think
   * there's anything to be done about this.
   */

  private *iterateWithReverseCount() {
    const dates = Array.from(this.iterateWithCount()).reverse();

    let yieldArgs: { skipToDate?: DateTime } | undefined;
    let dateCache = dates.slice();
    let date = dateCache.shift();

    while (date) {
      if (yieldArgs) {
        if (yieldArgs.skipToDate && yieldArgs.skipToDate.isBefore(date)) {
          date = dateCache.shift();
          continue;
        }

        yieldArgs = undefined;
      }

      yieldArgs = yield date;

      if (yieldArgs && yieldArgs.skipToDate) {
        // need to reset the date cache to allow the same (or past)
        // date to be picked again.
        dateCache = dates.slice();
      }

      date = dateCache.shift();
    }

    return undefined;
  }

  private *iterateWithCount() {
    if (this.options.count === 0) return;

    const iterable = this.iterate();
    const start = this.args.start || this.start;

    let date: DateTime | void = iterable.next().value;
    let index = 1;

    while (date && index <= this.options.count!) {
      index++;

      if (date && date.isBefore(start)) {
        date = iterable.next().value;
        continue;
      }

      date = iterable.next(yield date).value;
    }

    return undefined;
  }

  private *iterate() {
    let startingDate = this.start;

    if (this.reverse) startingDate = this.end!;

    let date = this.nextDate(startingDate);

    while (date) {
      const args = yield this.normalizeRunOutput(date);

      if (args && args.skipToDate) {
        date = this.nextDate(args.skipToDate);
      } else {
        date = this.nextDate(
          this.reverse ? date.subtract(1, 'millisecond') : date.add(1, 'millisecond'),
        );
      }
    }

    return undefined;
  }

  /**
   * Loops through the recurrence rules until a valid date is found
   */
  private nextDate(start: DateTime): DateTime | null {
    let result = this.runRules(start);

    if (this.isDatePastEnd(result.date)) return null;

    let index = 0;

    while (result instanceof InvalidDateTime && index < 50) {
      result = this.runRules(result.date);

      if (this.isDatePastEnd(result.date)) return null;

      index++;
    }

    if (result instanceof InvalidDateTime) {
      throw new RecurrenceRuleError(
        `Failed to find a matching occurrence in ${index} iterations. ` +
          `Last iterated date: "${result.date.toISOString()}"`,
      );
    }

    if (this.reverse ? start.isBefore(result.date) : start.isAfter(result.date)) {
      throw new RecurrenceRuleError(
        'An error occurred in a recurrence rule. If this happened using ' +
          'the rSchedule provided recurrence rules, you should ' +
          'open an issue in the rSchedule repo. The maintainer is going to ' +
          'want to know how to recreate the error.',
      );
    }

    return result.date;
  }

  /**
   * Performs one run of the recurrence rules and returns the result.
   * It's a slightly optimized reducer function.
   */
  private runRules(start: DateTime) {
    let result = new ValidDateTime(start) as RecurrenceRuleResult;

    for (const rule of this.rules) {
      if (result instanceof InvalidDateTime) {
        return result;
      }

      result = rule.run(result.date);
    }

    return result;
  }

  private isDatePastEnd(date: DateTime) {
    return this.reverse ? date.isBefore(this.start) : this.end && date.isAfter(this.end);
  }

  private normalizeRunOutput(date: DateTime) {
    return this.hasDuration ? date.set('duration', this.options.duration!) : date;
  }
}

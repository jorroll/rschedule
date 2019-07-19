import { DateTime } from '../../date-time';
import { INormalizedRuleOptions } from '../rule-options';

import { ArgumentError, cloneJSON, Omit } from '../../basic-utilities';
import { IRunArgs } from '../../interfaces';
import { FrequencyPipe } from './01-frequency.pipe';
import { ByMonthOfYearPipe } from './02-by-month-of-year.pipe';
import { ByDayOfMonthPipe } from './05-by-day-of-month.pipe';
import { ByDayOfWeekPipe } from './06-by-day-of-week.pipe';
import { ByHourOfDayPipe } from './07-by-hour-of-day.pipe';
import { ByMinuteOfHourPipe } from './08-by-minute-of-hour.pipe';
import { BySecondOfMinutePipe } from './09-by-second-of-minute.pipe';
import { ByMillisecondOfSecondPipe } from './10-by-millisecond-of-second.pipe';
import { ResultPipe } from './11-result.pipe';
import { IPipeRule } from './interfaces';
import { RevFrequencyPipe } from './rev-01-frequency.pipe';
import { RevByMonthOfYearPipe } from './rev-02-by-month-of-year.pipe';
import { RevByDayOfMonthPipe } from './rev-05-by-day-of-month.pipe';
import { RevByDayOfWeekPipe } from './rev-06-by-day-of-week.pipe';
import { RevByHourOfDayPipe } from './rev-07-by-hour-of-day.pipe';
import { RevByMinuteOfHourPipe } from './rev-08-by-minute-of-hour.pipe';
import { RevBySecondOfMinutePipe } from './rev-09-by-second-of-minute.pipe';
import { RevByMillisecondOfSecondPipe } from './rev-10-by-millisecond-of-second.pipe';
import { RevResultPipe } from './rev-11-result.pipe';

export class PipeController {
  get firstPipe() {
    return this.pipes[0] as FrequencyPipe | RevFrequencyPipe;
  }

  readonly start!: DateTime;
  readonly end?: DateTime;
  readonly reverse: boolean;
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  private readonly reversePipes: boolean;
  private readonly pipes: IPipeRule<unknown>[] = [];

  constructor(
    readonly options: INormalizedRuleOptions,
    private readonly args: Omit<IRunArgs, 'take'>,
  ) {
    this.options = { ...cloneJSON(options), start: options.start, end: options.end };
    this.reverse = !!args.reverse;
    this.reversePipes = (this.options.count === undefined && args.reverse) || false;

    if (options.count !== undefined) {
      this.start = options.start;
    } else if (args.start && options.start) {
      this.start = args.start.isAfterOrEqual(options.start) ? args.start : options.start;
    } else if (args.start) {
      this.start = args.start;
    } else {
      this.start = options.start;
    }

    // It's possible that the start date gets returned to the user,
    // so clone it (generators prop is mutable).
    this.start = DateTime.fromJSON(this.start.toJSON());

    if (args.end && options.end) {
      this.end = args.end.isBeforeOrEqual(options.end) ? args.end : options.end;
    } else if (args.end) {
      this.end = args.end;
    } else if (options.end) {
      this.end = options.end;
    }

    // It's possible that the end date gets returned to the user,
    // so clone it (generators prop is mutable).
    this.end = this.end && DateTime.fromJSON(this.end.toJSON());

    if (this.reverse && !(options.count !== undefined || this.end)) {
      throw new ArgumentError(
        'When iterating in reverse, the rule must have an `end` or `count` ' +
          'property or you must provide an `end` argument.',
      );
    }

    this.isInfinite = !this.end && this.options.count === undefined;
    this.hasDuration = !!this.options.duration;

    this.initialize();
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
  get _run() {
    if (this.options.count !== undefined) {
      if (this.reverse) return this.iterateWithReverseCount;

      return this.iterateWithCount;
    }

    return this.iterate;
  }

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
  }

  private *iterateWithCount() {
    if (this.options.count === 0) return;

    const iterable = this.iterate();
    const start = this.args.start || this.start;

    let date: DateTime | undefined = iterable.next().value;
    let index = 1;
    let yieldArgs: { skipToDate?: DateTime } | undefined;

    while (date && index <= this.options.count!) {
      index++;

      if (date && date.isBefore(start)) {
        date = iterable.next().value;
        continue;
      }

      yieldArgs = yield date;
      date = iterable.next(yieldArgs).value;
    }
  }

  private *iterate() {
    let startingDate = this.start;

    if (this.reversePipes) startingDate = this.end!;

    let date = this.firstPipe.run({
      date: startingDate, // <- just present to satisfy interface
      skipToDate: startingDate,
    });

    while (date) {
      const args = yield this.normalizeRunOutput(date);

      if (args && args.skipToDate) {
        date = this.firstPipe.run({ date, skipToDate: args.skipToDate });
      } else if (args && args.reset) {
        // TODO: verify that args.reset isn't currently used and this `if` branch
        //       can be removed
        this.initialize();

        date = this.firstPipe.run({
          date: startingDate, // <- just present to satisfy interface
          skipToDate: startingDate,
        });
      } else {
        date = this.firstPipe.run({ date });
      }
    }
  }

  private initialize() {
    // Pipe ordering is defined in the ICAL spec
    // https://tools.ietf.org/html/rfc5545#section-3.3.10

    const pipeOptions = {
      start: this.options.start,
      // The ` || this.end` bit is for the RevFrequencyPipe
      // but I can't think of any reason why it can't be added here
      end: this.options.end || this.end,
      options: this.options,
    };

    if (this.reversePipes) {
      this.addPipe(new RevFrequencyPipe(pipeOptions));

      if (pipeOptions.options.byMonthOfYear !== undefined) {
        this.addPipe(new RevByMonthOfYearPipe(pipeOptions as any));
        pipeOptions.options.byMonthOfYear.reverse();
      }

      if (pipeOptions.options.byDayOfMonth !== undefined) {
        this.addPipe(new RevByDayOfMonthPipe(pipeOptions as any));
      }

      if (pipeOptions.options.byDayOfWeek !== undefined) {
        this.addPipe(new RevByDayOfWeekPipe(pipeOptions as any));
      }

      if (pipeOptions.options.byHourOfDay !== undefined) {
        this.addPipe(new RevByHourOfDayPipe(pipeOptions as any));
        pipeOptions.options.byHourOfDay.reverse();
      }

      if (pipeOptions.options.byMinuteOfHour !== undefined) {
        this.addPipe(new RevByMinuteOfHourPipe(pipeOptions as any));
        pipeOptions.options.byMinuteOfHour.reverse();
      }

      if (pipeOptions.options.bySecondOfMinute !== undefined) {
        this.addPipe(new RevBySecondOfMinutePipe(pipeOptions as any));
        pipeOptions.options.bySecondOfMinute.reverse();
      }

      if (pipeOptions.options.byMillisecondOfSecond !== undefined) {
        this.addPipe(new RevByMillisecondOfSecondPipe(pipeOptions as any));
        pipeOptions.options.byMillisecondOfSecond.reverse();
      }

      const revResultPipe = new RevResultPipe({
        start: this.start,
        end: this.end,
        options: this.options,
      });

      revResultPipe.firstPipe = this.firstPipe;

      this.addPipe(revResultPipe);

      return;
    }

    this.addPipe(new FrequencyPipe(pipeOptions));

    if (pipeOptions.options.byMonthOfYear !== undefined) {
      this.addPipe(new ByMonthOfYearPipe(pipeOptions as any));
    }

    if (pipeOptions.options.byDayOfMonth !== undefined) {
      this.addPipe(new ByDayOfMonthPipe(pipeOptions as any));
    }

    if (pipeOptions.options.byDayOfWeek !== undefined) {
      this.addPipe(new ByDayOfWeekPipe(pipeOptions as any));
    }

    if (pipeOptions.options.byHourOfDay !== undefined) {
      this.addPipe(new ByHourOfDayPipe(pipeOptions as any));
    }

    if (pipeOptions.options.byMinuteOfHour !== undefined) {
      this.addPipe(new ByMinuteOfHourPipe(pipeOptions as any));
    }

    if (pipeOptions.options.bySecondOfMinute !== undefined) {
      this.addPipe(new BySecondOfMinutePipe(pipeOptions as any));
    }

    if (pipeOptions.options.byMillisecondOfSecond !== undefined) {
      this.addPipe(new ByMillisecondOfSecondPipe(pipeOptions as any));
    }

    const resultPipe = new ResultPipe({
      start: this.start,
      end: this.end,
      options: this.options,
    });

    resultPipe.firstPipe = this.firstPipe;

    this.addPipe(resultPipe);
  }

  private addPipe(pipe: any) {
    const lastPipe = this.pipes[this.pipes.length - 1];

    this.pipes.push(pipe);

    if (lastPipe) {
      lastPipe.nextPipe = pipe;
    }
  }

  private normalizeRunOutput(date: DateTime) {
    return this.hasDuration ? date.set('duration', this.options.duration!) : date;
  }
}

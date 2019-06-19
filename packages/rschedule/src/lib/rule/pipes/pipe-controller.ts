import { DateTime } from '../../date-time';
import { INormalizedRuleOptions } from '../rule-options';

import { ArgumentError, Omit } from '../../basic-utilities';
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
import { IPipeController, IPipeRule } from './interfaces';
import { RevFrequencyPipe } from './rev-01-frequency.pipe';
import { RevByMonthOfYearPipe } from './rev-02-by-month-of-year.pipe';
import { RevByDayOfMonthPipe } from './rev-05-by-day-of-month.pipe';
import { RevByDayOfWeekPipe } from './rev-06-by-day-of-week.pipe';
import { RevByHourOfDayPipe } from './rev-07-by-hour-of-day.pipe';
import { RevByMinuteOfHourPipe } from './rev-08-by-minute-of-hour.pipe';
import { RevBySecondOfMinutePipe } from './rev-09-by-second-of-minute.pipe';
import { RevByMillisecondOfSecondPipe } from './rev-10-by-millisecond-of-second.pipe';
import { RevResultPipe } from './rev-11-result.pipe';

export class PipeController implements IPipeController {
  get firstPipe() {
    return this.pipes[0] as FrequencyPipe | RevFrequencyPipe;
  }

  readonly start!: DateTime;
  readonly end?: DateTime;
  readonly reverse: boolean;
  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  private readonly reversePipes: boolean;
  private readonly pipes: IPipeRule[] = [];

  constructor(
    readonly options: INormalizedRuleOptions,
    private readonly args: Omit<IRunArgs, 'take'>,
  ) {
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

    if (args.end && options.end) {
      this.end = args.end.isBeforeOrEqual(options.end) ? args.end : options.end;
    } else if (args.end) {
      this.end = args.end;
    } else if (options.end) {
      this.end = options.end;
    }

    if (this.reverse && !(options.count || this.end)) {
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
    const iterable = this.iterate();

    let date: DateTime | undefined = iterable.next().value;
    let args: { skipToDate?: DateTime } | undefined;
    let index = 1;

    const dates = [date];

    for (date of iterable) {
      if (index >= this.options.count!) break;

      dates.push(date);

      index++;
    }

    dates.reverse();

    let dateCache = dates.slice();

    date = dateCache.shift();

    while (date) {
      if (args) {
        if (args.skipToDate && args.skipToDate.isBefore(date)) {
          date = dateCache.shift();
          continue;
        }

        args = undefined;
      }

      args = yield date;

      if (args && args.skipToDate) {
        // need to reset the date cache to allow the same date to be picked again.
        // Also, I suppose it's possible someone might want to go back in time,
        // which this allows.
        dateCache = dates.slice();
      }

      date = dateCache.shift();
    }
  }

  private *iterateWithCount() {
    if (this.options.count === 0) return;

    const iterable = this.iterate();

    let date: DateTime | undefined = iterable.next().value;
    let index = 1;

    const start = this.args.start || this.start;

    while (date && date.isBefore(start) && index < this.options.count!) {
      date = iterable.next().value;
      index++;
    }

    if (date && date.isBefore(start)) {
      return;
    }

    let args: { skipToDate?: DateTime } | undefined;

    while (date && index <= this.options.count!) {
      args = yield date;

      date = iterable.next(args).value;

      index++;
    }
  }

  private *iterate() {
    let startingDate = this.start;

    if (this.reversePipes) startingDate = this.end!;
    else if (this.options.count) startingDate = this.options.start;

    let date = this.firstPipe.run({
      date: startingDate, // <- just present to satisfy interface
      skipToDate: startingDate,
    });

    while (date) {
      const args = yield this.normalizeRunOutput(date);

      if (args && args.skipToDate) {
        date = this.firstPipe.run({ date, skipToDate: args.skipToDate });
      } else if (args && args.reset) {
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

    if (this.reversePipes) {
      this.addPipe(new RevFrequencyPipe(this));

      if (this.options.byMonthOfYear !== undefined) {
        this.addPipe(new RevByMonthOfYearPipe(this));
        this.options.byMonthOfYear.reverse();
      }

      if (this.options.byDayOfMonth !== undefined) {
        this.addPipe(new RevByDayOfMonthPipe(this));
      }

      if (this.options.byDayOfWeek !== undefined) {
        this.addPipe(new RevByDayOfWeekPipe(this));
      }

      if (this.options.byHourOfDay !== undefined) {
        this.addPipe(new RevByHourOfDayPipe(this));
        this.options.byHourOfDay.reverse();
      }

      if (this.options.byMinuteOfHour !== undefined) {
        this.addPipe(new RevByMinuteOfHourPipe(this));
        this.options.byMinuteOfHour.reverse();
      }

      if (this.options.bySecondOfMinute !== undefined) {
        this.addPipe(new RevBySecondOfMinutePipe(this));
        this.options.bySecondOfMinute.reverse();
      }

      if (this.options.byMillisecondOfSecond !== undefined) {
        this.addPipe(new RevByMillisecondOfSecondPipe(this));
        this.options.byMillisecondOfSecond.reverse();
      }

      this.addPipe(new RevResultPipe(this));

      return;
    }

    this.addPipe(new FrequencyPipe(this));

    if (this.options.byMonthOfYear !== undefined) {
      this.addPipe(new ByMonthOfYearPipe(this));
    }

    if (this.options.byDayOfMonth !== undefined) {
      this.addPipe(new ByDayOfMonthPipe(this));
    }

    if (this.options.byDayOfWeek !== undefined) {
      this.addPipe(new ByDayOfWeekPipe(this));
    }

    if (this.options.byHourOfDay !== undefined) {
      this.addPipe(new ByHourOfDayPipe(this));
    }

    if (this.options.byMinuteOfHour !== undefined) {
      this.addPipe(new ByMinuteOfHourPipe(this));
    }

    if (this.options.bySecondOfMinute !== undefined) {
      this.addPipe(new BySecondOfMinutePipe(this));
    }

    if (this.options.byMillisecondOfSecond !== undefined) {
      this.addPipe(new ByMillisecondOfSecondPipe(this));
    }

    this.addPipe(new ResultPipe(this));
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

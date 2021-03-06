import { DateInput, IRuleOptions } from '@rschedule/core';

import { add } from './operators/AddOperator';
import { subtract } from './operators/SubtractOperator';
import { unique } from './operators/UniqueOperator';

import { OccurrenceGenerator } from './occurrence-generator';

import { Dates } from './dates';
import { Rule } from './rule';
import { ScheduleBase } from './schedule-base';

export interface IScheduleArgs<Data = any> {
  timezone?: string | null;
  data?: Data;
  rrules?: ReadonlyArray<IRuleOptions | Rule>;
  exrules?: ReadonlyArray<IRuleOptions | Rule>;
  rdates?: ReadonlyArray<DateInput> | Dates;
  exdates?: ReadonlyArray<DateInput> | Dates;
  maxDuration?: number;
}

export class Schedule<Data = any> extends ScheduleBase<Data> {
  readonly rrules: ReadonlyArray<Rule> = [];
  readonly exrules: ReadonlyArray<Rule> = [];
  readonly rdates!: Dates;
  readonly exdates!: Dates;

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  protected readonly occurrenceStream: OccurrenceGenerator;

  /**
   * Create a new Schedule object with the specified options.
   *
   * The order of precidence for rrules, rdates, exrules, and exdates is:
   *
   * 1. rrules are included
   * 2. exrules are excluded
   * 3. rdates are included
   * 4. exdates are excluded
   *
   * ### Options
   *
   * - **timezone**: The timezone that yielded occurrences should be *displayed* in.
   *   Note, this one affects the *displayed* timezone of yielded occurrences.
   *   For rules, occurrences are first found using the unmodified rule
   *   config (including whatever timezone the `start` datetime is defined
   *   in), and then converted to the timezone specified here before being
   *   yielded. By default, the timezone is *local* time (`null`). So if you don't
   *   want your rules to be displayed in local time, you must supply a
   *   timezone argument.
   * - **data**: arbitrary data you can associate with this Schedule. This
   *   is the only mutable property of `Schedule` objects.
   * - **maxDuration**: currently unused.
   * - **rrules**: rules specifying when occurrences happen. See the "Rule Config"
   *   section below.
   * - **rdates**: individual dates that should be _included_ in the schedule.
   * - **exdates**: individual dates that should be _excluded_ from the schedule.
   * - **exrules**: rules specifying when occurrences shouldn't happen. See the
   *   "Rule Config" section below.
   *
   * ### Rule Config
   *
   * - #### frequency
   *
   *   The frequency rule part identifies the type of recurrence rule. Valid values
   *   include `"SECONDLY"`, `"MINUTELY"`, `"HOURLY"`, `"DAILY"`, `"WEEKLY"`,
   *   `"MONTHLY"`, or `"YEARLY"`.
   *
   * - #### start
   *
   *   The start of the rule (not necessarily the first occurrence).
   *   Either a `DateAdapter` instance, date object, or `DateTime` object.
   *   The type of date object depends on the `DateAdapter` class used for this
   *   `Rule`.
   *
   * - #### end?
   *
   *   The end of the rule (not necessarily the last occurrence).
   *   Either a `DateAdapter` instance, date object, or `DateTime` object.
   *   The type of date object depends on the `DateAdapter` class used for this
   *   `Rule`.
   *
   * - #### duration?
   *
   *   A length of time expressed in milliseconds.
   *
   * - #### interval?
   *
   *   The interval rule part contains a positive integer representing at
   *   which intervals the recurrence rule repeats. The default value is
   *   `1`, meaning every second for a SECONDLY rule, every minute for a
   *   MINUTELY rule, every hour for an HOURLY rule, every day for a
   *   DAILY rule, every week for a WEEKLY rule, every month for a
   *   MONTHLY rule, and every year for a YEARLY rule. For example,
   *   within a DAILY rule, a value of `8` means every eight days.
   *
   * - #### count?
   *
   *   The count rule part defines the number of occurrences at which to
   *   range-bound the recurrence. `count` and `end` are both two different
   *   ways of specifying how a recurrence completes.
   *
   * - #### weekStart?
   *
   *   The weekStart rule part specifies the day on which the workweek starts.
   *   Valid values are `"MO"`, `"TU"`, `"WE"`, `"TH"`, `"FR"`, `"SA"`, and `"SU"`.
   *   This is significant when a WEEKLY rule has an interval greater than 1,
   *   and a `byDayOfWeek` rule part is specified. The
   *   default value is `"MO"`.
   *
   * - #### bySecondOfMinute?
   *
   *   The bySecondOfMinute rule part expects an array of seconds
   *   within a minute. Valid values are 0 to 60.
   *
   * - #### byMinuteOfHour?
   *
   *   The byMinuteOfHour rule part expects an array of minutes within an hour.
   *   Valid values are 0 to 59.
   *
   * - #### byHourOfDay?
   *
   *   The byHourOfDay rule part expects an array of hours of the day.
   *   Valid values are 0 to 23.
   *
   * - #### byDayOfWeek?
   *
   *   *note: the byDayOfWeek rule part is kinda complex. Blame the ICAL spec.*
   *
   *   The byDayOfWeek rule part expects an array. Each array entry can
   *   be a day of the week (`"SU"`, `"MO"` , `"TU"`, `"WE"`, `"TH"`,
   *   `"FR"`, `"SA"`). If the rule's `frequency` is either MONTHLY or YEARLY,
   *   Any entry can also be a tuple where the first value of the tuple is a
   *   day of the week and the second value is an positive/negative integer
   *   (e.g. `["SU", 1]`). In this case, the number indicates the nth occurrence of
   *   the specified day within the MONTHLY or YEARLY rule.
   *
   *   The behavior of byDayOfWeek changes depending on the `frequency`
   *   of the rule.
   *
   *   Within a MONTHLY rule, `["MO", 1]` represents the first Monday
   *   within the month, whereas `["MO", -1]` represents the last Monday
   *   of the month.
   *
   *   Within a YEARLY rule, the numeric value in a byDayOfWeek tuple entry
   *   corresponds to an offset within the month when the byMonthOfYear rule part is
   *   present, and corresponds to an offset within the year otherwise.
   *
   *   Regardless of rule `frequency`, if a byDayOfWeek entry is a string
   *   (rather than a tuple), it means "all of these days" within the specified
   *   frequency (e.g. within a MONTHLY rule, `"MO"` represents all Mondays within
   *   the month).
   *
   * - #### byDayOfMonth?
   *
   *   The byDayOfMonth rule part expects an array of days
   *   of the month. Valid values are 1 to 31 or -31 to -1.
   *
   *   For example, -10 represents the tenth to the last day of the month.
   *   The byDayOfMonth rule part *must not* be specified when the rule's
   *   `frequency` is set to WEEKLY.
   *
   * - #### byMonthOfYear?
   *
   *   The byMonthOfYear rule part expects an array of months
   *   of the year. Valid values are 1 to 12.
   *
   */
  constructor(options: IScheduleArgs<Data> = {}) {
    super(options);

    for (const prop of ['rrules', 'exrules'] as ['rrules', 'exrules']) {
      const arg = options[prop];

      if (arg) {
        this[prop] = arg.map(ruleArgs => {
          if (ruleArgs instanceof Rule) {
            return ruleArgs.set('timezone', this.timezone) as Rule;
          } else {
            return new Rule(ruleArgs, {
              timezone: this.timezone,
            });
          }
        });
      }
    }

    for (const prop of ['rdates', 'exdates'] as ['rdates', 'exdates']) {
      const arg = options[prop];

      if (arg) {
        this[prop] =
          arg instanceof Dates
            ? (arg.set('timezone', this.timezone) as Dates)
            : new Dates({
                dates: arg,
                timezone: this.timezone,
              });
      } else {
        this[prop] = new Dates({
          timezone: this.timezone,
        });
      }
    }

    this.hasDuration =
      this.rrules.every(rule => rule.hasDuration) &&
      this.exrules.every(rule => rule.hasDuration) &&
      this.rdates.hasDuration &&
      this.exdates.hasDuration;

    this.isInfinite = this.rrules.some(rule => rule.isInfinite);

    this.occurrenceStream = [
      add(...this.rrules),
      subtract(...this.exrules),
      add(this.rdates),
      subtract(this.exdates),
      unique(),
    ].reduce((prev, curr) => curr({ base: prev, timezone: this.timezone }), undefined as
      | OccurrenceGenerator
      | undefined) as OccurrenceGenerator;
  }

  add(prop: 'rrule' | 'exrule', value: Rule): Schedule<Data>;
  add(prop: 'rdate' | 'exdate', value: DateInput): Schedule<Data>;
  add(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: Rule | DateInput): Schedule<Data> {
    const rrules = this.rrules.slice();
    const exrules = this.exrules.slice();
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'rrule':
        rrules.push(value as Rule);
        break;
      case 'exrule':
        exrules.push(value as Rule);
        break;
      case 'rdate':
        rdates = this.rdates.add(value as DateInput) as Dates;
        break;
      case 'exdate':
        exdates = this.exdates.add(value as DateInput) as Dates;
        break;
    }

    return new Schedule({
      timezone: this.timezone,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  remove(prop: 'rrule' | 'exrule', value: Rule): Schedule<Data>;
  remove(prop: 'rdate' | 'exdate', value: DateInput): Schedule<Data>;
  remove(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: Rule | DateInput): Schedule<Data> {
    let rrules = this.rrules;
    let exrules = this.exrules;
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'rrule':
        rrules = rrules.filter(rule => rule !== value);
        break;
      case 'exrule':
        exrules = exrules.filter(rule => rule !== value);
        break;
      case 'rdate':
        rdates = this.rdates.remove(value as DateInput) as Dates;
        break;
      case 'exdate':
        exdates = this.exdates.remove(value as DateInput) as Dates;
        break;
    }

    return new Schedule({
      timezone: this.timezone,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  set(
    prop: 'timezone',
    value: string | null,
    options?: { keepLocalTime?: boolean },
  ): Schedule<Data>;
  set(prop: 'rrules' | 'exrules', value: Rule[]): Schedule<Data>;
  set(prop: 'rdates' | 'exdates', value: Dates): Schedule<Data>;
  set(
    prop: 'timezone' | 'rrules' | 'exrules' | 'rdates' | 'exdates',
    value: string | null | Rule[] | Dates,
    options: { keepLocalTime?: boolean } = {},
  ): Schedule<Data> {
    let timezone = this.timezone;
    let rrules = this.rrules;
    let exrules = this.exrules;
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'timezone':
        if (value === this.timezone && !options.keepLocalTime) return this;
        else if (options.keepLocalTime) {
          rrules = rrules.map(rule => rule.set('timezone', value as string | null, options));
          exrules = exrules.map(rule => rule.set('timezone', value as string | null, options));
          rdates = rdates.set('timezone', value as string | null, options) as Dates;
          exdates = exdates.set('timezone', value as string | null, options) as Dates;
        }

        timezone = value as string | null;
        break;
      case 'rrules':
        rrules = value as Rule[];
        break;
      case 'exrules':
        exrules = value as Rule[];
        break;
      case 'rdates':
        rdates = value as Dates;
        break;
      case 'exdates':
        exdates = value as Dates;
        break;
    }

    return new Schedule({
      timezone,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }
}

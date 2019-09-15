import { ArgumentError, DateAdapter, DateInput, DateTime } from '@rschedule/core';
import {
  add,
  Dates,
  OccurrenceGenerator,
  ScheduleBase,
  subtract,
  unique,
} from '@rschedule/core/generators';
import { IRRuleOptions } from '@rschedule/core/rules/ICAL_RULES';
import { parse, stringify } from 'ical.js';
import { IVEventRuleOptions, ParseICalError, parseJCal } from './parser';
import { RRule } from './rrule';
import {
  datesToJCalProps,
  dateToJCalDTEND,
  dateToJCalDTSTART,
  IJCalComponent,
  numberToJCalDURATION,
  ruleOptionsToJCalProp,
  SerializeICalError,
  wrapInVEVENT,
} from './serializer';

export interface IVEventArgs<D = any> {
  start: DateInput;
  duration?: number | DateInput;
  data?: D;
  rrules?: ReadonlyArray<IVEventRuleOptions | RRule>;
  exrules?: ReadonlyArray<IVEventRuleOptions | RRule>;
  rdates?: ReadonlyArray<DateInput> | Dates;
  exdates?: ReadonlyArray<DateInput> | Dates;
  maxDuration?: number;
}

export class VEvent<Data = any> extends ScheduleBase<Data> {
  static fromICal(iCal: string): VEvent<{ jCal: IJCalComponent }>[] {
    return parseICal(iCal).vEvents;
  }

  // For some reason, error is thrown if typed as `readonly Rule[]`
  readonly rrules: ReadonlyArray<RRule> = [];
  readonly exrules: ReadonlyArray<RRule> = [];
  readonly rdates!: Dates;
  readonly exdates!: Dates;

  readonly start: DateAdapter;
  readonly isInfinite: boolean;
  readonly duration?: number | DateAdapter;
  readonly maxDuration!: number;
  readonly hasDuration: boolean;
  readonly timezone: string | null;

  protected readonly occurrenceStream: OccurrenceGenerator;

  private readonly _start: DateTime;
  private readonly _duration?: number;

  /**
   * Create a new VEvent object with the specified options.
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
   * - **start**: the dtstart of this VEvent. Will also be equal to the first
   *   occurrence of the VEvent. If the provided start date has a timezone,
   *   the VEvent will be in that timezone.
   * - **duration**: a length of time expressed in milliseconds or the end
   *   datetime (dtend) of the first occurrence (which will be used to calculate
   *   the duration in milliseconds).
   * - **data**: arbitrary data you can associate with this VEvent. This
   *   is the only mutable property of `VEvent` objects. The data property is
   *   ignored when serializing to ICal.
   * - **dateAdapter**: the DateAdapter class that should be used for this VEvent.
   * - **rrules**: rules specifying when occurrences happen. See the "Rule Config"
   *   section below.
   * - **rdates**: individual dates that should be _included_ in the VEvent.
   * - **exdates**: individual dates that should be _excluded_ from the VEvent.
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
   * - #### end?
   *
   *   The end ("until" in ICal) of the rule (not necessarily the last occurrence).
   *   Either a `DateAdapter` instance, date object, or `DateTime` object.
   *   The type of date object depends on the `DateAdapter` class used for this
   *   `Rule`.
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
  constructor(options: IVEventArgs<Data>) {
    super(options);

    this.start = this.normalizeDateInputToAdapter(options.start);
    this._start = this.start.toDateTime();

    this.timezone = this.start.timezone;

    if (typeof options.duration === 'object') {
      this.duration = this.normalizeDateInputToAdapter(options.duration);

      if ((this.duration as DateAdapter).timezone !== this.start.timezone) {
        this.duration = (this.duration as DateAdapter).set('timezone', this.start.timezone);
      }

      this._duration =
        (this.duration as DateAdapter).toDateTime().valueOf() - this._start.valueOf();

      if (this._duration < 0) {
        throw new ArgumentError(
          `When providing an datetime argument to VEvent#duration, ` +
            `the datetime must be after the start time`,
        );
      }
    } else {
      this.duration = (options.duration as number | undefined) || 0;
      this._duration = this.duration;
    }

    if (this._duration && this._duration % DateAdapter.MILLISECONDS_IN_SECOND !== 0) {
      throw new ArgumentError(`A VEvent's duration cannot include fractions of a second`);
    }

    this.hasDuration = !!this._duration;

    if (this._duration) {
      this.maxDuration = this._duration;
    }

    for (const prop of ['rrules', 'exrules'] as const) {
      const arg = options[prop];

      if (arg) {
        this[prop] = arg.map(ruleArgs => {
          if (ruleArgs instanceof RRule) {
            if (!this.normalizeDateInput(ruleArgs.options.start).isEqual(this._start)) {
              throw new ArgumentError(
                `${prop}: When passing a "RRule" object to the "VEvent" constructor, ` +
                  'the rule `start` property must be equal to `VEvent#start`.',
              );
            }

            return ruleArgs.set('timezone', this.timezone).set('duration', this._duration);
          } else {
            return new RRule(this.standardizeRuleOptions(ruleArgs, options), {
              duration: this._duration,
              timezone: this.timezone,
            });
          }
        });
      }
    }

    for (const prop of ['rdates', 'exdates'] as const) {
      const arg = options[prop];

      if (arg) {
        this[prop] =
          arg instanceof Dates
            ? arg.set('timezone', this.timezone).set('duration', this._duration)
            : new Dates({
                dates: arg as ReadonlyArray<DateInput>,
                timezone: this.timezone,
                duration: this._duration,
              });
      } else {
        this[prop] = new Dates({ timezone: this.timezone });
      }
    }

    this.isInfinite = this.rrules.some(rule => rule.isInfinite);

    this.occurrenceStream = [
      add(...this.rrules),
      subtract(...this.exrules),
      add(
        new Dates({
          dates: [this.start],
          timezone: this.timezone,
        }),
      ),
      add(this.rdates),
      subtract(this.exdates),
      unique(),
    ].reduce((prev, curr) => curr({ base: prev, timezone: this.timezone }), undefined as
      | OccurrenceGenerator
      | undefined) as OccurrenceGenerator;
  }

  add(prop: 'rrule' | 'exrule', value: RRule): VEvent<Data>;
  add(prop: 'rdate' | 'exdate', value: DateInput): VEvent<Data>;
  add(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: RRule | DateInput) {
    const rrules = this.rrules.slice();
    const exrules = this.exrules.slice();
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'rrule':
        rrules.push(value as RRule);
        break;
      case 'exrule':
        exrules.push(value as RRule);
        break;
      case 'rdate':
        rdates = this.rdates.add(value as DateInput);
        break;
      case 'exdate':
        exdates = this.exdates.add(value as DateInput);
        break;
    }

    return new VEvent({
      start: this.start,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  remove(prop: 'rrule' | 'exrule', value: RRule): VEvent<Data>;
  remove(prop: 'rdate' | 'exdate', value: DateInput): VEvent<Data>;
  remove(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: RRule | DateInput) {
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

    return new VEvent({
      start: this.start,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  set(prop: 'timezone', value: string | null, options?: { keepLocalTime?: boolean }): VEvent<Data>;
  set(prop: 'start', value: DateInput): VEvent<Data>;
  set(prop: 'rrules' | 'exrules', value: RRule[]): VEvent<Data>;
  set(prop: 'rdates' | 'exdates', value: Dates): VEvent<Data>;
  set(
    prop: 'start' | 'timezone' | 'rrules' | 'exrules' | 'rdates' | 'exdates',
    value: DateInput | string | null | RRule[] | Dates,
    options: { keepLocalTime?: boolean } = {},
  ) {
    let start = this.start;
    let rrules = this.rrules;
    let exrules = this.exrules;
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'timezone': {
        if (value === this.timezone && !options.keepLocalTime) return this;
        else if (options.keepLocalTime) {
          const json = start.toJSON();
          json.timezone = value as string | null;
          start = this.dateAdapter.fromJSON(json);
        } else {
          start = start.set('timezone', value as string | null);
        }
        break;
      }
      case 'start': {
        const newStart = this.normalizeDateInputToAdapter(value as DateInput);

        if (start.timezone === newStart.timezone && start.valueOf() === newStart.valueOf()) {
          return this;
        }

        start = newStart;
        break;
      }
      case 'rrules':
        rrules = value as RRule[];
        break;
      case 'exrules':
        exrules = value as RRule[];
        break;
      case 'rdates':
        rdates = value as Dates;
        break;
      case 'exdates':
        exdates = value as Dates;
        break;
    }

    return new VEvent({
      start,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  toICal(): string {
    return serializeToICal(this);
  }

  protected normalizeRunOutput(date: DateTime) {
    if (this._duration) {
      return super.normalizeRunOutput(date).set('duration', this._duration);
    }

    return super.normalizeRunOutput(date);
  }

  protected standardizeRuleOptions(
    options: IVEventRuleOptions,
    args: {
      start: DateInput;
    },
  ): IRRuleOptions {
    return {
      ...options,
      start: args.start,
    };
  }
}

export function vEventToJCal(vevent: VEvent): IJCalComponent {
  return wrapInVEVENT(
    dateToJCalDTSTART(vevent.start.toDateTime()),
    // prettier-ignore
    ...(typeof vevent.duration === 'number' ? numberToJCalDURATION(vevent.duration)
      : vevent.duration ? dateToJCalDTEND(vevent.duration.toDateTime())
      : []),
    ...vevent.rrules.map(rule => ruleOptionsToJCalProp('RRULE', rule.options)),
    ...vevent.exrules.map(rule => ruleOptionsToJCalProp('EXRULE', rule.options)),
    ...datesToJCalProps('RDATE', vevent.rdates),
    ...datesToJCalProps('EXDATE', vevent.exdates),
  );
}

export function serializeToJCal(input: VEvent): IJCalComponent {
  if (!(input instanceof VEvent)) {
    throw new SerializeICalError(`Unsupported input type "${input}"`);
  }

  return vEventToJCal(input);
}

function serializeToICal(input: VEvent): string {
  const jCal = serializeToJCal(input);

  // ical.js makes new lines with `\r\n` instead of just `\n`
  // `\r` is a "Carriage Return" character. We'll remove it.
  return stringify((jCal as any) as any[]).replace(/\r/g, '');
}

interface IParsedICalString {
  vEvents: VEvent[];
  iCal: string;
  jCal: IJCalComponent[];
}

const LINE_REGEX = /^.*\n?/;

function parseICal(iCal: string): IParsedICalString {
  const match = iCal.trim().match(LINE_REGEX);

  if (match && match[0] && !(match[0].toUpperCase().split(':')[0] === 'BEGIN')) {
    iCal = `BEGIN:VEVENT\n${iCal}\nEND:VEVENT`;
  } else if (match && match[0] && !(match[0].toUpperCase().split(':')[1] !== 'VEVENT')) {
    throw new ParseICalError(
      `"parseICal()" currently only supports parsing VEVENT ical components.`,
    );
  }

  let jCal: IJCalComponent;

  try {
    jCal = parse(iCal);
  } catch (e) {
    throw new ParseICalError(e.message);
  }

  const parsedJCal = parseJCal(jCal);

  const parsedICal: IParsedICalString = {
    vEvents: [],
    iCal,
    jCal: parsedJCal.jCal,
  };

  parsedJCal.vEvents.forEach(vEventArgs => {
    parsedICal.vEvents.push(new VEvent(vEventArgs));
  });

  return parsedICal;
}

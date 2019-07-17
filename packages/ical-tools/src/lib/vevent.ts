import {
  add,
  ArgumentError,
  CollectionIterator,
  DateAdapter,
  DateInput,
  Dates,
  DateTime,
  ICollectionsArgs,
  IOccurrencesArgs,
  IProvidedRuleOptions,
  IRunArgs,
  IScheduleLike,
  MILLISECONDS_IN_SECOND,
  OccurrenceGenerator,
  OccurrenceIterator,
  OccurrenceStream,
  Omit,
  OperatorFnOutput,
  pipeFn,
  Rule,
  subtract,
  unique,
} from '@rschedule/rschedule';

const VEVENT_ID = Symbol.for('b1666600-db88-4d8e-9e40-05fdbc48d650');

export type IVEventRuleOptions<T extends typeof DateAdapter> = Omit<
  IProvidedRuleOptions<T>,
  'start' | 'duration'
>;

export class VEvent<T extends typeof DateAdapter, D = any> extends OccurrenceGenerator<T>
  implements IScheduleLike<T> {
  /**
   * Similar to `Array.isArray`, `isVEvent` provides a surefire method
   * of determining if an object is a `VEvent` by checking against the
   * global symbol registry.
   */
  static isVEvent(object: unknown): object is VEvent<any> {
    return !!(object && typeof object === 'object' && (object as any)[VEVENT_ID]);
  }

  // For some reason, error is thrown if typed as `readonly Rule<T>[]`
  readonly rrules: ReadonlyArray<Rule<T>> = [];
  readonly exrules: ReadonlyArray<Rule<T>> = [];
  readonly rdates: Dates<T>;
  readonly exdates: Dates<T>;

  pipe: (...operatorFns: OperatorFnOutput<T>[]) => OccurrenceStream<T> = pipeFn(this);

  /** Convenience property for holding arbitrary data */
  data!: D;

  readonly start: InstanceType<T>;
  readonly isInfinite: boolean;
  readonly duration?: number | InstanceType<T>;
  readonly hasDuration: boolean;
  readonly timezone: string | null;

  protected readonly [VEVENT_ID] = true;

  private readonly _start: DateTime;
  private readonly _duration?: number;
  private readonly occurrenceStream: OccurrenceStream<T>;

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
  constructor(options: {
    start: DateInput<T>;
    duration?: number | DateInput<T>;
    dateAdapter?: T;
    data?: D;
    rrules?: ReadonlyArray<IVEventRuleOptions<T> | Rule<T>>;
    exrules?: ReadonlyArray<IVEventRuleOptions<T> | Rule<T>>;
    rdates?: ReadonlyArray<DateInput<T>> | Dates<T>;
    exdates?: ReadonlyArray<DateInput<T>> | Dates<T>;
  }) {
    super(options);

    this.start = this.normalizeDateInputToAdapter(options.start);
    this._start = this.start.toDateTime();

    this.timezone = this.start.timezone;

    if (options.data) {
      this.data = options.data;
    }

    if (typeof options.duration === 'object') {
      this.duration = this.normalizeDateInputToAdapter(options.duration);

      if ((this.duration as InstanceType<T>).timezone !== this.start.timezone) {
        this.duration = (this.duration as InstanceType<T>).set(
          'timezone',
          this.start.timezone,
        ) as InstanceType<T>;
      }

      this._duration =
        (this.duration as InstanceType<T>).toDateTime().valueOf() - this._start.valueOf();

      if (this._duration < 0) {
        throw new ArgumentError(
          `When providing an datetime argument to VEvent#duration, ` +
            `the datetime must be after the start time`,
        );
      }
    } else if (options.duration && options.duration > 0) {
      this.duration = options.duration as number;
      this._duration = this.duration;
    }

    if (this._duration && this._duration % MILLISECONDS_IN_SECOND !== 0) {
      throw new ArgumentError(`A VEvent's duration cannot include fractions of a second`);
    }

    this.hasDuration = !!this._duration;

    if (options.rrules) {
      this.rrules = options.rrules.map(ruleArgs => {
        if (Rule.isRule(ruleArgs)) {
          if (!this.normalizeDateInput(ruleArgs.options.start).isEqual(this._start)) {
            throw new ArgumentError(
              'RRULE: When passing a `Rule` object to the `VEvent` constructor, ' +
                'the rule `start` property must be equal to `VEvent#start`.',
            );
          }

          return ruleArgs.set('timezone', this.timezone).set('duration', this._duration);
        } else {
          return new Rule(this.standardizeRuleOptions(ruleArgs as IVEventRuleOptions<T>, options), {
            dateAdapter: this.dateAdapter,
            timezone: this.timezone,
          });
        }
      });
    }

    if (options.exrules) {
      this.exrules = options.exrules.map(ruleArgs => {
        if (Rule.isRule(ruleArgs)) {
          if (!this.normalizeDateInput(ruleArgs.options.start).isEqual(this._start)) {
            throw new ArgumentError(
              'EXRULE: When passing a `Rule` object to the `VEvent` constructor, ' +
                'the rule `start` property must be equal to `VEvent#start`.',
            );
          }

          return ruleArgs.set('timezone', this.timezone).set('duration', this._duration);
        } else {
          return new Rule(this.standardizeRuleOptions(ruleArgs as IVEventRuleOptions<T>, options), {
            dateAdapter: this.dateAdapter,
            timezone: this.timezone,
          });
        }
      });
    }

    if (options.rdates) {
      this.rdates = Dates.isDates(options.rdates)
        ? options.rdates.set('timezone', this.timezone).set('duration', this._duration)
        : new Dates({
            dates: options.rdates as ReadonlyArray<DateInput<T>>,
            dateAdapter: this.dateAdapter,
            timezone: this.timezone,
            duration: this._duration,
          }).set('duration', this._duration);
    } else {
      this.rdates = new Dates({ dateAdapter: this.dateAdapter, timezone: this.timezone });
    }

    if (options.exdates) {
      this.exdates = Dates.isDates(options.exdates)
        ? options.exdates.set('timezone', this.timezone).set('duration', this._duration)
        : new Dates({
            dates: options.exdates as ReadonlyArray<DateInput<T>>,
            dateAdapter: this.dateAdapter,
            timezone: this.timezone,
            duration: this._duration,
          });
    } else {
      this.exdates = new Dates({ dateAdapter: this.dateAdapter, timezone: this.timezone });
    }

    this.isInfinite = this.rrules.some(rule => rule.isInfinite);

    this.occurrenceStream = new OccurrenceStream({
      operators: [
        add<T>(...this.rrules),
        subtract<T>(...this.exrules),
        add<T>(
          new Dates({
            dates: [this.start],
            timezone: this.timezone,
            dateAdapter: this.dateAdapter,
          }),
        ),
        add<T>(this.rdates),
        subtract<T>(this.exdates),
        unique<T>(),
      ],
      dateAdapter: this.dateAdapter,
      timezone: this.timezone,
    });
  }

  occurrences(args: IOccurrencesArgs<T> = {}): OccurrenceIterator<T, [this, Rule<T> | Dates<T>]> {
    return new OccurrenceIterator(this, this.normalizeOccurrencesArgs(args));
  }

  collections(args: ICollectionsArgs<T> = {}): CollectionIterator<T, [this, Rule<T> | Dates<T>]> {
    return new CollectionIterator(this, this.normalizeCollectionsArgs(args));
  }

  add(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): VEvent<T, D>;
  add(prop: 'rdate' | 'exdate', value: DateInput<T>): VEvent<T, D>;
  add(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: Rule<T, unknown> | DateInput<T>) {
    const rrules = this.rrules.slice();
    const exrules = this.exrules.slice();
    let rdates = this.rdates;
    let exdates = this.exdates;

    switch (prop) {
      case 'rrule':
        rrules.push(value as Rule<T>);
        break;
      case 'exrule':
        exrules.push(value as Rule<T>);
        break;
      case 'rdate':
        rdates = this.rdates.add(value as DateInput<T>);
        break;
      case 'exdate':
        exdates = this.exdates.add(value as DateInput<T>);
        break;
    }

    return new VEvent({
      start: this.start,
      dateAdapter: this.dateAdapter,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  remove(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): VEvent<T, D>;
  remove(prop: 'rdate' | 'exdate', value: DateInput<T>): VEvent<T, D>;
  remove(prop: 'rdate' | 'exdate' | 'rrule' | 'exrule', value: Rule<T, unknown> | DateInput<T>) {
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
        rdates = this.rdates.remove(value as DateInput<T>);
        break;
      case 'exdate':
        exdates = this.exdates.remove(value as DateInput<T>);
        break;
    }

    return new VEvent({
      start: this.start,
      dateAdapter: this.dateAdapter,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  set(prop: 'timezone', value: string | null, options?: { keepLocalTime?: boolean }): VEvent<T, D>;
  set(prop: 'start', value: DateInput<T>): VEvent<T, D>;
  set(prop: 'rrules' | 'exrules', value: Rule<T, unknown>[]): VEvent<T, D>;
  set(prop: 'rdates' | 'exdates', value: Dates<T, unknown>): VEvent<T, D>;
  set(
    prop: 'start' | 'timezone' | 'rrules' | 'exrules' | 'rdates' | 'exdates',
    value: DateInput<T> | string | null | Rule<T, unknown>[] | Dates<T, unknown>,
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
          start = this.dateAdapter.fromJSON(json) as InstanceType<T>;
        } else {
          start = start.set('timezone', value as string | null) as InstanceType<T>;
        }
        break;
      }
      case 'start': {
        const newStart = this.normalizeDateInputToAdapter(value);

        if (start.timezone === newStart.timezone && start.valueOf() === newStart.valueOf()) {
          return this;
        }

        start = newStart;
        break;
      }
      case 'rrules':
        rrules = value as Rule<T>[];
        break;
      case 'exrules':
        exrules = value as Rule<T>[];
        break;
      case 'rdates':
        rdates = value as Dates<T>;
        break;
      case 'exdates':
        exdates = value as Dates<T>;
        break;
    }

    return new VEvent({
      start,
      dateAdapter: this.dateAdapter,
      data: this.data,
      rrules,
      exrules,
      rdates,
      exdates,
    });
  }

  /**  @private use occurrences() instead */
  *_run(args: IRunArgs = {}): IterableIterator<DateTime> {
    const count = args.take;

    delete args.take;

    const iterator = this.occurrenceStream._run(args);

    let date = iterator.next().value;
    let index = 0;

    while (date && (count === undefined || count > index)) {
      date.generators.unshift(this);

      const yieldArgs = yield this.normalizeRunOutput(date);

      date = iterator.next(yieldArgs).value;

      index++;
    }
  }

  protected normalizeRunOutput(date: DateTime) {
    if (this._duration) {
      return super.normalizeRunOutput(date).set('duration', this._duration);
    }

    return super.normalizeRunOutput(date);
  }

  protected standardizeRuleOptions(
    options: IVEventRuleOptions<T>,
    args: {
      start: DateInput<T>;
    },
  ): IProvidedRuleOptions<T> {
    options = { ...options };
    return {
      ...options,
      ...pluckProperties(args, 'start'),
      duration: this._duration,
    };
  }
}

function pluckProperties<T extends { [key: string]: unknown }>(obj: T, ...props: string[]) {
  const newObj: T = {} as any;

  for (const prop in obj) {
    if (obj.hasOwnProperty(prop) && props.includes(prop)) {
      newObj[prop] = obj[prop];
    }
  }

  return newObj;
}

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
   * Option descriptions:
   *
   * #### Duration
   *
   * Accepts either the number of milliseconds of the
   * duration or the end datetime of the first occurrence
   * (which will be used to calculate the duration in milliseconds)
   *
   * #### Data
   *
   * The data property holds arbitrary data associated with the `VEvent`.
   * Unlike the other properties of a VEvent, the data property is mutable.
   *
   * When iterating through a VEvent, you can access a list of the
   * generator objects (i.e. Rules / Dates) which generated any yielded
   * date by accessing the `IDateAdapter#generators` property. In this way,
   * for a given, yielded date, you can access the objects which generated
   * the date as well as the arbitrary data associated with those objects.
   *
   * The data property is ignored when serializing to iCal.
   *
   */
  constructor(args: {
    start: DateInput<T>;
    duration?: number | DateInput<T>;
    dateAdapter?: T;
    data?: D;
    rrules?: ReadonlyArray<IVEventRuleOptions<T> | Rule<T>>;
    exrules?: ReadonlyArray<IVEventRuleOptions<T> | Rule<T>>;
    rdates?: ReadonlyArray<DateInput<T>> | Dates<T>;
    exdates?: ReadonlyArray<DateInput<T>> | Dates<T>;
  }) {
    super(args);

    this.start = this.normalizeDateInputToAdapter(args.start);
    this._start = this.start.toDateTime();

    this.timezone = this.start.timezone;

    if (args.data) {
      this.data = args.data;
    }

    if (typeof args.duration === 'object') {
      this.duration = this.normalizeDateInputToAdapter(args.duration);

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
    } else if (args.duration && args.duration > 0) {
      this.duration = args.duration as number;
      this._duration = this.duration;
    }

    if (this._duration && this._duration % MILLISECONDS_IN_SECOND !== 0) {
      throw new ArgumentError(`A VEvent's duration cannot include fractions of a second`);
    }

    this.hasDuration = !!this._duration;

    if (args.rrules) {
      this.rrules = args.rrules.map(ruleArgs => {
        if (Rule.isRule(ruleArgs)) {
          if (!this.normalizeDateInput(ruleArgs.options.start).isEqual(this._start)) {
            throw new ArgumentError(
              'RRULE: When passing a `Rule` object to the `VEvent` constructor, ' +
                'the rule `start` property must be equal to `VEvent#start`.',
            );
          }

          return ruleArgs.set('timezone', this.timezone).set('duration', this._duration);
        } else {
          return new Rule(this.standardizeRuleOptions(ruleArgs as IVEventRuleOptions<T>, args), {
            dateAdapter: this.dateAdapter,
            timezone: this.timezone,
          });
        }
      });
    }

    if (args.exrules) {
      this.exrules = args.exrules.map(ruleArgs => {
        if (Rule.isRule(ruleArgs)) {
          if (!this.normalizeDateInput(ruleArgs.options.start).isEqual(this._start)) {
            throw new ArgumentError(
              'EXRULE: When passing a `Rule` object to the `VEvent` constructor, ' +
                'the rule `start` property must be equal to `VEvent#start`.',
            );
          }

          return ruleArgs.set('timezone', this.timezone).set('duration', this._duration);
        } else {
          return new Rule(this.standardizeRuleOptions(ruleArgs as IVEventRuleOptions<T>, args), {
            dateAdapter: this.dateAdapter,
            timezone: this.timezone,
          });
        }
      });
    }

    if (args.rdates) {
      this.rdates = Dates.isDates(args.rdates)
        ? args.rdates.set('timezone', this.timezone).set('duration', this._duration)
        : new Dates({
            dates: args.rdates as ReadonlyArray<DateInput<T>>,
            dateAdapter: this.dateAdapter,
            timezone: this.timezone,
            duration: this._duration,
          }).set('duration', this._duration);
    } else {
      this.rdates = new Dates({ dateAdapter: this.dateAdapter, timezone: this.timezone });
    }

    if (args.exdates) {
      this.exdates = Dates.isDates(args.exdates)
        ? args.exdates.set('timezone', this.timezone).set('duration', this._duration)
        : new Dates({
            dates: args.exdates as ReadonlyArray<DateInput<T>>,
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

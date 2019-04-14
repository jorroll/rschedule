import {
  add,
  ArgumentError,
  ConstructorReturnType,
  DateAdapter,
  DateInput,
  Dates,
  DateTime,
  IProvidedRuleOptions,
  IRunArgs,
  OccurrenceGenerator,
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
  Omit<IProvidedRuleOptions<T>, 'start'>,
  'duration'
>;

export class VEvent<T extends typeof DateAdapter, D = any> extends OccurrenceGenerator<T> {
  /**
   * Similar to `Array.isArray`, `isVEvent` provides a surefire method
   * of determining if an object is a `VEvent` by checking against the
   * global symbol registry.
   */
  static isVEvent(object: any): object is VEvent<any> {
    return !!(object && typeof object === 'object' && (object as any)[VEVENT_ID]);
  }

  // For some reason, error is thrown if typed as `readonly Rule<T>[]`
  readonly rrule: Rule<T> | null = null;
  readonly exrule: Rule<T> | null = null;
  readonly rdates: Dates<T> | null = null;
  readonly exdates: Dates<T> | null = null;

  pipe: (...operatorFns: OperatorFnOutput<T>[]) => OccurrenceStream<T> = pipeFn(this);

  /** Convenience property for holding arbitrary data */
  data!: D;

  readonly start: ConstructorReturnType<T>;
  readonly isInfinite: boolean;
  readonly duration?: number;
  readonly hasDuration: boolean;
  readonly timezone: string | null;

  protected readonly [VEVENT_ID] = true;

  private readonly _start: DateTime;
  private readonly occurrenceStream: OccurrenceStream<T>;

  constructor(args: {
    start: DateInput<T>;
    dateAdapter?: T;
    data?: D;
    rrule?: IVEventRuleOptions<T>;
    exrule?: IVEventRuleOptions<T>;
    rdates?: ReadonlyArray<DateInput<T>>;
    exdates?: ReadonlyArray<DateInput<T>>;
  }) {
    super(args);

    this._start = this.normalizeStartInput(args.start);
    this.start = this.dateAdapter.fromDateTime(this._start) as ConstructorReturnType<T>;

    this.timezone = this.start.timezone;

    if (args.data) {
      this.data = args.data;
    }

    if (args.rrule) {
      this.rrule = new Rule(standardizeVEventRuleOptions(args.rrule, args), {
        dateAdapter: this.dateAdapter as any,
        timezone: this.timezone,
      });
    }

    if (args.exrule) {
      this.exrule = new Rule(standardizeVEventRuleOptions(args.exrule, args), {
        dateAdapter: this.dateAdapter as any,
        timezone: this.timezone,
      });
    }

    if (args.rdates) {
      this.rdates = new Dates({
        dates: args.rdates as ReadonlyArray<DateInput<T>>,
        dateAdapter: this.dateAdapter as any,
        timezone: this.timezone,
      });
    }

    if (args.exdates) {
      this.exdates = new Dates({
        dates: args.exdates as ReadonlyArray<DateInput<T>>,
        dateAdapter: this.dateAdapter as any,
        timezone: this.timezone,
      });
    }

    // this.duration = args.duration;
    this.hasDuration = !!this.duration;

    this.isInfinite = !!(this.rrule && this.rrule.isInfinite);

    this.occurrenceStream = new OccurrenceStream({
      operators: [
        ...(this.rrule ? [add<T>(this.rrule)] : []),
        ...(this.exrule ? [subtract<T>(this.exrule)] : []),
        add<T>(
          new Dates({
            dates: [this.start],
            timezone: this.timezone,
            dateAdapter: this.dateAdapter,
          }),
        ),
        ...(this.rdates ? [add<T>(this.rdates)] : []),
        ...(this.exdates ? [subtract<T>(this.exdates)] : []),
        unique<T>(),
      ],
      dateAdapter: this.dateAdapter,
      timezone: this.timezone,
    });
  }

  set(prop: 'timezone', value: string | null): VEvent<T, D>;
  set(prop: 'timezone', value: string | null) {
    let timezone = this.timezone;

    switch (prop) {
      case 'timezone':
        if (value === this.timezone) return this;
        timezone = value as string | null;
        break;
    }

    return new VEvent({
      start: this.start,
      dateAdapter: this.dateAdapter,
      data: this.data,
      ...(this.rrule ? { rrule: this.rrule.options } : {}),
      ...(this.exrule ? { exrule: this.exrule.options } : {}),
      ...(this.rdates ? { rdates: this.rdates.adapters } : {}),
      ...(this.exdates ? { exdates: this.exdates.adapters } : {}),
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
      date.generators.push(this);

      const yieldArgs = yield this.normalizeRunOutput(date);

      date = iterator.next(yieldArgs).value;

      index++;
    }
  }

  protected normalizeStartInput(date: DateInput<T>) {
    if (DateTime.isInstance(date)) {
      return date;
    } else if (DateAdapter.isInstance(date)) {
      return date.toDateTime();
    } else if (DateAdapter.isDate(date)) {
      return new DateAdapter(date).toDateTime();
    } else {
      throw new ArgumentError('Invalid `start` argument for `new VEvent()`: ' + `"${date}"`);
    }
  }

  protected normalizeRunOutput(date: DateTime) {
    if (this.duration) {
      return super.normalizeRunOutput(date).set('duration', this.duration);
    }

    return super.normalizeRunOutput(date);
  }
}

function standardizeVEventRuleOptions<T extends typeof DateAdapter>(
  options: IVEventRuleOptions<T>,
  args: {
    start: DateInput<T>;
    duration?: number;
  },
): IProvidedRuleOptions<T> {
  options = { ...options };
  delete (options as any).duration;
  return {
    ...options,
    ...pluckProperties(args, 'start', 'duration'),
  };
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

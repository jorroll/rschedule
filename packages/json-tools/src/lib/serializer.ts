import {
  AddOperator,
  Calendar,
  DateAdapter,
  Dates,
  IDateAdapter,
  IntersectionOperator,
  IProvidedRuleOptions,
  OccurrenceStream,
  Operator,
  Rule,
  RuleOption,
  Schedule,
  SubtractOperator,
  UniqueOperator,
} from '@rschedule/rschedule';

export class SerializeJSONError extends Error {}

export type RScheduleObject<T extends typeof DateAdapter> =
  | Calendar<T, any>
  | Schedule<T>
  | Dates<T>
  | Rule<T>
  | OccurrenceStream<T>;

export type RScheduleObjectJSON =
  | IScheduleJSON
  | IRuleJSON
  | IDatesJSON
  | ICalendarJSON
  | IOccurrenceStreamJSON;

export interface IRuleOptionsJSON {
  start: IDateAdapter.JSON;
  end?: IDateAdapter.JSON;
  duration?: RuleOption.Duration;
  frequency: RuleOption.Frequency;
  interval?: RuleOption.Interval;
  count?: RuleOption.Count;
  weekStart?: RuleOption.WeekStart;
  bySecondOfMinute?: RuleOption.BySecondOfMinute[];
  byMinuteOfHour?: RuleOption.ByMinuteOfHour[];
  byHourOfDay?: RuleOption.ByHourOfDay[];
  byDayOfWeek?: RuleOption.ByDayOfWeek[];
  byDayOfMonth?: RuleOption.ByDayOfMonth[];
  byMonthOfYear?: RuleOption.ByMonthOfYear[];
}

export interface IRuleJSON {
  type: 'Rule';
  timezone?: string | null;
  options: IRuleOptionsJSON;
  data?: unknown;
}

export interface IDatesJSON {
  type: 'Dates';
  timezone?: string | null;
  dates: IDateAdapter.JSON[];
  data?: unknown;
}

export interface IScheduleJSON {
  type: 'Schedule';
  timezone?: string | null;
  rrules: IRuleJSON[];
  exrules: IRuleJSON[];
  rdates: IDatesJSON;
  exdates: IDatesJSON;
  data?: unknown;
}

export interface ICalendarJSON {
  type: 'Calendar';
  timezone?: string | null;
  schedules: (RScheduleObjectJSON)[];
  data?: unknown;
}

export interface IOccurrenceStreamJSON {
  type: 'OccurrenceStream';
  timezone?: string | null;
  operators: IOperatorJSON[];
}

export type IOperatorJSON =
  | IAddOperatorJSON
  | ISubtractOperatorJSON
  | IIntersectionOperatorJSON
  | IUniqueOperatorJSON;

export interface IAddOperatorJSON {
  type: 'AddOperator';
  streams: RScheduleObjectJSON[];
}

export interface ISubtractOperatorJSON {
  type: 'SubtractOperator';
  streams: RScheduleObjectJSON[];
}

export interface IIntersectionOperatorJSON {
  type: 'IntersectionOperator';
  streams: RScheduleObjectJSON[];
  maxFailedIterations?: number;
}

export interface IUniqueOperatorJSON {
  type: 'UniqueOperator';
}

export interface ISerializeToJSONOptions<T extends typeof DateAdapter> {
  serializeData?: boolean | ((input: Extract<RScheduleObject<T>, { data?: any }>) => unknown);
  isNested?: boolean;
}

export function serializeToJSON<T extends typeof DateAdapter>(
  inputs: RScheduleObject<T>,
  options?: ISerializeToJSONOptions<T>,
): RScheduleObjectJSON;
export function serializeToJSON<T extends typeof DateAdapter>(
  inputs: RScheduleObject<T>[],
  options?: ISerializeToJSONOptions<T>,
): RScheduleObjectJSON[];
export function serializeToJSON<T extends typeof DateAdapter>(
  inputs: RScheduleObject<T> | RScheduleObject<T>[],
  options: ISerializeToJSONOptions<T> = {},
): RScheduleObjectJSON | RScheduleObjectJSON[] {
  const arrayProvided = Array.isArray(inputs);

  if (!Array.isArray(inputs)) {
    inputs = [inputs];
  }

  const serializeData = !!options.serializeData;
  const serializationOptions = { ...options, isNested: true };

  const result = inputs.map(input => {
    let json: RScheduleObjectJSON;

    if (Schedule.isSchedule(input)) {
      json = {
        type: 'Schedule',
        rrules: input.rrules.map(rule =>
          serializeToJSON(rule, serializationOptions),
        ) as IRuleJSON[],
        exrules: input.exrules.map(rule =>
          serializeToJSON(rule, serializationOptions),
        ) as IRuleJSON[],
        rdates: serializeToJSON(input.rdates, serializationOptions) as IDatesJSON,
        exdates: serializeToJSON(input.exdates, serializationOptions) as IDatesJSON,
      };
    } else if (Dates.isDates(input)) {
      json = {
        type: 'Dates',
        dates: input.adapters.map(adapter => adapter.toJSON()),
      };
    } else if (Rule.isRule(input)) {
      json = {
        type: 'Rule',
        options: serializeOptionsToJSON(input.options, input.dateAdapter),
      };
    } else if (OccurrenceStream.isOccurrenceStream(input)) {
      json = {
        type: 'OccurrenceStream',
        operators: input.operators.map(operator =>
          serializeOperatorToJSON(operator, serializationOptions),
        ),
      };
    } else if (Calendar.isCalendar(input)) {
      json = {
        type: 'Calendar',
        schedules: input.schedules.map(schedule =>
          serializeToJSON(schedule as RScheduleObject<T>, serializationOptions),
        ),
      };
    } else {
      throw new SerializeJSONError(`Unsupported input type "${input}"`);
    }

    if (!options.isNested) {
      json.timezone = input.timezone;
    }

    if (serializeData && (input as any).data !== undefined) {
      (json as Extract<RScheduleObjectJSON, { data?: unknown }>).data =
        typeof options.serializeData === 'function'
          ? options.serializeData(input as Extract<RScheduleObject<T>, { data?: unknown }>)
          : (input as Extract<RScheduleObject<T>, { data?: unknown }>).data;
    }

    return json;
  });

  if (!arrayProvided) {
    return result[0] as RScheduleObjectJSON;
  }

  return result as RScheduleObjectJSON[];
}

function serializeOptionsToJSON<T extends typeof DateAdapter>(
  input: IProvidedRuleOptions<T>,
  dateAdapterConstructor: T,
): IRuleOptionsJSON {
  const result = {
    ...input,
    start: serializeDateToJSON(input.start, dateAdapterConstructor),
    end: input.end && serializeDateToJSON(input.end!, dateAdapterConstructor),
  };

  if (!result.end) {
    delete result.end;
  }

  return result;
}

function serializeDateToJSON<T extends typeof DateAdapter>(
  input: DateAdapter | T['date'],
  dateAdapterConstructor: T,
): IDateAdapter.JSON {
  if (DateAdapter.isInstance(input)) {
    return input.toJSON();
  } else if (dateAdapterConstructor.isDate(input)) {
    return new dateAdapterConstructor(input).toJSON();
  } else {
    throw new SerializeJSONError(
      'date must be either a `DateAdapter` instance ' +
        'or an instance of the date class a DateAdapter is wrapping',
    );
  }
}

function serializeOperatorToJSON<T extends typeof DateAdapter>(
  input: Operator<T>,
  options: {
    serializeData?: boolean | ((input: Extract<RScheduleObject<T>, { data?: any }>) => unknown);
  },
): IOperatorJSON {
  const serializationOptions = { ...options, isNested: true };

  if (AddOperator.isAddOperator(input)) {
    return {
      type: 'AddOperator',
      streams: (input as AddOperator<T>)._streams.map(stream =>
        serializeToJSON(stream as RScheduleObject<T>, serializationOptions),
      ),
    };
  } else if (SubtractOperator.isSubtractOperator(input)) {
    return {
      type: 'SubtractOperator',
      streams: (input as SubtractOperator<T>)._streams.map(stream =>
        serializeToJSON(stream as RScheduleObject<T>, serializationOptions),
      ),
    };
  } else if (IntersectionOperator.isIntersectionOperator(input)) {
    return {
      type: 'IntersectionOperator',
      streams: (input as IntersectionOperator<T>)._streams.map(stream =>
        serializeToJSON(stream as RScheduleObject<T>, serializationOptions),
      ),
      maxFailedIterations: (input as IntersectionOperator<T>).maxFailedIterations,
    };
  } else if (UniqueOperator.isUniqueOperator(input)) {
    return {
      type: 'UniqueOperator',
    };
  } else {
    throw new SerializeJSONError(`Unknown operator object: ${JSON.stringify(input)}`);
  }
}

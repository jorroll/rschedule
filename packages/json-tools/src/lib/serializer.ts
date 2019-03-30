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
  options: IRuleOptionsJSON;
}

export interface IDatesJSON {
  type: 'Dates';
  timezone?: string | undefined;
  dates: IDateAdapter.JSON[];
}

export interface IScheduleJSON {
  type: 'Schedule';
  timezone?: string | undefined;
  rrules: IRuleJSON[];
  exrules: IRuleJSON[];
  rdates: IDatesJSON;
  exdates: IDatesJSON;
}

export interface ICalendarJSON {
  type: 'Calendar';
  timezone?: string | undefined;
  schedules: (RScheduleObjectJSON)[];
}

export type IOperatorJSON =
  | IAddOperatorJSON
  | ISubtractOperatorJSON
  | IIntersectionOperator
  | IUniqueOperator;

export interface IOccurrenceStreamJSON {
  type: 'OccurrenceStream';
  timezone?: string | undefined;
  operators: IOperatorJSON[];
}

export interface IAddOperatorJSON {
  type: 'AddOperator';
  streams: RScheduleObjectJSON[];
}

export interface ISubtractOperatorJSON {
  type: 'SubtractOperator';
  streams: RScheduleObjectJSON[];
}

export interface IIntersectionOperator {
  type: 'IntersectionOperator';
  streams: RScheduleObjectJSON[];
}

export interface IUniqueOperator {
  type: 'UniqueOperator';
}

export function serializeToJSON<T extends typeof DateAdapter>(
  inputs: RScheduleObject<T>,
): RScheduleObjectJSON;
export function serializeToJSON<T extends typeof DateAdapter>(
  ...inputs: RScheduleObject<T>[]
): RScheduleObjectJSON[];
export function serializeToJSON<T extends typeof DateAdapter>(
  ...inputs: RScheduleObject<T>[]
): RScheduleObjectJSON | RScheduleObjectJSON[] {
  return _serializeToJSON(true, ...inputs);
}

function _serializeToJSON<T extends typeof DateAdapter>(
  withTimezone: boolean,
  input: RScheduleObject<T>,
): RScheduleObjectJSON;
function _serializeToJSON<T extends typeof DateAdapter>(
  withTimezone: boolean,
  ...input: RScheduleObject<T>[]
): RScheduleObjectJSON[];
function _serializeToJSON<T extends typeof DateAdapter>(
  withTimezone: boolean,
  ...input: RScheduleObject<T>[]
): RScheduleObjectJSON | RScheduleObjectJSON[] {
  const result = input.map(input => {
    if (Schedule.isSchedule(input)) {
      const json: IScheduleJSON = {
        type: 'Schedule',
        rrules: input.rrules.map(rule => _serializeToJSON(false, rule)) as IRuleJSON[],
        exrules: input.exrules.map(rule => _serializeToJSON(false, rule)) as IRuleJSON[],
        rdates: _serializeToJSON(false, input.rdates) as IDatesJSON,
        exdates: _serializeToJSON(false, input.exdates) as IDatesJSON,
      };

      if (withTimezone) {
        json.timezone = input.timezone;
      }

      return json;
    } else if (Dates.isDates(input)) {
      const json: IDatesJSON = {
        type: 'Dates',
        dates: input.adapters.map(adapter => adapter.toJSON()),
      };

      if (withTimezone) {
        json.timezone = input.timezone;
      }

      return json;
    } else if (Rule.isRule(input)) {
      const json: IRuleJSON = {
        type: 'Rule',
        options: serializeOptionsToJSON(input.options, input.dateAdapter),
      };

      return json;
    } else if (OccurrenceStream.isOccurrenceStream(input)) {
      const json: IOccurrenceStreamJSON = {
        type: 'OccurrenceStream',
        operators: input._operators.map(operator => serializeOperatorToJSON(operator)),
      };

      if (withTimezone) {
        json.timezone = input.timezone;
      }

      return json;
    } else if (Calendar.isCalendar(input)) {
      const json: ICalendarJSON = {
        type: 'Calendar',
        schedules: input.schedules.map(schedule =>
          _serializeToJSON(false, schedule as RScheduleObject<T>),
        ),
      };

      if (withTimezone) {
        json.timezone = input.timezone;
      }

      return json;
    } else {
      throw new SerializeJSONError(`Unsupported input type "${input}"`);
    }
  });

  if (result.length < 2) {
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
  input: DateAdapter | T['date'] | IDateAdapter.JSON,
  dateAdapterConstructor: T,
): IDateAdapter.JSON {
  if (DateAdapter.isInstance(input)) {
    return input.toJSON();
  } else if (dateAdapterConstructor.isDate(input)) {
    return new dateAdapterConstructor(input).toJSON();
  } else {
    return input as IDateAdapter.JSON;
  }
}

function serializeOperatorToJSON<T extends typeof DateAdapter>(input: Operator<T>): IOperatorJSON {
  if (AddOperator.isAddOperator(input)) {
    return {
      type: 'AddOperator',
      streams: (input as AddOperator<T>)._streams.map(stream =>
        serializeToJSON(stream as RScheduleObject<T>),
      ),
    };
  } else if (SubtractOperator.isSubtractOperator(input)) {
    return {
      type: 'SubtractOperator',
      streams: (input as SubtractOperator<T>)._streams.map(stream =>
        serializeToJSON(stream as RScheduleObject<T>),
      ),
    };
  } else if (IntersectionOperator.isIntersectionOperator(input)) {
    return {
      type: 'IntersectionOperator',
      streams: (input as IntersectionOperator<T>)._streams.map(stream =>
        serializeToJSON(stream as RScheduleObject<T>),
      ),
    };
  } else if (UniqueOperator.isUniqueOperator(input)) {
    return {
      type: 'UniqueOperator',
    };
  } else {
    throw new SerializeJSONError(`Unknown operator object: ${JSON.stringify(input)}`);
  }
}

import {
  add,
  ArgumentError,
  Calendar,
  DateAdapter,
  Dates,
  intersection,
  IProvidedRuleOptions,
  mergeDuration,
  OccurrenceStream,
  OperatorFnOutput,
  RScheduleConfig,
  Rule,
  Schedule,
  subtract,
  unique,
} from '@rschedule/rschedule';

import {
  ICalendarJSON,
  IDatesJSON,
  IOccurrenceStreamJSON,
  IOperatorJSON,
  IRuleJSON,
  IScheduleJSON,
  RScheduleObject,
  RScheduleObjectJSON,
  SerializeJSONError,
} from './serializer';

export class ParseJSONError extends Error {}

export interface IParseJSONOptions<T extends typeof DateAdapter> {
  dateAdapter?: T;
  parseData?: (data?: unknown) => unknown;
}

export function parseJSON<
  I extends RScheduleObjectJSON | RScheduleObjectJSON[],
  T extends typeof DateAdapter
>(
  input: I,
  options: IParseJSONOptions<T> = {},
): I extends Array<infer O>
  ? (O extends IRuleJSON
      ? Rule<T>[]
      : O extends IDatesJSON
      ? Dates<T>[]
      : O extends IScheduleJSON
      ? Schedule<T>[]
      : O extends ICalendarJSON
      ? Calendar<T>[]
      : O extends IOccurrenceStreamJSON
      ? OccurrenceStream<T>[]
      : RScheduleObject<T>[])
  : (I extends IRuleJSON
      ? Rule<T>
      : I extends IDatesJSON
      ? Dates<T>
      : I extends IScheduleJSON
      ? Schedule<T>
      : I extends ICalendarJSON
      ? Calendar<T>
      : I extends IOccurrenceStreamJSON
      ? OccurrenceStream<T>
      : RScheduleObject<T>) {
  const dateAdapter = options.dateAdapter || (RScheduleConfig.defaultDateAdapter as T);

  if (!dateAdapter) {
    throw new ArgumentError(
      'No `dateAdapter` option provided to `parseJSON()`. Additionally, ' +
        '`RScheduleConfig.defaultDateAdapter` not set.',
    );
  }

  const inputs: I[] = Array.isArray(input) ? input : [input];

  let result: Array<RScheduleObject<T>>;

  try {
    result = inputs.map(input => {
      const json = input as RScheduleObjectJSON;

      switch (json.type) {
        case 'Schedule':
          return new Schedule({
            ...json,
            rrules: json.rrules.map(rule =>
              parseJSON({ ...rule, timezone: json.timezone }, options),
            ),
            exrules: json.exrules.map(rule =>
              parseJSON({ ...rule, timezone: json.timezone }, options),
            ),
            rdates: json.rdates.dates.map(date => dateAdapter.fromJSON(date)),
            exdates: json.exdates.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter,
            data: options.parseData ? options.parseData(json.data) : json.data,
          });
        case 'Rule':
          const ruleOptions: IProvidedRuleOptions<T> = {
            ...json.options,
            start: dateAdapter.fromJSON(json.options.start),
          };

          if (json.options.end) ruleOptions.end = dateAdapter.fromJSON(json.options.end);

          if (!ruleOptions.weekStart && RScheduleConfig.Rule.defaultWeekStart) {
            // Need to explicitly set weekStart otherwise the defaultWeekStart will kick in
            // and potentially create a different schedule.
            ruleOptions.weekStart = 'MO';
          }

          return new Rule(ruleOptions, {
            dateAdapter,
            timezone: json.timezone,
            data: options.parseData ? options.parseData(json.data) : json.data,
          });
        case 'Dates':
          return new Dates({
            ...json,
            dates: json.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter,
            data: options.parseData ? options.parseData(json.data) : json.data,
          });
        case 'OccurrenceStream':
          return new OccurrenceStream({
            ...json,
            operators: json.operators.map(operator => parseOperatorJSON(operator, options)),
            dateAdapter,
          });
        case 'Calendar':
          return new Calendar({
            ...json,
            schedules: json.schedules.map(schedule => parseJSON(schedule, options)),
            dateAdapter,
            data: options.parseData ? options.parseData(json.data) : json.data,
          });
        default:
          throw new ParseJSONError(`Unknown input type "${(json as any).type}"`);
      }
    });
  } catch (e) {
    throw new ParseJSONError(e);
  }

  if (result.length < 2) {
    return result[0] as any;
  }

  return result as any;
}

function parseOperatorJSON<T extends typeof DateAdapter>(
  json: IOperatorJSON,
  options: {
    dateAdapter?: T;
    parseData?: (data?: unknown) => unknown;
  },
): OperatorFnOutput<T> {
  switch (json.type) {
    case 'AddOperator':
      return add(...json.streams.map(stream => parseJSON(stream, options)));
    case 'SubtractOperator':
      return subtract(...json.streams.map(stream => parseJSON(stream, options)));
    case 'IntersectionOperator':
      return intersection({
        maxFailedIterations: json.maxFailedIterations,
        streams: json.streams.map(stream => parseJSON(stream, options)),
      });
    case 'UniqueOperator':
      return unique();
    case 'MergeDurationOperator':
      return mergeDuration({
        maxDuration: json.maxDuration,
      });
    default:
      throw new SerializeJSONError(`Unknown operator type: "${(json as any).type}"`);
  }
}

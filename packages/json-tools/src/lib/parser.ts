import {
  add,
  ArgumentError,
  Calendar,
  DateAdapter,
  Dates,
  intersection,
  IProvidedRuleOptions,
  OccurrenceStream,
  OperatorFnOutput,
  RScheduleConfig,
  Rule,
  Schedule,
  subtract,
  unique,
} from '@rschedule/rschedule';

import {
  IOperatorJSON,
  RScheduleObject,
  RScheduleObjectJSON,
  SerializeJSONError,
} from './serializer';

export class ParseJSONError extends Error {}

export function parseJSON<T extends typeof DateAdapter>(
  input: RScheduleObjectJSON,
  options?: {
    dateAdapter?: T;
  },
): RScheduleObject<T>;
export function parseJSON<T extends typeof DateAdapter>(
  input: RScheduleObjectJSON[],
  options?: {
    dateAdapter?: T;
  },
): RScheduleObject<T>[];
export function parseJSON<T extends typeof DateAdapter>(
  input: RScheduleObjectJSON | RScheduleObjectJSON[],
  options: {
    dateAdapter?: T;
  } = {},
): RScheduleObject<T> | RScheduleObject<T>[] {
  const dateAdapter = options.dateAdapter || (RScheduleConfig.defaultDateAdapter as T);

  if (!dateAdapter) {
    throw new ArgumentError(
      'No `dateAdapter` option provided to `parseJSON()`. Additionally, ' +
        '`RScheduleConfig.defaultDateAdapter` not set.',
    );
  }

  const inputs = Array.isArray(input) ? input : [input];

  let result: Array<RScheduleObject<T>>;

  try {
    result = inputs.map(json => {
      switch (json.type) {
        case 'Schedule':
          return new Schedule({
            ...json,
            rrules: json.rrules.map(
              rule => parseJSON({ ...rule, timezone: json.timezone }, { dateAdapter }) as Rule<T>,
            ),
            exrules: json.exrules.map(
              rule => parseJSON({ ...rule, timezone: json.timezone }, { dateAdapter }) as Rule<T>,
            ),
            rdates: json.rdates.dates.map(date => dateAdapter.fromJSON(date)),
            exdates: json.exdates.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter,
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
          });
        case 'Dates':
          return new Dates({
            ...json,
            dates: json.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter,
          });
        case 'OccurrenceStream':
          return new OccurrenceStream({
            ...json,
            operators: json.operators.map(operator => parseOperatorJSON(operator, dateAdapter)),
            dateAdapter,
          });
        case 'Calendar':
          return new Calendar({
            ...json,
            schedules: json.schedules.map(schedule => parseJSON(schedule, { dateAdapter })),
            dateAdapter,
          });
        default:
          throw new ParseJSONError(`Unknown input type "${(json as any).type}"`);
      }
    });
  } catch (e) {
    throw new ParseJSONError(e);
  }

  if (result.length < 2) {
    return result[0] as RScheduleObject<T>;
  }

  return result as RScheduleObject<T>[];
}

function parseOperatorJSON<T extends typeof DateAdapter>(
  json: IOperatorJSON,
  dateAdapter: T,
): OperatorFnOutput<T> {
  switch (json.type) {
    case 'AddOperator':
      return add(...json.streams.map(stream => parseJSON(stream, { dateAdapter })));
    case 'SubtractOperator':
      return subtract(...json.streams.map(stream => parseJSON(stream, { dateAdapter })));
    case 'IntersectionOperator':
      return intersection({
        maxFailedIterations: json.maxFailedIterations,
        streams: json.streams.map(stream => parseJSON(stream, { dateAdapter })),
      });
    case 'UniqueOperator':
      return unique();
    default:
      throw new SerializeJSONError(`Unknown operator type: "${(json as any).type}"`);
  }
}

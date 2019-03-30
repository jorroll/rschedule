import {
  add,
  AddOperator,
  Calendar,
  DateAdapter,
  Dates,
  intersection,
  OccurrenceStream,
  OperatorFnOutput,
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
  dateAdapterConstructor: T,
  options?: {
    maxFailedIterations?: number;
  },
): RScheduleObject<T>;
export function parseJSON<T extends typeof DateAdapter>(
  input: RScheduleObjectJSON[],
  dateAdapterConstructor: T,
  options?: {
    maxFailedIterations?: number;
  },
): RScheduleObject<T>[];
export function parseJSON<T extends typeof DateAdapter>(
  input: RScheduleObjectJSON | RScheduleObjectJSON[],
  dateAdapter: T,
  options: {
    maxFailedIterations?: number;
  } = {},
): RScheduleObject<T> | RScheduleObject<T>[] {
  const inputs = Array.isArray(input) ? input : [input];

  let result: Array<RScheduleObject<T>>;

  try {
    result = inputs.map(json => {
      switch (json.type) {
        case 'Schedule':
          return new Schedule({
            ...json,
            rrules: json.rrules.map(rule => rule.options),
            exrules: json.exrules.map(rule => rule.options),
            rdates: json.rdates.dates.map(date => dateAdapter.fromJSON(date)),
            exdates: json.exdates.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter,
          });
        case 'Rule':
          return new Rule(json.options, {
            dateAdapter,
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
            operators: json.operators.map(operator =>
              parseOperatorJSON(operator, dateAdapter, json.timezone, options),
            ),
            dateAdapter,
          });
        case 'Calendar':
          return new Calendar({
            ...json,
            schedules: json.schedules.map(schedule => parseJSON(schedule, dateAdapter, options)),
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
  timezone: string | undefined,
  options: {
    maxFailedIterations?: number;
  } = {},
): OperatorFnOutput<T> {
  switch (json.type) {
    case 'AddOperator':
      return add(...json.streams.map(stream => parseJSON(stream, dateAdapter, options)));
    case 'SubtractOperator':
      return subtract(...json.streams.map(stream => parseJSON(stream, dateAdapter, options)));
    case 'IntersectionOperator':
      return intersection({
        maxFailedIterations: options.maxFailedIterations,
        streams: json.streams.map(stream => parseJSON(stream, dateAdapter, options)),
      });
    case 'UniqueOperator':
      return unique();
    default:
      throw new SerializeJSONError(`Unknown operator type: "${(json as any).type}"`);
  }
}

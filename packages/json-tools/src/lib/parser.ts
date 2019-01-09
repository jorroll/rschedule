import {
  DateAdapterConstructor,
  Dates,
  EXDates,
  EXRule,
  IDateAdapterConstructor,
  RDates,
  RRule,
  Schedule,
} from '@rschedule/rschedule';

export class ParseJSONError extends Error {}

import { RScheduleObject, RScheduleObjectJSON } from './serializer';

export function parseJSON<T extends DateAdapterConstructor>(
  input: RScheduleObjectJSON,
  dateAdapterConstructor: T,
): RScheduleObject<T>;
export function parseJSON<T extends DateAdapterConstructor>(
  input: RScheduleObjectJSON[],
  dateAdapterConstructor: T,
): Array<RScheduleObject<T>>;
export function parseJSON<T extends DateAdapterConstructor>(
  input: RScheduleObjectJSON | RScheduleObjectJSON[],
  dateAdapterConstructor: T,
): RScheduleObject<T> | Array<RScheduleObject<T>> {
  const dateAdapter: IDateAdapterConstructor<T> = dateAdapterConstructor as any;
  const inputs = Array.isArray(input) ? input : [input];

  let result: Array<RScheduleObject<T>>;

  try {
    result = inputs.map(json => {
      switch (json.type) {
        case 'Schedule':
          return new Schedule({
            rrules: json.rrules.map(rule => rule.options),
            exrules: json.exrules.map(rule => rule.options),
            rdates: json.rdates.dates.map(date => dateAdapter.fromJSON(date)),
            exdates: json.exdates.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter: dateAdapterConstructor,
          });
        case 'RRule':
          return new RRule(json.options, {
            dateAdapter: dateAdapterConstructor,
          });
        case 'EXRule':
          return new EXRule(json.options, {
            dateAdapter: dateAdapterConstructor,
          });
        case 'RDates':
          return new RDates({
            dates: json.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter: dateAdapterConstructor,
          });
        case 'EXDates':
          return new EXDates({
            dates: json.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter: dateAdapterConstructor,
          });
        case 'Dates':
          return new Dates({
            dates: json.dates.map(date => dateAdapter.fromJSON(date)),
            dateAdapter: dateAdapterConstructor,
          });
        default:
          throw new ParseJSONError(
            `Unknown input type "${(json as any).type}"`,
          );
      }
    });
  } catch (e) {
    throw new ParseJSONError(e);
  }

  if (result.length < 2) {
    return result[0] as RScheduleObject<T>;
  }

  return result as Array<RScheduleObject<T>>;
}

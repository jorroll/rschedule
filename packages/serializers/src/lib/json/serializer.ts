import {
  Calendar,
  DateAdapter,
  DateAdapterBase,
  DateAdapterConstructor,
  DateProp,
  Dates,
  EXDates,
  EXRule,
  IDateAdapter,
  IDateAdapterConstructor,
  IDateAdapterJSON,
  Options,
  RDates,
  RRule,
  Rule,
  Schedule,
  Utils,
} from '@rschedule/rschedule';
import { SerializeError } from '../shared';

export interface IOptionsJSON {
  start: IDateAdapterJSON;
  frequency: Options.Frequency;
  interval?: number;
  bySecondOfMinute?: Options.BySecondOfMinute[];
  byMinuteOfHour?: Options.ByMinuteOfHour[];
  byHourOfDay?: Options.ByHourOfDay[];
  byDayOfWeek?: Options.ByDayOfWeek[];
  byDayOfMonth?: Options.ByDayOfMonth[];
  byMonthOfYear?: Options.ByMonthOfYear[];
  until?: IDateAdapterJSON;
  count?: number;
  weekStart?: IDateAdapter.Weekday;
}

export interface IRRuleJSON {
  type: 'RRule';
  options: IOptionsJSON;
}

export interface IEXRuleJSON {
  type: 'EXRule';
  options: IOptionsJSON;
}

export interface IRDatesJSON {
  type: 'RDates';
  dates: IDateAdapterJSON[];
}

export interface IEXDatesJSON {
  type: 'EXDates';
  dates: IDateAdapterJSON[];
}

export interface IDatesJSON {
  type: 'Dates';
  dates: IDateAdapterJSON[];
}

export interface IScheduleJSON {
  type: 'Schedule';
  rrules: IRRuleJSON[];
  exrules: IRRuleJSON[];
  rdates: IRDatesJSON;
  exdates: IEXDatesJSON;
}

export type RScheduleObject<T extends DateAdapterConstructor> =
  | Calendar<T, any>
  | Schedule<T>
  | RDates<T>
  | EXDates<T>
  | RRule<T>
  | EXRule<T>
  | Dates<T>;

export type RScheduleObjectJSON =
  | IScheduleJSON
  | IRDatesJSON
  | IEXDatesJSON
  | IRRuleJSON
  | IEXRuleJSON
  | IDatesJSON;

export function serializeToJSON<T extends DateAdapterConstructor>(
  inputs: RScheduleObject<T>,
): RScheduleObjectJSON;
export function serializeToJSON<T extends DateAdapterConstructor>(
  ...inputs: Array<RScheduleObject<T>>
): RScheduleObjectJSON[];
export function serializeToJSON<T extends DateAdapterConstructor>(
  ...inputs: Array<RScheduleObject<T>>
): RScheduleObjectJSON | RScheduleObjectJSON[] {
  const result = inputs.map(input => {
    if (Schedule.isSchedule(input)) {
      return {
        type: 'Schedule',
        rrules: input.rrules.map(rule => serializeToJSON(rule)),
        exrules: input.exrules.map(rule => serializeToJSON(rule)),
        rdates: serializeToJSON(input.rdates),
        exdates: serializeToJSON(input.exdates),
      };
    } else if (Dates.isDates(input)) {
      // prettier-ignore
      const type =
        RDates.isRDates(input) ? 'RDates' :
        EXDates.isEXDates(input) ? 'EXDates' :
        'Dates';

      return {
        type,
        dates: input.adapters.map(adapter => adapter.toJSON()),
      };
    } else if (Rule.isRule(input)) {
      const type = RRule.isRRule(input) ? 'RRule' : 'EXRule';

      return {
        type,
        options: serializeOptionsToJSON(
          input.options,
          (input as any)['dateAdapter'],
        ),
      };
    } else {
      throw new SerializeError(`Unknown input type "${input}"`);
    }
  });

  if (result.length < 2) {
    return result[0] as RScheduleObjectJSON;
  }

  return result as RScheduleObjectJSON[];
}

function serializeOptionsToJSON<T extends DateAdapterConstructor>(
  input: Options.ProvidedOptions<T>,
  dateAdapterConstructor: T,
): IOptionsJSON {
  const result = {
    ...Utils.clone(input),
    start: serializeDateToJSON(input.start, dateAdapterConstructor),
    until:
      input.until && serializeDateToJSON(input.until!, dateAdapterConstructor),
  };

  if (!result.until) {
    delete result.until;
  }

  return result;
}

function serializeDateToJSON<T extends DateAdapterConstructor>(
  input: DateAdapter<T> | DateProp<T> | IDateAdapterJSON,
  dateAdapterConstructor: T,
): IDateAdapterJSON {
  const dateAdapter: IDateAdapterConstructor<T> = dateAdapterConstructor as any;

  if (DateAdapterBase.isInstance(input)) {
    return input.toJSON();
  } else if (dateAdapter.isDate(input)) {
    return new dateAdapter(input).toJSON();
  } else {
    return input;
  }
}

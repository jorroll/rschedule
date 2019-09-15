import { Dates, OccurrenceGenerator, Rule, Schedule } from '@rschedule/core/generators';

import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
  serializeDataToJSON,
} from '@rschedule/json-tools';

import '@rschedule/json-tools/Dates';
import '@rschedule/json-tools/Rule';

declare module '@rschedule/core/generators' {
  namespace Schedule {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'Schedule';
      timezone?: string | null;
      rrules: Rule.JSON[];
      exrules: Rule.JSON[];
      rdates: Dates.JSON;
      exdates: Dates.JSON;
      data?: unknown;
    }
  }

  class Schedule<Data = any> extends OccurrenceGenerator {
    static fromJSON<D = any>(
      json: Schedule.JSON,
      options?: { timezone?: string | null; data?: (json: OccurrenceGenerator.JSON) => any },
    ): Schedule<D>;

    toJSON(opts?: ISerializeToJSONOptions): Schedule.JSON;
  }
}

Schedule.prototype.toJSON = function serialize(opts: ISerializeToJSONOptions = {}): Schedule.JSON {
  const json: Schedule.JSON = {
    type: 'Schedule',
    rrules: this.rrules.map(rule => rule.toJSON({ ...opts, nested: true })),
    exrules: this.exrules.map(rule => rule.toJSON({ ...opts, nested: true })),
    rdates: this.rdates.toJSON({ ...opts, nested: true }),
    exdates: this.exdates.toJSON({ ...opts, nested: true }),
  };

  if (!opts.nested) json.timezone = this.timezone;
  serializeDataToJSON(this, json, opts);

  return json;
};

Schedule.fromJSON = function parse(
  json: Schedule.JSON,
  options: { timezone?: string | null; data?: (json: OccurrenceGenerator.JSON) => any } = {},
): Schedule {
  if (json.type !== 'Schedule') {
    throw new ParseJSONError('Invalid Schedule JSON');
  }

  return new Schedule({
    rrules: json.rrules.map(rule => Rule.fromJSON(rule, { timezone: json.timezone, ...options })),
    exrules: json.exrules.map(rule => Rule.fromJSON(rule, { timezone: json.timezone, ...options })),
    rdates: Dates.fromJSON(json.rdates, { timezone: json.timezone, ...options }),
    exdates: Dates.fromJSON(json.exdates, { timezone: json.timezone, ...options }),
    data: typeof options.data === 'function' ? options.data(json) : json.data,
    timezone: options.timezone || json.timezone,
  });
};

registerJSONSerializerFn('Schedule', Schedule.fromJSON);

import { Calendar, OccurrenceGenerator } from '@rschedule/core/generators';

import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
  serializeDataToJSON,
} from '@rschedule/json-tools';

declare module '@rschedule/core/generators' {
  namespace Calendar {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'Calendar';
      timezone?: string | null;
      schedules: OccurrenceGenerator.JSON[];
      data?: any;
    }
  }

  class Calendar<Data = any> extends OccurrenceGenerator {
    static fromJSON<D = any>(
      json: Calendar.JSON,
      options?: { timezone?: string | null; data?: (json: OccurrenceGenerator.JSON) => any },
    ): Calendar<D>;

    toJSON(opts?: ISerializeToJSONOptions): Calendar.JSON;
  }
}

Calendar.fromJSON = function parse(
  json: Calendar.JSON,
  options: { timezone?: string | null; data?: (json: OccurrenceGenerator.JSON) => any } = {},
): Calendar<any> {
  if (json.type !== 'Calendar') {
    throw new ParseJSONError('Invalid Calendar JSON');
  }

  return new Calendar<any>({
    schedules: json.schedules.map(sched =>
      OccurrenceGenerator.fromJSON(sched, { timezone: json.timezone, ...options }),
    ),
    data: typeof options.data === 'function' ? options.data(json) : json.data,
    timezone: options.timezone || json.timezone,
  });
};

Calendar.prototype.toJSON = function serialize(opts: ISerializeToJSONOptions = {}): Calendar.JSON {
  const json: Calendar.JSON = {
    type: 'Calendar',
    schedules: this.schedules.map(schedule => schedule.toJSON({ ...opts, nested: true })),
  };

  if (!opts.nested) json.timezone = this.timezone;
  serializeDataToJSON(this, json, opts);

  return json;
};

registerJSONSerializerFn('Calendar', Calendar.fromJSON);

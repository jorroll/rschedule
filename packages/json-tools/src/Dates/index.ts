import { DateAdapter, DateAdapterBase } from '@rschedule/core';
import { Dates, OccurrenceGenerator } from '@rschedule/core/generators';
import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
  serializeDataToJSON,
} from '@rschedule/json-tools';

declare module '@rschedule/core/generators' {
  namespace Dates {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'Dates';
      timezone?: string | null;
      dates: DateAdapter.JSON[];
      data?: unknown;
    }
  }

  class Dates<Data = any> extends OccurrenceGenerator {
    static fromJSON<D = any>(
      json: Dates.JSON,
      options?: { timezone?: string | null; data?: (json: OccurrenceGenerator.JSON) => any },
    ): Dates<D>;
    toJSON(opts?: ISerializeToJSONOptions): Dates.JSON;
  }
}

Dates.prototype.toJSON = function serialize(opts: ISerializeToJSONOptions = {}): Dates.JSON {
  const json: Dates.JSON = {
    type: 'Dates',
    dates: this.adapters.map(adapter => adapter.toJSON()),
  };

  if (!opts.nested) json.timezone = this.timezone;
  serializeDataToJSON(this, json, opts);

  return json;
};

Dates.fromJSON = function parse(
  json: Dates.JSON,
  options: { timezone?: string | null; data?: (json: OccurrenceGenerator.JSON) => any } = {},
): Dates<any> {
  if (json.type !== 'Dates') {
    throw new ParseJSONError('Invalid Dates JSON');
  }

  return new Dates<any>({
    dates: json.dates.map(date => DateAdapterBase.adapter.fromJSON(date)),
    data: typeof options.data === 'function' ? options.data(json) : json.data,
    timezone: options.timezone || json.timezone,
  });
};

registerJSONSerializerFn('Dates', Dates.fromJSON);

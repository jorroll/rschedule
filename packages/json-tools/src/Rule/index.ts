import { cloneJSON, DateAdapter, DateAdapterBase, IRuleOptions } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';
import {
  ISerializeToJSONOptions,
  registerJSONSerializerFn,
  serializeDataToJSON,
} from '@rschedule/json-tools';

interface JSONDates {
  start: DateAdapter.JSON;
  end?: DateAdapter.JSON;
}

export interface IRuleOptionsJSON extends Omit<IRuleOptions, 'start' | 'end'>, JSONDates {}

declare module '@rschedule/core/generators' {
  namespace Rule {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'Rule';
      config: IRuleOptionsJSON;
      timezone?: string | null;
      data?: unknown;
    }
  }

  abstract class Rule<Data = any> extends OccurrenceGenerator {
    static fromJSON<D = any>(json: Rule.JSON, options?: { timezone?: string | null }): Rule<D>;
    toJSON(opts?: ISerializeToJSONOptions): Rule.JSON;
  }
}

Rule.prototype.toJSON = function serialize(opts: ISerializeToJSONOptions = {}): Rule.JSON {
  const json: Rule.JSON = {
    type: 'Rule',
    config: {
      ...cloneJSON(this.options),
      start: (this as any).normalizeDateInput(this.options.start).toJSON(),
    } as any,
  };

  if (this.options.end) {
    json.config.end = (this as any).normalizeDateInput(this.options.end).toJSON();
  }

  if (!opts.nested) json.timezone = this.timezone;

  serializeDataToJSON(this, json, opts);

  return json;
};

Rule.fromJSON = function fromJSON(json: Rule.JSON, options: { timezone?: string | null } = {}) {
  const config = {
    ...json.config,
    start: DateAdapterBase.adapter.fromJSON(json.config.start),
    end: json.config.end && DateAdapterBase.adapter.fromJSON(json.config.end),
  };

  return new Rule<any>(config, {
    data: json.data,
    timezone: options.timezone || json.timezone,
  });
};

registerJSONSerializerFn('Rule', Rule.fromJSON);

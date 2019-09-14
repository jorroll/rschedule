import { AddOperator, OccurrenceGenerator } from '@rschedule/core/generators';
import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
} from '@rschedule/json-tools';

declare module '@rschedule/core/generators' {
  namespace AddOperator {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'AddOperator';
      base?: OccurrenceGenerator.JSON;
      streams: OccurrenceGenerator.JSON[];
      timezone?: string | null;
    }
  }

  class AddOperator {
    static fromJSON(json: AddOperator.JSON, options?: { timezone?: string | null }): AddOperator;
    toJSON(opts?: ISerializeToJSONOptions): AddOperator.JSON;
  }
}

AddOperator.prototype.toJSON = function serialize(opts: ISerializeToJSONOptions = {}) {
  const json: AddOperator.JSON = {
    type: 'AddOperator',
    streams: this.streams.map(stream => stream.toJSON({ ...opts, nested: true })),
  };

  if (this.config.base) {
    json.base = this.config.base.toJSON(opts);
  }

  if (!opts.nested && !this.config.base) json.timezone = this.timezone;

  return json;
};

AddOperator.fromJSON = function parse(
  json: AddOperator.JSON,
  options: { timezone?: string | null } = {},
) {
  if (json.type !== 'AddOperator') {
    throw new ParseJSONError('Invalid AddOperator JSON.');
  }

  const base = json.base && OccurrenceGenerator.fromJSON(json.base, options);

  const timezone =
    // prettier-ignore
    options.timezone !== undefined ? options.timezone :
    (base && base.timezone) !== undefined ? base!.timezone :
    json.timezone;

  if (timezone === undefined) {
    throw new ParseJSONError('Invalid AddOperator JSON. Timezone is missing.');
  }

  return new AddOperator(
    json.streams.map(stream => OccurrenceGenerator.fromJSON(stream, { timezone, ...options })),
    {
      base,
      timezone,
    },
  );
};

registerJSONSerializerFn('AddOperator', AddOperator.fromJSON);

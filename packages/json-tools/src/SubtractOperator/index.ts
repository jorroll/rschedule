import { OccurrenceGenerator, SubtractOperator } from '@rschedule/core/generators';
import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
} from '@rschedule/json-tools';

declare module '@rschedule/core/generators' {
  namespace SubtractOperator {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'SubtractOperator';
      base?: OccurrenceGenerator.JSON;
      streams: OccurrenceGenerator.JSON[];
      timezone?: string | null;
    }
  }

  class SubtractOperator {
    static fromJSON(
      json: SubtractOperator.JSON,
      options?: { timezone?: string | null },
    ): SubtractOperator;
    toJSON(opts?: ISerializeToJSONOptions): SubtractOperator.JSON;
  }
}

SubtractOperator.prototype.toJSON = function serialize(
  opts: ISerializeToJSONOptions = {},
): SubtractOperator.JSON {
  const json: SubtractOperator.JSON = {
    type: 'SubtractOperator',
    streams: this.streams.map(stream => stream.toJSON({ ...opts, nested: true })),
  };

  if (this.config.base) {
    json.base = this.config.base.toJSON(opts);
  }

  if (!opts.nested && !this.config.base) json.timezone = this.timezone;

  return json;
};

SubtractOperator.fromJSON = function parse(
  json: SubtractOperator.JSON,
  options: { timezone?: string | null } = {},
): SubtractOperator {
  if (json.type !== 'SubtractOperator') {
    throw new ParseJSONError('Invalid SubtractOperator JSON.');
  }

  const base = json.base && OccurrenceGenerator.fromJSON(json.base, options);

  const timezone =
    // prettier-ignore
    options.timezone !== undefined ? options.timezone :
    (base && base.timezone) !== undefined ? base!.timezone :
    json.timezone;

  if (timezone === undefined) {
    throw new ParseJSONError('Invalid SubtractOperator JSON. Timezone is missing.');
  }

  return new SubtractOperator(
    json.streams.map(stream => OccurrenceGenerator.fromJSON(stream, { timezone, ...options })),
    {
      base,
      timezone,
    },
  );
};

registerJSONSerializerFn('SubtractOperator', SubtractOperator.fromJSON);

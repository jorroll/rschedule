import { IntersectionOperator, OccurrenceGenerator } from '@rschedule/core/generators';
import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
} from '@rschedule/json-tools';

declare module '@rschedule/core/generators' {
  namespace IntersectionOperator {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'IntersectionOperator';
      base?: OccurrenceGenerator.JSON;
      streams: OccurrenceGenerator.JSON[];
      timezone?: string | null;
      maxFailedIterations?: number;
    }
  }

  class IntersectionOperator {
    static fromJSON(
      json: IntersectionOperator.JSON,
      options?: { timezone?: string | null },
    ): IntersectionOperator;
    toJSON(opts?: ISerializeToJSONOptions): IntersectionOperator.JSON;
  }
}

IntersectionOperator.prototype.toJSON = function serialize(
  opts: ISerializeToJSONOptions = {},
): IntersectionOperator.JSON {
  const json: IntersectionOperator.JSON = {
    type: 'IntersectionOperator',
    streams: this.streams.map(stream => stream.toJSON({ ...opts, nested: true })),
  };

  if (this.config.base) {
    json.base = this.config.base.toJSON(opts);
  }

  if (!opts.nested && !this.config.base) json.timezone = this.timezone;
  if (this.maxFailedIterations) json.maxFailedIterations = this.maxFailedIterations;

  return json;
};

IntersectionOperator.fromJSON = function parse(
  json: IntersectionOperator.JSON,
  options: { timezone?: string | null } = {},
): IntersectionOperator {
  if (json.type !== 'IntersectionOperator') {
    throw new ParseJSONError('Invalid IntersectionOperator JSON.');
  }

  const base = json.base && OccurrenceGenerator.fromJSON(json.base, options);

  const timezone =
    // prettier-ignore
    options.timezone !== undefined ? options.timezone :
    (base && base.timezone) !== undefined ? base!.timezone :
    json.timezone;

  if (timezone === undefined) {
    throw new ParseJSONError('Invalid IntersectionOperator JSON. Timezone is missing.');
  }

  return new IntersectionOperator(
    {
      maxFailedIterations: json.maxFailedIterations,
      streams: json.streams.map(stream =>
        OccurrenceGenerator.fromJSON(stream, { timezone, ...options }),
      ),
    },
    {
      base,
      timezone,
    },
  );
};

registerJSONSerializerFn('IntersectionOperator', IntersectionOperator.fromJSON);

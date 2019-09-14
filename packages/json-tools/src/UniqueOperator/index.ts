import { OccurrenceGenerator, UniqueOperator } from '@rschedule/core/generators';
import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
} from '@rschedule/json-tools';

declare module '@rschedule/core/generators' {
  namespace UniqueOperator {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'UniqueOperator';
      base: OccurrenceGenerator.JSON;
      timezone?: string | null;
    }
  }

  class UniqueOperator {
    static fromJSON(
      json: UniqueOperator.JSON,
      options?: { timezone?: string | null },
    ): UniqueOperator;
    toJSON(opts?: ISerializeToJSONOptions): UniqueOperator.JSON;
  }
}

UniqueOperator.prototype.toJSON = function serialize(opts: ISerializeToJSONOptions = {}) {
  const json: UniqueOperator.JSON = {
    type: 'UniqueOperator',
    base: this.config.base!.toJSON(opts),
  };

  if (!opts.nested && !this.config.base) json.timezone = this.timezone;

  return json;
};

UniqueOperator.fromJSON = function parse(
  json: UniqueOperator.JSON,
  options: { timezone?: string | null } = {},
) {
  if (json.type !== 'UniqueOperator') {
    throw new ParseJSONError('Invalid UniqueOperator JSON.');
  }

  const base = json.base && OccurrenceGenerator.fromJSON(json.base, options);

  const timezone =
    // prettier-ignore
    options.timezone !== undefined ? options.timezone :
    (base && base.timezone) !== undefined ? base!.timezone :
    json.timezone;

  if (timezone === undefined) {
    throw new ParseJSONError('Invalid UniqueOperator JSON. Timezone is missing.');
  }

  if (!base) {
    throw new ParseJSONError('Invalid UniqueOperator JSON. "base" is missing.');
  }

  return new UniqueOperator([], {
    base,
    timezone,
  });
};

registerJSONSerializerFn('UniqueOperator', UniqueOperator.fromJSON);

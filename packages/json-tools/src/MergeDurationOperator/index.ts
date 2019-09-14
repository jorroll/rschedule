import { MergeDurationOperator, OccurrenceGenerator } from '@rschedule/core/generators';
import {
  ISerializeToJSONOptions,
  ParseJSONError,
  registerJSONSerializerFn,
} from '@rschedule/json-tools';

declare module '@rschedule/core/generators' {
  namespace MergeDurationOperator {
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: 'MergeDurationOperator';
      base?: OccurrenceGenerator.JSON;
      timezone?: string | null;
      maxDuration: number;
    }
  }

  class MergeDurationOperator {
    static fromJSON(
      json: MergeDurationOperator.JSON,
      options?: { timezone?: string | null },
    ): MergeDurationOperator;
    toJSON(opts?: ISerializeToJSONOptions): MergeDurationOperator.JSON;
  }
}

MergeDurationOperator.prototype.toJSON = function serialize(opts: ISerializeToJSONOptions = {}) {
  const json: MergeDurationOperator.JSON = {
    type: 'MergeDurationOperator',
    maxDuration: this.maxDuration,
  };

  if (this.config.base) {
    json.base = this.config.base.toJSON(opts);
  }

  if (!opts.nested && !this.config.base) json.timezone = this.timezone;

  return json;
};

MergeDurationOperator.fromJSON = function parse(
  json: MergeDurationOperator.JSON,
  options: { timezone?: string | null } = {},
) {
  if (json.type !== 'MergeDurationOperator') {
    throw new ParseJSONError('Invalid MergeDurationOperator JSON.');
  }

  const base = json.base && OccurrenceGenerator.fromJSON(json.base, options);

  const timezone =
    // prettier-ignore
    options.timezone !== undefined ? options.timezone :
    (base && base.timezone) !== undefined ? base!.timezone :
    json.timezone;

  if (timezone === undefined) {
    throw new ParseJSONError('Invalid MergeDurationOperator JSON. Timezone is missing.');
  }

  return new MergeDurationOperator(
    {
      maxDuration: json.maxDuration,
    },
    {
      base,
      timezone,
    },
  );
};

registerJSONSerializerFn('MergeDurationOperator', MergeDurationOperator.fromJSON);

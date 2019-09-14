import { OccurrenceGenerator } from '@rschedule/core/generators';

export class ParseJSONError extends Error {}
export class SerializeJSONError extends Error {}

interface IOccurrenceGeneratorJSON {
  type: string;
  [key: string]: any;
}

export interface ISerializeToJSONOptions {
  nested?: boolean;
  data?: boolean | ((arg: OccurrenceGenerator & { data?: any }) => any);
}

export type ISerializeFromJSONFn = (
  json: any,
  options?: { timezone?: string | null },
) => OccurrenceGenerator;

declare module '@rschedule/core/generators' {
  namespace OccurrenceGenerator {
    type JSON = IOccurrenceGeneratorJSON;
  }

  abstract class OccurrenceGenerator {
    static JSON_FN_MAP: Map<string, ISerializeFromJSONFn>;
    static fromJSON: ISerializeFromJSONFn;
    toJSON(opts?: ISerializeToJSONOptions): IOccurrenceGeneratorJSON;
  }
}

OccurrenceGenerator.JSON_FN_MAP = new Map();

OccurrenceGenerator.prototype.toJSON = function serialize(
  opts?: ISerializeToJSONOptions,
): IOccurrenceGeneratorJSON {
  throw new SerializeJSONError(
    `To support smaller bundles, ${this.constructor.name}#toJSON() ` +
      `must be manually added. The easiest way is a one-time import of the ` +
      `json-tools for your date adapter. See the rSchedule docs.`,
  );
};

OccurrenceGenerator.fromJSON = function parse(
  json: IOccurrenceGeneratorJSON,
  options?: { timezone?: string | null },
): OccurrenceGenerator {
  const fn = OccurrenceGenerator.JSON_FN_MAP.get(json.type);

  if (!fn) {
    throw new ParseJSONError(
      `unknown json type "${json.type}". ` +
        `To support smaller bundles, ${this.constructor.name}.toJSON() ` +
        `must be manually added. The easiest way is a one-time import of the ` +
        `json-tools for your date adapter. See the rSchedule docs.`,
    );
  }

  return fn(json, options);
};

export function serializeDataToJSON(
  gen: OccurrenceGenerator & { data?: any },
  json: any,
  opt: { data?: boolean | ((arg: OccurrenceGenerator & { data?: any }) => any) },
): void {
  if (!opt.data) return;

  if (opt.data === true) {
    json.data = gen.data;
  } else {
    json.data = opt.data(gen);
  }

  if (json.data === undefined) delete json.data;
}

export function registerJSONSerializerFn(
  name: string,
  fn: (json: any, options?: { [key: string]: any }) => any,
) {
  if (OccurrenceGenerator.JSON_FN_MAP.has(name)) {
    throw new Error(
      `Attempting to set a global json parser function for "${name}" ` +
        'but one already exists.',
    );
  }

  OccurrenceGenerator.JSON_FN_MAP.set(name, fn);
}

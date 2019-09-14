import { OccurrenceGenerator } from '@rschedule/core/generators';

export class ParseJSONError extends Error {}
export class SerializeJSONError extends Error {}

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
    // tslint:disable-next-line: interface-name
    interface JSON {
      type: string;
    }
  }

  abstract class OccurrenceGenerator {
    static JSON_FN_MAP: Map<string, ISerializeFromJSONFn>;
    static fromJSON(
      json: OccurrenceGenerator.JSON,
      options?: { timezone?: string | null },
    ): OccurrenceGenerator;
    toJSON(opts?: ISerializeToJSONOptions): OccurrenceGenerator.JSON;
  }
}

OccurrenceGenerator.JSON_FN_MAP = new Map();

OccurrenceGenerator.prototype.toJSON = function serialize(
  opts?: ISerializeToJSONOptions,
): OccurrenceGenerator.JSON {
  throw new SerializeJSONError(
    `To support smaller bundles, ${this.constructor.name}#toJSON() ` +
      `must be manually added. See "@rschedule/json-tools" in the rSchedule docs.`,
  );
};

OccurrenceGenerator.fromJSON = function parse(
  json: OccurrenceGenerator.JSON,
  options?: { timezone?: string | null },
): OccurrenceGenerator {
  if (typeof json !== 'object' || json === null) {
    throw new ParseJSONError(`Invalid json "${json}"`);
  }

  const fn = OccurrenceGenerator.JSON_FN_MAP.get(json.type);

  if (!fn) {
    throw new ParseJSONError(
      `Unknown rSchedule object type "${json.type}". Have you added a json serializer ` +
        `for "${json.type}"? ` +
        `See "@rschedule/json-tools" in the rSchedule docs.`,
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
      `Attempting to set a global json parser function for "${name}" ` + 'but one already exists.',
    );
  }

  OccurrenceGenerator.JSON_FN_MAP.set(name, fn);
}

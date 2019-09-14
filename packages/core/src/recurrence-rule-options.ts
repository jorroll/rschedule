import { DateAdapter, DateAdapterBase, DateAdapterCTor, DateInput, DateTime } from './DateAdapter';
import {
  IRecurrenceRuleModule,
  NormRecurrenceRulesOptions,
  RecurrenceRulesOptions,
} from './recurrence-rule';
import { cloneJSON } from './utilities';

export class RuleOptionError extends Error {}

export namespace RuleOption {
  export type Start = DateInput;
  export type End = Start;
  export type Duration = number;
  export type Count = number;
}

export interface IRuleOptionsBase {
  start: RuleOption.Start;
  end?: RuleOption.End;
  duration?: RuleOption.Duration;
  count?: RuleOption.Count;
}

export interface INormRuleOptionsBase {
  start: DateTime;
  end?: DateTime;
  duration?: RuleOption.Duration;
  count?: RuleOption.Count;
}

// tslint:disable-next-line: no-empty-interface
export interface IRuleOptions extends IRuleOptionsBase {}
// tslint:disable-next-line: no-empty-interface
export interface INormRuleOptions extends INormRuleOptionsBase {}

function normalizeDefaultOptions(options: IRuleOptionsBase): INormRuleOptionsBase {
  let start: DateTime;

  if (options.start instanceof DateTime) {
    start = options.start;
  } else if (options.start instanceof DateAdapterBase) {
    start = options.start.toDateTime();
  } else if (DateAdapterBase.adapter.isDate(options.start)) {
    start = DateAdapterBase.adapter.fromDate(options.start).toDateTime();
  } else {
    throw new RuleOptionError(
      '"start" must be either a `DateAdapter` instance or an instance of the ' +
        'date a DateAdapter is wrapping (e.g. `StandardDateAdapter` wraps a `Date`)',
    );
  }

  let end: DateTime | undefined;

  if (options.end) {
    if (options.end instanceof DateTime) {
      end = options.end;
    } else if (options.end instanceof DateAdapterBase) {
      end = options.end.toDateTime();
    } else if (DateAdapterBase.adapter.isDate(options.end)) {
      end = DateAdapterBase.adapter.fromDate(options.end).toDateTime();
    } else {
      throw new RuleOptionError(
        '"end" must be either be `undefined`, a `DateAdapter` instance, or an instance of the ' +
          'date a DateAdapter is wrapping (e.g. `StandardDateAdapter` wraps a `Date`)',
      );
    }
  }

  if (options.duration !== undefined) {
    if (!Number.isInteger(options.duration)) {
      throw new RuleOptionError('"duration" expects a whole number');
    }

    if (options.duration <= 0) {
      throw new RuleOptionError('"duration" must be greater than 0');
    }
  }

  if (options.count !== undefined) {
    if (!Number.isInteger(options.count)) {
      throw new RuleOptionError('"count" must be a whole number');
    }

    if (options.count < 0) {
      throw new RuleOptionError('"count" must be greater than 0');
    }
  }

  if (options.end !== undefined && options.count !== undefined) {
    throw new RuleOptionError('"end" and "count" cannot both be present');
  }

  return {
    start,
    end,
    count: options.count,
    duration: options.duration,
  };
}

export function normalizeRuleOptions<T extends readonly IRecurrenceRuleModule<any, any>[]>(
  recurrenceModules: T,
  options: RecurrenceRulesOptions<T>,
): NormRecurrenceRulesOptions<T> {
  const normOptions = normalizeDefaultOptions(options as any);
  const startOptions = cloneJSON(options);

  recurrenceModules.forEach(mod => {
    mod.normalizeOptions(startOptions as any, normOptions);
  });

  Object.keys(normOptions).forEach(key => {
    if ((normOptions as any)[key] === undefined) {
      delete (normOptions as any)[key];
    }
  });

  return normOptions as any;
}

export function cloneRuleOptions<T extends IRuleOptionsBase>(options: T): T {
  const obj = cloneJSON(options);
  obj.start = options.start;
  if (options.end) obj.end = options.end;
  return obj;
}

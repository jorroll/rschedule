import { DateTime, UnionToIntersection } from './DateAdapter';
import { INormRuleOptionsBase } from './recurrence-rule-options';

export class RecurrenceRuleError extends Error {}

export class ValidDateTime {
  constructor(readonly date: DateTime) {}
}

export class InvalidDateTime {
  constructor(readonly date: DateTime) {}
}

export type RecurrenceRuleResult = ValidDateTime | InvalidDateTime;

export interface IRecurrenceRule {
  run(date: DateTime): RecurrenceRuleResult;
}

export interface IRecurrenceRulesIterator<T> {
  readonly start: DateTime;
  readonly end?: DateTime;
  readonly reverse: boolean;
  readonly options: T;
}

export type GetRecurrenceRuleFn<T> = (
  iterator: IRecurrenceRulesIterator<T>,
) => IRecurrenceRule | null;
export type NormRecurrenceRuleOptionsFn<Options, NOptions> = (
  provided: Options,
  norm: INormRuleOptionsBase & Partial<NOptions>,
) => void;

export type RecurrenceRuleModuleOptions<
  T extends IRecurrenceRuleModule<any, any>
> = T extends IRecurrenceRuleModule<infer R, any> ? R : any;

type NormRecurrenceRuleModuleOptions<
  T extends IRecurrenceRuleModule<any, any>
> = T extends IRecurrenceRuleModule<any, infer R> ? R : any;

export type UnwrapModules<
  T extends ReadonlyArray<IRecurrenceRuleModule<any, any>>
> = T extends ReadonlyArray<infer N> ? N : any;

export type RecurrenceRulesOptions<
  T extends ReadonlyArray<IRecurrenceRuleModule<any, any>>
> = UnionToIntersection<RecurrenceRuleModuleOptions<UnwrapModules<T>>>;

export type NormRecurrenceRulesOptions<
  T extends ReadonlyArray<IRecurrenceRuleModule<any, any>>
> = UnionToIntersection<NormRecurrenceRuleModuleOptions<UnwrapModules<T>>>;

export interface IRecurrenceRuleModule<Options, NOptions> {
  readonly name: string;
  readonly get: GetRecurrenceRuleFn<NOptions>;
  readonly normalizeOptions: NormRecurrenceRuleOptionsFn<Options, NOptions>;
  readonly deps: () => ReadonlyArray<IRecurrenceRuleModule<any, any>>;
}

export function recurrenceRulesReducer<T extends readonly IRecurrenceRuleModule<any, any>[]>(
  rules: T,
): (iterator: IRecurrenceRulesIterator<NormRecurrenceRulesOptions<T>>) => IRecurrenceRule[] {
  return (iterator: IRecurrenceRulesIterator<NormRecurrenceRulesOptions<T>>) =>
    rules.reduce(
      (prev, curr) => {
        const rule = curr.get(iterator);
        if (rule) prev.push(rule);
        return prev;
      },
      [] as IRecurrenceRule[],
    );
}

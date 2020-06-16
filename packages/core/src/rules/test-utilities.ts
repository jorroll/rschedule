import { DateTime, RecurrenceRuleResult } from '@rschedule/core';
import { RecurrenceRule } from './utilities/recurrence-rule';

class BasicRecurrenceRule extends RecurrenceRule<any> {
  run(_: DateTime): RecurrenceRuleResult {
    throw new Error();
  }
}

export function buildRuleFn<T extends typeof BasicRecurrenceRule, O>(ruleConstructor: T) {
  return (start: DateTime, options: O) =>
    new ruleConstructor({
      start,
      reverse: false,
      options: {
        start,
        frequency: 'YEARLY',
        interval: 1,
        weekStart: 'MO',
        ...options,
      },
    }) as InstanceType<T>;
}

export function buildRevRuleFn<T extends typeof BasicRecurrenceRule, O>(ruleConstructor: T) {
  return (end: DateTime, options: O) =>
    new ruleConstructor({
      start: end,
      end,
      reverse: true,
      options: {
        ...options,
        start: end,
        frequency: 'YEARLY',
        interval: 1,
        weekStart: 'MO',
      },
    }) as InstanceType<T>;
}

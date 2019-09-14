import { DateTime, RecurrenceRuleResult } from '@rschedule/core';
import { RecurrenceRule } from './utilities/recurrence-rule';

export function dateTime(...args: number[]) {
  return DateTime.fromJSON({
    timezone: null,
    year: args[0],
    month: args[1] || 1,
    day: args[2] || 1,
    hour: args[3] || 0,
    minute: args[4] || 0,
    second: args[5] || 0,
    millisecond: args[6] || 0,
  });
}

export function isoString(...args: number[]) {
  return dateTime(...args).toISOString();
}

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

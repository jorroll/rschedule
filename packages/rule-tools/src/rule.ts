import { ArgumentError, DateInput, dateInputToDateAdapter, IRuleOptions } from '@rschedule/core';
import { Rule } from '@rschedule/core/generators';

import '@rschedule/core/rules/ByDayOfMonth';
import '@rschedule/core/rules/ByDayOfWeek';

export type RecurrencePattern =
  | 'every [WEEKDAY]'
  | 'the [MONTH_WEEKNO] [WEEKDAY] of every month'
  | 'the [MONTH_DAYNO] of every month'
  | 'the last [WEEKDAY] of every month';

export type OccurrencePattern = 'date';

export type Pattern = OccurrencePattern | RecurrencePattern;

/**
 * Checks to see if the provided rule/rule options match the given `RecurrencePattern`.
 *
 * _See the `rule-tools` docs for more information on available RecurrencePatterns._
 */
export function isRecurrencePattern(args: {
  pattern: RecurrencePattern;
  date: DateInput;
  rule: Rule | IRuleOptions;
  ignoreStart?: boolean;
  ignoreEnd?: boolean;
}): boolean {
  const ruleOptions = normalizeRuleOptions(args.rule);

  const datetime = dateInputToDateAdapter(args.date).toDateTime();

  if (!args.ignoreStart) {
    const start = dateInputToDateAdapter(ruleOptions.start).toDateTime();

    if (datetime.isBefore(start)) return false;
  }

  if (!args.ignoreEnd && ruleOptions.end) {
    const end = dateInputToDateAdapter(ruleOptions.end).toDateTime();

    if (datetime.isAfter(end)) return false;
  }

  switch (args.pattern) {
    case 'every [WEEKDAY]':
      return !!(
        ruleOptions.frequency === 'WEEKLY' &&
        ruleOptions.byDayOfWeek &&
        ruleOptions.byDayOfWeek.includes(datetime.get('weekday'))
      );
    case 'the [MONTH_WEEKNO] [WEEKDAY] of every month':
      return !!(
        ruleOptions.frequency === 'MONTHLY' &&
        ruleOptions.byDayOfWeek &&
        ruleOptions.byDayOfWeek.some(
          day =>
            Array.isArray(day) &&
            day[0] === datetime.get('weekday') &&
            day[1] === Math.ceil(datetime.get('day') / 7),
        )
      );
    case 'the [MONTH_DAYNO] of every month':
      return !!(
        ruleOptions.frequency === 'MONTHLY' &&
        ruleOptions.byDayOfMonth &&
        ruleOptions.byDayOfMonth.includes(datetime.get('day'))
      );
    case 'the last [WEEKDAY] of every month':
      return !!(
        ruleOptions.frequency === 'MONTHLY' &&
        ruleOptions.byDayOfWeek &&
        ruleOptions.byDayOfWeek.some(
          day => Array.isArray(day) && day[0] === datetime.get('weekday') && day[1] === -1,
        )
      );
    default:
      throw new ArgumentError('Unexpected `type` argument passed to ruleHasRecurrencePattern()');
  }
}

/**
 * Returns an array containing all the `RecurrencePatterns` which are valid on a given date.
 *
 * _See the `rule-tools` docs for more information on available RecurrencePatterns._
 */
export function validRecurrencePatternsOnDate(date: DateInput): RecurrencePattern[] {
  const datetime = dateInputToDateAdapter(date).toDateTime();

  const rules: RecurrencePattern[] = [
    'every [WEEKDAY]',
    'the [MONTH_WEEKNO] [WEEKDAY] of every month',
    'the [MONTH_DAYNO] of every month',
  ];

  if (datetime.endGranularity('month').get('day') - datetime.get('day') < 7) {
    rules.push('the last [WEEKDAY] of every month');
  }

  return rules;
}

/**
 * Builds the given `RecurrencePattern` for the given `start` date.
 *
 * _See the `rule-tools` docs for more information on available RecurrencePatterns._
 */
export function buildRecurrencePattern(pattern: RecurrencePattern, start: DateInput): IRuleOptions {
  const datetime = dateInputToDateAdapter(start).toDateTime();

  switch (pattern) {
    case 'every [WEEKDAY]':
      return {
        start,
        frequency: 'WEEKLY',
        byDayOfWeek: [datetime.get('weekday')],
      };
    case 'the [MONTH_WEEKNO] [WEEKDAY] of every month':
      return {
        start,
        frequency: 'MONTHLY',
        byDayOfWeek: [[datetime.get('weekday'), Math.ceil(datetime.get('day') / 7)]],
      };
    case 'the [MONTH_DAYNO] of every month':
      return {
        start,
        frequency: 'MONTHLY',
        byDayOfMonth: [datetime.get('day')],
      };
    case 'the last [WEEKDAY] of every month':
      return {
        start,
        frequency: 'MONTHLY',
        byDayOfWeek: [[datetime.get('weekday'), -1]],
      };
    default:
      throw new ArgumentError('Unexpected `type` argument passed to buildRule()');
  }
}

function normalizeRuleOptions(rule: Rule | IRuleOptions): IRuleOptions {
  return rule instanceof Rule ? rule.options : (rule as IRuleOptions);
}

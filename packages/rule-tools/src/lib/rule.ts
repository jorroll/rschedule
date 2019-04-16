import {
  ArgumentError,
  DateAdapter,
  DateInput,
  dateInputToDateAdapter,
  IProvidedRuleOptions,
  Rule,
  RuleOption,
} from '@rschedule/rschedule';
import { RecurrencePattern } from './interfaces';

/**
 * Checks to see if the provided rule/rule options match the given `RecurrencePattern`.
 *
 * _See the `rule-tools` docs for more information on available RecurrencePatterns._
 */
export function isRecurrencePattern<T extends typeof DateAdapter>(
  pattern: RecurrencePattern,
  date: DateInput<T>,
  rule: Rule<T> | IProvidedRuleOptions<T>,
  options: { dateAdapter?: T; ignoreStart?: boolean; ignoreEnd?: boolean } = {},
): boolean {
  const ruleOptions = normalizeRuleOptions(rule);

  const datetime = dateInputToDateAdapter(date, options.dateAdapter).toDateTime();

  if (!options.ignoreStart) {
    const start = dateInputToDateAdapter(ruleOptions.start, options.dateAdapter).toDateTime();

    if (datetime.isBefore(start)) return false;
  }

  if (!options.ignoreEnd && ruleOptions.end) {
    const end = dateInputToDateAdapter(ruleOptions.end, options.dateAdapter).toDateTime();

    if (datetime.isAfter(end)) return false;
  }

  switch (pattern) {
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
        ruleOptions.byDayOfMonth.includes(datetime.get('day') as RuleOption.ByDayOfMonth)
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
export function validRecurrencePatternsOnDate<T extends typeof DateAdapter>(
  date: DateInput<T>,
  options: { dateAdapter?: T } = {},
): RecurrencePattern[] {
  const datetime = dateInputToDateAdapter(date, options.dateAdapter).toDateTime();

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
export function buildRecurrencePattern<T extends typeof DateAdapter>(
  type: RecurrencePattern,
  start: DateInput<T>,
  options: { dateAdapter?: T } = {},
): IProvidedRuleOptions<T> {
  const datetime = dateInputToDateAdapter(start, options.dateAdapter).toDateTime();

  switch (type) {
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

function normalizeRuleOptions<T extends typeof DateAdapter>(
  rule: Rule<T> | IProvidedRuleOptions<T>,
) {
  return Rule.isRule(rule) ? rule.options : (rule as IProvidedRuleOptions<T>);
}

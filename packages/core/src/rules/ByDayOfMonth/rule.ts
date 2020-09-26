import {
  DateAdapter,
  DateTime,
  InvalidDateTime,
  RecurrenceRuleError,
  RecurrenceRuleResult,
  RuleOption,
  ValidDateTime,
} from '@rschedule/core';
import '../ByDayOfWeek/types';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import getNthWeekdayOfMonth from '../utilities/get-nth-weekday-of-month';
import { RecurrenceRuleBase } from '../utilities/recurrence-rule-base';
import './types';

declare module '../../recurrence-rule-options' {
  interface IRuleOptions extends IByDayOfMonthRuleOptions {}

  interface INormRuleOptions extends INormByDayOfMonthRuleOptions {}
}

export interface IByDayOfMonthRuleOptions extends IFrequencyRuleOptions {
  byDayOfMonth?: RuleOption.ByDayOfMonth[];
}

export interface INormByDayOfMonthRuleOptions extends INormFrequencyRuleOptions {
  byDayOfMonth?: RuleOption.ByDayOfMonth[];
  byDayOfWeek?: RuleOption.ByDayOfWeek[];
}

export class ByDayOfMonthRule extends RecurrenceRuleBase<INormByDayOfMonthRuleOptions> {
  run(date: DateTime): RecurrenceRuleResult {
    const normalizedByDayOfMonth = normalizeByDayOfMonth(
      date,
      this.options.byDayOfMonth!,
      this.options.byDayOfWeek,
    );

    const currentDay = date.get('day');

    for (const day of normalizedByDayOfMonth) {
      if (currentDay > day) continue;

      if (currentDay === day) {
        return this.validateDate(new ValidDateTime(date));
      }

      return this.validateDate(new InvalidDateTime(date.granularity('month').set('day', day)));
    }

    let next: number | undefined;
    let nextMonth = date;
    let index = 0;

    while (!next && index < 30) {
      nextMonth = nextMonth.granularity('month').add(1, 'month');

      next = normalizeByDayOfMonth(
        nextMonth,
        this.options.byDayOfMonth!,
        this.options.byDayOfWeek,
      )[0];

      index++;
    }

    if (index >= 13) {
      throw new RecurrenceRuleError('byDayOfMonth Infinite while loop');
    }

    return this.validateDate(new InvalidDateTime(nextMonth.set('day', next!)));
  }
}

/**
 * Does a few things:
 *
 * 1. filters out byDayOfMonth entries which are not applicable
 *    to current month
 * 2. negative entries to positive ones
 * 3. if a byDayOfWeek option is given, removes days which are
 *    not on the correct day of the week
 */

export function normalizeByDayOfMonth(
  date: DateTime,
  byDayOfMonth: RuleOption.ByDayOfMonth[],
  byDayOfWeek?: RuleOption.ByDayOfWeek[],
): number[] {
  const lengthOfMonth = date.endGranularity('month').get('day');

  let normalizedByDayOfMonth = byDayOfMonth
    .filter(day => lengthOfMonth >= Math.abs(day))
    .map(day => (day > 0 ? day : lengthOfMonth + day + 1));

  if (byDayOfWeek) {
    const base = date.granularity('month');

    const filteredByDayOfMonth: number[] = [];

    byDayOfWeek.forEach(entry => {
      if (typeof entry === 'string') {
        filteredByDayOfMonth.push(
          ...normalizedByDayOfMonth.filter(day => base.set('day', day).get('weekday') === entry),
        );

        return;
      }

      const nthWeekdayOfMonth = getNthWeekdayOfMonth(date, ...entry).get('day');

      if (normalizedByDayOfMonth.includes(nthWeekdayOfMonth)) {
        filteredByDayOfMonth.push(nthWeekdayOfMonth);
      }
    });

    normalizedByDayOfMonth = Array.from(new Set(filteredByDayOfMonth));
  }

  return normalizedByDayOfMonth.sort((a, b) => {
    if (a > b) return 1;
    if (a < b) return -1;
    else return 0;
  });
}

import {
  DateTime,
  InvalidDateTime,
  RecurrenceRuleError,
  RecurrenceRuleResult,
  ValidDateTime,
} from '@rschedule/core';
import { RevRecurrenceRuleBase } from '../utilities/recurrence-rule-base';
import { INormByDayOfMonthRuleOptions, normalizeByDayOfMonth } from './rule';

export class RevByDayOfMonthRule extends RevRecurrenceRuleBase<INormByDayOfMonthRuleOptions> {
  run(date: DateTime): RecurrenceRuleResult {
    const normalizedByDayOfMonth = normalizeByDayOfMonth(
      date,
      this.options.byDayOfMonth!,
      this.options.byDayOfWeek,
    ).reverse();

    const currentDay = date.get('day');

    for (const day of normalizedByDayOfMonth) {
      if (currentDay < day) continue;

      if (currentDay === day) {
        return this.validateDate(new ValidDateTime(date));
      }

      return this.validateDate(new InvalidDateTime(date.endGranularity('month').set('day', day)));
    }

    let next: number | undefined;
    let nextMonth = date;
    let index = 0;

    while (!next && index < 30) {
      nextMonth = nextMonth.endGranularity('month').subtract(1, 'month');

      next = normalizeByDayOfMonth(
        nextMonth,
        this.options.byDayOfMonth!,
        this.options.byDayOfWeek,
      ).pop();

      index++;
    }

    if (index >= 13) {
      throw new RecurrenceRuleError('byDayOfMonth Infinite while loop');
    }

    return this.validateDate(new InvalidDateTime(nextMonth.set('day', next!)));
  }
}

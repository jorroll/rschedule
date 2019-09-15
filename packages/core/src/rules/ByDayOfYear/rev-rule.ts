import { DateTime, InvalidDateTime, RecurrenceRuleError, ValidDateTime } from '@rschedule/core';
import { RevRecurrenceRuleBase } from '../utilities/recurrence-rule-base';
import { INormByDayOfYearRuleOptions, normalizeByDayOfYear } from './rule';

export class RevByDayOfYearRule extends RevRecurrenceRuleBase<INormByDayOfYearRuleOptions> {
  run(date: DateTime) {
    const normalizedByDayOfYear = normalizeByDayOfYear(date, this.options.byDayOfYear!).reverse();

    const currentDay = date.get('yearday');

    for (const day of normalizedByDayOfYear) {
      if (currentDay < day) continue;

      if (currentDay === day) {
        return this.validateDate(new ValidDateTime(date));
      }

      return this.validateDate(
        new InvalidDateTime(
          date
            .granularity('year')
            .add(day - 1, 'day')
            .endGranularity('day'),
        ),
      );
    }

    let nextYearDay: number | undefined;
    let nextYear = date;
    let index = 0;

    while (!nextYearDay && index < 5) {
      nextYear = nextYear
        .granularity('year')
        .subtract(1, 'year')
        .endGranularity('day');

      nextYearDay = normalizeByDayOfYear(nextYear, this.options.byDayOfYear!).pop();

      index++;
    }

    if (index >= 5) {
      throw new RecurrenceRuleError('byDayOfYear Infinite loop');
    }

    return this.validateDate(new InvalidDateTime(nextYear.add(nextYearDay! - 1, 'day')));
  }
}

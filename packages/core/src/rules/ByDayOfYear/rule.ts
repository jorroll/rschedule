import {
  DateTime,
  InvalidDateTime,
  RecurrenceRuleError,
  RecurrenceRuleResult,
  RuleOption,
  ValidDateTime,
} from '@rschedule/core';
import { getDaysInYear } from '@rschedule/core/DateAdapter';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import { RecurrenceRuleBase } from '../utilities/recurrence-rule-base';
import './types';

declare module '../../recurrence-rule-options' {
  interface IRuleOptions extends IByDayOfYearRuleOptions {}

  interface INormRuleOptions extends INormByDayOfYearRuleOptions {}
}

export interface IByDayOfYearRuleOptions extends IFrequencyRuleOptions {
  byDayOfYear?: RuleOption.ByDayOfYear[];
}

export interface INormByDayOfYearRuleOptions extends INormFrequencyRuleOptions {
  byDayOfYear?: RuleOption.ByDayOfYear[];
}

export class ByDayOfYearRule extends RecurrenceRuleBase<INormByDayOfYearRuleOptions> {
  run(date: DateTime): RecurrenceRuleResult {
    const normalizedByDayOfYear = normalizeByDayOfYear(date, this.options.byDayOfYear!);

    const currentDay = date.get('yearday');

    for (const day of normalizedByDayOfYear) {
      if (currentDay > day) continue;

      if (currentDay === day) {
        return this.validateDate(new ValidDateTime(date));
      }

      return this.validateDate(new InvalidDateTime(date.granularity('year').add(day - 1, 'day')));
    }

    let nextYearDay: number | undefined;
    let nextYear = date;
    let index = 0;

    while (!nextYearDay && index < 5) {
      nextYear = nextYear.granularity('year').add(1, 'year');

      nextYearDay = normalizeByDayOfYear(nextYear, this.options.byDayOfYear!)[0];

      index++;
    }

    if (index >= 5) {
      throw new RecurrenceRuleError('byDayOfYear Infinite loop');
    }

    return this.validateDate(new InvalidDateTime(nextYear.add(nextYearDay! - 1, 'day')));
  }
}

/**
 *
 * 1. filters out byDayOfYear entries which are not applicable
 *    to current year
 * 2. converts negative entries to positive ones
 */

export function normalizeByDayOfYear(
  date: DateTime,
  byDayOfYear: RuleOption.ByDayOfYear[],
): number[] {
  const lengthOfYear = getDaysInYear(date.get('year'));

  return byDayOfYear
    .filter(day => lengthOfYear >= Math.abs(day))
    .map(day => (day > 0 ? day : lengthOfYear + day + 1))
    .sort((a, b) => {
      if (a > b) return 1;
      if (a < b) return -1;
      else return 0;
    });
}

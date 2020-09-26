import {
  DateAdapter,
  DateTime,
  InvalidDateTime,
  RecurrenceRuleResult,
  ValidDateTime,
} from '@rschedule/core';
import { RevRecurrenceRuleBase } from '../utilities/recurrence-rule-base';
import { INormByMonthOfYearRuleOptions } from './rule';

export class RevByMonthOfYearRule extends RevRecurrenceRuleBase<INormByMonthOfYearRuleOptions> {
  protected option: DateAdapter.Month[] = this.processor.options.byMonthOfYear!.slice().reverse();

  run(date: DateTime): RecurrenceRuleResult {
    const currentMonth = date.get('month');

    for (const month of this.option) {
      if (currentMonth < month) continue;

      if (currentMonth === month) {
        return this.validateDate(new ValidDateTime(date));
      }

      return this.validateDate(
        new InvalidDateTime(date.endGranularity('year').set('month', month)),
      );
    }

    return this.validateDate(
      new InvalidDateTime(
        date
          .endGranularity('year')
          .subtract(1, 'year')
          .set('month', this.option[0]),
      ),
    );
  }
}

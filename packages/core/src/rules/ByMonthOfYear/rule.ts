import {
  DateTime,
  InvalidDateTime,
  RecurrenceRuleResult,
  RuleOption,
  ValidDateTime,
} from '@rschedule/core';
import { IFrequencyRuleOptions, INormFrequencyRuleOptions } from '../Frequency';
import { RecurrenceRuleBase } from '../utilities/recurrence-rule-base';
import './types';

declare module '../../recurrence-rule-options' {
  interface IRuleOptions extends IByMonthOfYearRuleOptions {}

  interface INormRuleOptions extends INormByMonthOfYearRuleOptions {}
}

export interface IByMonthOfYearRuleOptions extends IFrequencyRuleOptions {
  byMonthOfYear?: RuleOption.ByMonthOfYear[];
}

export interface INormByMonthOfYearRuleOptions extends INormFrequencyRuleOptions {
  byMonthOfYear?: RuleOption.ByMonthOfYear[];
}

export class ByMonthOfYearRule extends RecurrenceRuleBase<INormByMonthOfYearRuleOptions> {
  run(date: DateTime): RecurrenceRuleResult {
    const currentMonth = date.get('month');

    for (const month of this.options.byMonthOfYear!) {
      if (currentMonth > month) continue;

      if (currentMonth === month) {
        return this.validateDate(new ValidDateTime(date));
      }

      return this.validateDate(new InvalidDateTime(date.granularity('year').set('month', month)));
    }

    return this.validateDate(
      new InvalidDateTime(
        date
          .granularity('year')
          .add(1, 'year')
          .set('month', this.options.byMonthOfYear![0]),
      ),
    );
  }
}

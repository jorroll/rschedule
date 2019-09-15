import { DateAdapter, IRecurrenceRuleModule, RuleOption, RuleOptionError } from '@rschedule/core';
import { ByHourOfDayRuleModule } from '../ByHourOfDay';
import { ByMillisecondOfSecondRuleModule } from '../ByMillisecondOfSecond';
import { ByMinuteOfHourRuleModule } from '../ByMinuteOfHour';
import { BySecondOfMinuteRuleModule } from '../BySecondOfMinute';
import { FrequencyRuleModule } from '../Frequency';
import { ruleOptionFilled } from '../utilities/rule-option-filled';
import { RevByDayOfWeekRule } from './rev-rule';
import { ByDayOfWeekRule, IByDayOfWeekRuleOptions, INormByDayOfWeekRuleOptions } from './rule';

export const ByDayOfWeekRuleModule: IRecurrenceRuleModule<
  IByDayOfWeekRuleOptions,
  INormByDayOfWeekRuleOptions
> = {
  name: 'ByDayOfWeek',
  get: processor => {
    if (processor.options.byDayOfWeek === undefined) return null;
    if (processor.reverse) return new RevByDayOfWeekRule(processor as any);
    return new ByDayOfWeekRule(processor as any);
  },
  normalizeOptions: (options, norm) => {
    if (options.byDayOfWeek !== undefined) {
      if (!ruleOptionFilled(options.byDayOfWeek)) {
        throw new RuleOptionError('"byDayOfWeek" expects a non-empty array');
      }

      const invalidWeeday = options.byDayOfWeek.find(day =>
        Array.isArray(day)
          ? !DateAdapter.WEEKDAYS.includes(day[0])
          : !DateAdapter.WEEKDAYS.includes(day),
      );

      if (invalidWeeday) {
        throw new RuleOptionError(
          `"byDayOfWeek" expects weedays in the form ` +
            `${JSON.stringify(DateAdapter.WEEKDAYS)} but "${invalidWeeday}" was provided`,
        );
      }

      if (
        !['YEARLY', 'MONTHLY'].includes(options.frequency) &&
        options.byDayOfWeek.some(weekday => Array.isArray(weekday))
      ) {
        throw new RuleOptionError(
          '"byDayOfWeek" can only include a numeric value (i.e. `[string, number]`) when the "frequency" is ' +
            'either "MONTHLY" or "YEARLY"',
        );
      }

      if (
        options.frequency === 'MONTHLY' &&
        options.byDayOfWeek.some(
          weekday =>
            Array.isArray(weekday) && (weekday[1] < -31 || weekday[1] === 0 || weekday[1] > 31),
        )
      ) {
        throw new RuleOptionError(
          'when "frequency" is "MONTHLY", each "byDayOfWeek" can optionally only' +
            ' have a numeric value >= -31 and <= 31 and !== 0',
        );
      }

      if (
        options.frequency === 'YEARLY' &&
        options.byDayOfWeek.some(
          weekday =>
            Array.isArray(weekday) && (weekday[1] < -366 || weekday[1] === 0 || weekday[1] > 366),
        )
      ) {
        throw new RuleOptionError(
          'when "frequency" is "YEARLY", each "byDayOfWeek" can optionally only' +
            ' have a numeric value >= -366 and <= 366 and !== 0',
        );
      }

      norm.byDayOfWeek = options.byDayOfWeek;
    } else if (!ruleOptionFilled((options as any).byDayOfMonth) && options.frequency === 'WEEKLY') {
      norm.byDayOfWeek = [norm.start.get('weekday')] as RuleOption.ByDayOfWeek[];
    }
  },
  deps: () => [
    FrequencyRuleModule,
    ByDayOfWeekRuleModule,
    ByHourOfDayRuleModule,
    ByMinuteOfHourRuleModule,
    BySecondOfMinuteRuleModule,
    ByMillisecondOfSecondRuleModule,
  ],
};

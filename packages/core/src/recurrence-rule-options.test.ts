import { context } from '@local-tests/utilities';
import { normalizeRuleOptions } from '@rschedule/core';
import { ByDayOfMonthRuleModule } from './rules/ByDayOfMonth';
import { ByDayOfWeekRuleModule } from './rules/ByDayOfWeek';
import { ByHourOfDayRuleModule } from './rules/ByHourOfDay';
import { ByMillisecondOfSecondRuleModule } from './rules/ByMillisecondOfSecond';
import { ByMinuteOfHourRuleModule } from './rules/ByMinuteOfHour';
import { ByMonthOfYearRuleModule } from './rules/ByMonthOfYear';
import { BySecondOfMinuteRuleModule } from './rules/BySecondOfMinute';
import { FrequencyRuleModule } from './rules/Frequency';
import { dateTime } from './rules/test-utilities';

describe('normalizeRuleOptions', () => {
  context(dateTime(2019, 1, 1, 1, 1, 1, 1), date => {
    it('FrequencyRuleModule', () => {
      let options = normalizeRuleOptions([FrequencyRuleModule], {
        start: date,
        frequency: 'YEARLY',
      });

      expect(options).toEqual({
        start: date,
        frequency: 'YEARLY',
        interval: 1,
        weekStart: 'MO',
      });

      options = normalizeRuleOptions([FrequencyRuleModule], {
        start: date,
        frequency: 'SECONDLY',
        interval: 2,
        weekStart: 'FR',
      });

      expect(options).toEqual({
        start: date,
        frequency: 'SECONDLY',
        interval: 2,
        weekStart: 'FR',
      });
    });

    it('FrequencyRuleModule,ByMonthOfYearRuleModule', () => {
      const options = normalizeRuleOptions([FrequencyRuleModule, ByMonthOfYearRuleModule], {
        start: date,
        frequency: 'YEARLY',
      });

      expect(options).toEqual({
        start: date,
        frequency: 'YEARLY',
        interval: 1,
        weekStart: 'MO',
        byMonthOfYear: [1],
      });
    });
  });

  it('works 1', () => {
    const date = dateTime(1997, 9, 2, 9, 0, 0, 0);

    const normalizedOptions = normalizeRuleOptions(
      [
        FrequencyRuleModule,
        ByMonthOfYearRuleModule,
        ByDayOfMonthRuleModule,
        ByHourOfDayRuleModule,
        ByMinuteOfHourRuleModule,
        BySecondOfMinuteRuleModule,
        ByMillisecondOfSecondRuleModule,
      ],
      {
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: date,
      },
    );

    expect(normalizedOptions).toEqual({
      start: date,
      count: 3,
      frequency: 'YEARLY',
      interval: 1,
      weekStart: 'MO',
      byMonthOfYear: [1, 3],
      byDayOfMonth: [date.get('day')],
      byHourOfDay: [date.get('hour')],
      byMinuteOfHour: [date.get('minute')],
      bySecondOfMinute: [date.get('second')],
      byMillisecondOfSecond: [date.get('millisecond')],
    });
  });

  it('works 2', () => {
    const date = dateTime(1997, 9, 2, 9, 0, 0, 0);

    const normalizedOptions = normalizeRuleOptions(
      [
        FrequencyRuleModule,
        ByMonthOfYearRuleModule,
        ByDayOfMonthRuleModule,
        ByHourOfDayRuleModule,
        ByMinuteOfHourRuleModule,
        BySecondOfMinuteRuleModule,
        ByMillisecondOfSecondRuleModule,
      ],
      {
        start: date,
        count: 3,
        frequency: 'YEARLY',
        interval: 5,
        weekStart: 'SU',
        byMonthOfYear: [1, 3],
        byDayOfMonth: [10],
        byHourOfDay: [12, 5],
        bySecondOfMinute: [1],
      },
    );

    expect(normalizedOptions).toEqual({
      start: date,
      count: 3,
      frequency: 'YEARLY',
      interval: 5,
      weekStart: 'SU',
      byMonthOfYear: [1, 3],
      byDayOfMonth: [10],
      byHourOfDay: [5, 12],
      byMinuteOfHour: [date.get('minute')],
      bySecondOfMinute: [1],
      byMillisecondOfSecond: [date.get('millisecond')],
    });
  });

  it('works 3', () => {
    const date = dateTime(1997, 9, 2, 9, 0, 0, 0);

    const normalizedOptions = normalizeRuleOptions(
      [
        FrequencyRuleModule,
        ByMonthOfYearRuleModule,
        ByDayOfMonthRuleModule,
        ByDayOfWeekRuleModule,
        ByHourOfDayRuleModule,
        ByMinuteOfHourRuleModule,
        BySecondOfMinuteRuleModule,
        ByMillisecondOfSecondRuleModule,
      ],
      {
        start: date,
        end: dateTime(1997, 12, 2, 9, 0, 0, 0),
        frequency: 'YEARLY',
        interval: 5,
        weekStart: 'SU',
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['WE', ['WE', -1]],
      },
    );

    const dateEnd = dateTime(1997, 12, 2, 9, 0, 0, 0).toDateTime();

    expect(normalizedOptions).toEqual({
      start: date,
      end: dateEnd,
      frequency: 'YEARLY',
      interval: 5,
      weekStart: 'SU',
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['WE', ['WE', -1]],
      byHourOfDay: [date.get('hour')],
      byMinuteOfHour: [date.get('minute')],
      bySecondOfMinute: [date.get('second')],
      byMillisecondOfSecond: [date.get('millisecond')],
    });
  });
});

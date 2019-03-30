import { normalizeRuleOptions } from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { dateAdapter } from './utilities';

describe(`normalizeRuleOptions`, () => {
  it('works 1', () => {
    const normalizedOptions = normalizeRuleOptions(StandardDateAdapter, {
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
    });

    const dateTime = dateAdapter(1997, 9, 2, 9, 0, 0, 0).toDateTime();

    expect(normalizedOptions).toEqual({
      start: dateTime,
      end: undefined,
      count: 3,
      frequency: 'YEARLY',
      interval: 1,
      weekStart: 'MO',
      byMonthOfYear: [1, 3],
      byDayOfMonth: [dateTime.get('day')],
      byHourOfDay: [dateTime.get('hour')],
      byMinuteOfHour: [dateTime.get('minute')],
      bySecondOfMinute: [dateTime.get('second')],
      byMillisecondOfSecond: [dateTime.get('millisecond')],
    });
  });

  it('works 2', () => {
    const normalizedOptions = normalizeRuleOptions(StandardDateAdapter, {
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
      count: 3,
      frequency: 'YEARLY',
      interval: 5,
      weekStart: 'SU',
      byMonthOfYear: [1, 3],
      byDayOfMonth: [10],
      byHourOfDay: [12, 5],
      bySecondOfMinute: [1],
    });

    const dateTime = dateAdapter(1997, 9, 2, 9, 0, 0, 0).toDateTime();

    expect(normalizedOptions).toEqual({
      start: dateTime,
      end: undefined,
      count: 3,
      frequency: 'YEARLY',
      interval: 5,
      weekStart: 'SU',
      byMonthOfYear: [1, 3],
      byDayOfMonth: [10],
      byHourOfDay: [5, 12],
      byMinuteOfHour: [dateTime.get('minute')],
      bySecondOfMinute: [1],
      byMillisecondOfSecond: [dateTime.get('millisecond')],
    });
  });

  it('works 3', () => {
    const normalizedOptions = normalizeRuleOptions(StandardDateAdapter, {
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
      end: dateAdapter(1997, 12, 2, 9, 0, 0, 0),
      frequency: 'YEARLY',
      interval: 5,
      weekStart: 'SU',
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['WE', ['WE', -1]],
    });

    const dateTime = dateAdapter(1997, 9, 2, 9, 0, 0, 0).toDateTime();
    const dateTimeEnd = dateAdapter(1997, 12, 2, 9, 0, 0, 0).toDateTime();

    expect(normalizedOptions).toEqual({
      start: dateTime,
      end: dateTimeEnd,
      count: undefined,
      frequency: 'YEARLY',
      interval: 5,
      weekStart: 'SU',
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['WE', ['WE', -1]],
      byHourOfDay: [dateTime.get('hour')],
      byMinuteOfHour: [dateTime.get('minute')],
      bySecondOfMinute: [dateTime.get('second')],
      byMillisecondOfSecond: [dateTime.get('millisecond')],
    });
  });
});

import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { dateTime } from '../../test-utilities';
import '../ByMonthOfYear';
import { buildRevRuleFn } from '../test-utilities';
import { getPrevWeekdaysOfMonth, getPrevWeekdaysOfYear, RevByDayOfWeekRule } from './rev-rule';

const buildRule = buildRevRuleFn<
  typeof RevByDayOfWeekRule,
  {
    frequency: RuleOption.Frequency;
    byDayOfWeek: RuleOption.ByDayOfWeek[];
    byMonthOfYear?: RuleOption.ByMonthOfYear[];
    weekStart?: RuleOption.WeekStart;
    interval?: RuleOption.Interval;
  }
>(RevByDayOfWeekRule);

describe('RevByDayOfWeekPipe', () => {
  let byDayOfWeek: RuleOption.ByDayOfWeek[];
  let byMonthOfYear: RuleOption.ByMonthOfYear[] | undefined;

  afterEach(() => {
    byDayOfWeek = undefined as any;
    byMonthOfYear = undefined;
  });

  context('YEARLY', (frequency: 'YEARLY') => {
    context(dateTime(2019, 1, 1, 2, 3, 4, 5), date => {
      it('TU', () => {
        byDayOfWeek = ['TU'];

        const prevWeekdays = getPrevWeekdaysOfYear(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([date]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(ValidDateTime);
        expect(result).toEqual({ date });
      });

      it('FR,TH,20MO', () => {
        byDayOfWeek = ['FR', 'TH', ['MO', 20]];

        let prevWeekdays = getPrevWeekdaysOfYear(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([]);

        prevWeekdays = getPrevWeekdaysOfYear(
          date.subtract(1, 'year').endGranularity('year'),
          byDayOfWeek,
        );

        expect(prevWeekdays).toEqual([
          dateTime(2018, 12, 28).endGranularity('day'),
          dateTime(2018, 12, 27).endGranularity('day'),
          dateTime(2018, 5, 14).endGranularity('day'),
        ]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2018, 12, 28).endGranularity('day') });
      });

      it('FR,TH,53MO', () => {
        byDayOfWeek = ['FR', 'TH', ['MO', 53]];

        let prevWeekdays = getPrevWeekdaysOfYear(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([]);

        prevWeekdays = getPrevWeekdaysOfYear(
          date.subtract(1, 'year').endGranularity('year'),
          byDayOfWeek,
        );

        expect(prevWeekdays).toEqual([
          dateTime(2018, 12, 31).endGranularity('day'),
          dateTime(2018, 12, 28).endGranularity('day'),
          dateTime(2018, 12, 27).endGranularity('day'),
        ]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2018, 12, 31).endGranularity('day') });
      });

      it('FR,TH,3MO and 1,5', () => {
        byDayOfWeek = ['FR', 'TH', ['MO', 3]];
        byMonthOfYear = [1, 5];

        let prevWeekdays = getPrevWeekdaysOfMonth(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([]);

        prevWeekdays = getPrevWeekdaysOfMonth(
          date.granularity('year').subtract(1, 'millisecond'),
          byDayOfWeek,
        );

        expect(prevWeekdays).toEqual([
          dateTime(2018, 12, 28).endGranularity('day'),
          dateTime(2018, 12, 27).endGranularity('day'),
          dateTime(2018, 12, 17).endGranularity('day'),
        ]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2018, 12, 28).endGranularity('day') });
      });
    });

    context(dateTime(2019, 1, 16, 2, 3, 4, 5), date => {
      it('TU', () => {
        byDayOfWeek = ['TU'];

        const prevWeekdays = getPrevWeekdaysOfYear(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([dateTime(2019, 1, 15, 2, 3, 4, 5)]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2019, 1, 15).endGranularity('day') });
      });

      it('FR,TH,20MO', () => {
        byDayOfWeek = ['FR', 'TH', ['MO', 20]];

        const prevWeekdays = getPrevWeekdaysOfYear(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([
          dateTime(2019, 1, 11, 2, 3, 4, 5),
          dateTime(2019, 1, 10, 2, 3, 4, 5),
        ]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2019, 1, 11).endGranularity('day') });
      });
    });

    context(dateTime(2019, 3, 16, 2, 3, 4, 5), date => {
      it('3MO and 1,5', () => {
        byDayOfWeek = [['MO', 3]];
        byMonthOfYear = [1, 5];

        let prevWeekdays = getPrevWeekdaysOfMonth(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([]);

        prevWeekdays = getPrevWeekdaysOfMonth(
          date.granularity('month').subtract(1, 'millisecond'),
          byDayOfWeek,
        );

        expect(prevWeekdays).toEqual([dateTime(2019, 2, 18).endGranularity('day')]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2019, 2, 18).endGranularity('day') });
      });

      it('3MO and 2', () => {
        byDayOfWeek = [['MO', 3]];
        byMonthOfYear = [2];

        let prevWeekdays = getPrevWeekdaysOfMonth(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([]);

        prevWeekdays = getPrevWeekdaysOfMonth(
          date.granularity('month').subtract(1, 'millisecond'),
          byDayOfWeek,
        );

        expect(prevWeekdays).toEqual([dateTime(2019, 2, 18).endGranularity('day')]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2019, 2, 18).endGranularity('day') });
      });
    });
  });

  context('MONTHLY', (frequency: 'MONTHLY') => {
    context(dateTime(2019, 1, 1, 2, 3, 4, 5), date => {
      it('TU', () => {
        byDayOfWeek = ['TU'];

        const prevWeekdays = getPrevWeekdaysOfMonth(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([date]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(ValidDateTime);
        expect(result).toEqual({ date });
      });
    });

    context(dateTime(2019, 1, 16, 2, 3, 4, 5), date => {
      it('FR,TH,3MO', () => {
        byDayOfWeek = ['FR', 'TH', ['MO', 3]];

        const prevWeekdays = getPrevWeekdaysOfMonth(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([
          dateTime(2019, 1, 11, 2, 3, 4, 5),
          dateTime(2019, 1, 10, 2, 3, 4, 5),
        ]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2019, 1, 11).endGranularity('day') });
      });
    });

    context(dateTime(2019, 3, 16, 2, 3, 4, 5), date => {
      it('3MO and 2', () => {
        byDayOfWeek = [['MO', 3]];
        byMonthOfYear = [2];

        let prevWeekdays = getPrevWeekdaysOfMonth(date, byDayOfWeek);

        expect(prevWeekdays).toEqual([]);

        prevWeekdays = getPrevWeekdaysOfMonth(
          date.granularity('month').subtract(1, 'millisecond'),
          byDayOfWeek,
        );

        expect(prevWeekdays).toEqual([dateTime(2019, 2, 18).endGranularity('day')]);

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2019, 2, 18).endGranularity('day') });
      });
    });

    context(dateTime(2019, 3, 30, 2, 3, 4, 5), date => {
      it('3MO and 1,5', () => {
        byDayOfWeek = ['MO'];
        byMonthOfYear = [1, 5];

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2019, 3, 25).endGranularity('day') });
      });
    });
  });

  context('DAILY', (frequency: 'DAILY') => {
    context(dateTime(2019, 1, 1, 2, 3, 4, 5), date => {
      it('TU', () => {
        byDayOfWeek = ['TU'];

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(ValidDateTime);
        expect(result).toEqual({ date });
      });

      it('FR,TH', () => {
        byDayOfWeek = ['FR', 'TH'];
        byMonthOfYear = [1, 5];

        const rule = buildRule(date, { byDayOfWeek, byMonthOfYear, frequency });

        const result = rule.run(date);

        expect(result).toBeInstanceOf(InvalidDateTime);
        expect(result).toEqual({ date: dateTime(2018, 12, 28).endGranularity('day') });
      });
    });
  });
});

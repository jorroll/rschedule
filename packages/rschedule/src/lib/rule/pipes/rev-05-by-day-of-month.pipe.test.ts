import { context } from '../../../../../../tests/utilities';
import { RuleOption } from '../rule-options';
import { IByDayOfMonthRuleOptions } from './05-by-day-of-month.pipe';
import { RevByDayOfMonthPipe } from './rev-05-by-day-of-month.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof RevByDayOfMonthPipe, IByDayOfMonthRuleOptions>(
  RevByDayOfMonthPipe,
);

describe('RevByDayOfMonthPipe', () => {
  let byDayOfMonth: RuleOption.ByDayOfMonth[];
  let byDayOfWeek: RuleOption.ByDayOfWeek[] | undefined;

  afterEach(() => {
    byDayOfMonth = [];
    byDayOfWeek = undefined;
  });

  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      byDayOfMonth = [1];

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('10,5', () => {
      byDayOfMonth = [10, 5];

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2018, 12, 10, 23, 59, 59, 999),
      });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1', () => {
      byDayOfMonth = [1];

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 23, 59, 59, 999),
      });
    });

    it('10,5', () => {
      byDayOfMonth = [10, 5];

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 5, 23, 59, 59, 999),
      });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('5 and SA', () => {
      byDayOfMonth = [5];
      byDayOfWeek = ['SA'];

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 5, 23, 59, 59, 999),
      });
    });

    it('10,5 and TU', () => {
      byDayOfMonth = [10, 5];
      byDayOfWeek = ['TU'];

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2018, 7, 10, 23, 59, 59, 999),
      });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1 and 1TU', () => {
      byDayOfMonth = [1];
      byDayOfWeek = [['TU', 1]];

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 23, 59, 59, 999),
      });
    });

    it('10,5 and MO,2TH', () => {
      byDayOfMonth = [10, 5];
      byDayOfWeek = ['MO', ['TH', 2]];

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2018, 12, 10, 23, 59, 59, 999),
      });
    });
  });
});

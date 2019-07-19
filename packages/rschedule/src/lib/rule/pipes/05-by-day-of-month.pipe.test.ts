import { context } from '../../../../../../tests/utilities';
import { RuleOption } from '../rule-options';
import {
  ByDayOfMonthPipe,
  IByDayOfMonthRuleOptions,
  normalizeByDayOfMonth,
} from './05-by-day-of-month.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof ByDayOfMonthPipe, IByDayOfMonthRuleOptions>(ByDayOfMonthPipe);

describe('ByDayOfMonthPipe', () => {
  let byDayOfMonth: RuleOption.ByDayOfMonth[];
  let byDayOfWeek: RuleOption.ByDayOfWeek[] | undefined;

  afterEach(() => {
    byDayOfMonth = [];
    byDayOfWeek = undefined;
  });

  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      byDayOfMonth = [1];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('5,10', () => {
      byDayOfMonth = [5, 10];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 5),
      });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1', () => {
      byDayOfMonth = [1];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 2, 1),
      });
    });

    it('5,10', () => {
      byDayOfMonth = [5, 10];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const pipe = buildPipe(date, { byDayOfMonth });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 10),
      });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1 and TU', () => {
      byDayOfMonth = [1];
      byDayOfWeek = ['TU'];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 10, 1),
      });
    });

    it('5,10 and TU', () => {
      byDayOfMonth = [5, 10];
      byDayOfWeek = ['TU'];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual([]);

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 2, 5),
      });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1 and 1TU', () => {
      byDayOfMonth = [1];
      byDayOfWeek = [['TU', 1]];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 10, 1),
      });
    });

    it('5,10 and MO,2TH', () => {
      byDayOfMonth = [5, 10];
      byDayOfWeek = ['MO', ['TH', 2]];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual([10]);

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 10),
      });
    });
  });

  // test leap year
  context(dateTime(2019, 7, 6), date => {
    it('1 and 1TU', () => {
      byDayOfMonth = [29];
      byDayOfWeek = [['SA', 5]];

      const pipe = buildPipe(date, { byDayOfMonth, byDayOfWeek });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2020, 2, 29),
      });
    });
  });
});

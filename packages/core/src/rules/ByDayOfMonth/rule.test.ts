import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { dateTime } from '../../test-utilities';
import { buildRuleFn } from '../test-utilities';
import { ByDayOfMonthRule, normalizeByDayOfMonth } from './rule';

const buildRule = buildRuleFn<
  typeof ByDayOfMonthRule,
  { byDayOfMonth: RuleOption.ByDayOfMonth[]; byDayOfWeek?: RuleOption.ByDayOfWeek[] }
>(ByDayOfMonthRule);

describe('ByDayOfMonthRule', () => {
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

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('5,10', () => {
      byDayOfMonth = [5, 10];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 5) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1', () => {
      byDayOfMonth = [1];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 2, 1) });
    });

    it('5,10', () => {
      byDayOfMonth = [5, 10];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 10) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1 and TU', () => {
      byDayOfMonth = [1];
      byDayOfWeek = ['TU'];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 10, 1) });
    });

    it('5,10 and TU', () => {
      byDayOfMonth = [5, 10];
      byDayOfWeek = ['TU'];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual([]);

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 2, 5) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1 and 1TU', () => {
      byDayOfMonth = [1];
      byDayOfWeek = [['TU', 1]];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual(byDayOfMonth);

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 10, 1) });
    });

    it('5,10 and MO,2TH', () => {
      byDayOfMonth = [5, 10];
      byDayOfWeek = ['MO', ['TH', 2]];

      const normalizedEntries = normalizeByDayOfMonth(date, byDayOfMonth, byDayOfWeek);

      expect(normalizedEntries).toEqual([10]);

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 10) });
    });
  });

  // test leap year
  context(dateTime(2019, 7, 6), date => {
    it('1 and 1TU', () => {
      byDayOfMonth = [29];
      byDayOfWeek = [['SA', 5]];

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2020, 2, 29) });
    });
  });
});

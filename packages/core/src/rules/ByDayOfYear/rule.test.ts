import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { buildRuleFn, dateTime } from '../test-utilities';
import { ByDayOfYearRule, normalizeByDayOfYear } from './rule';

const buildRule = buildRuleFn<typeof ByDayOfYearRule, { byDayOfYear: RuleOption.ByDayOfYear[] }>(
  ByDayOfYearRule,
);

describe('ByDayOfYearRule', () => {
  let byDayOfYear: RuleOption.ByDayOfYear[];

  afterEach(() => {
    byDayOfYear = [];
  });

  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      byDayOfYear = [1];

      const normalizedEntries = normalizeByDayOfYear(date, byDayOfYear);

      expect(normalizedEntries).toEqual(byDayOfYear);

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('5,10', () => {
      byDayOfYear = [5, 10];

      const normalizedEntries = normalizeByDayOfYear(date, byDayOfYear);

      expect(normalizedEntries).toEqual(byDayOfYear);

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 5) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1', () => {
      byDayOfYear = [1];

      const normalizedEntries = normalizeByDayOfYear(date, byDayOfYear);

      expect(normalizedEntries).toEqual(byDayOfYear);

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2020, 1, 1) });
    });

    it('5,10', () => {
      byDayOfYear = [5, 10];

      const normalizedEntries = normalizeByDayOfYear(date, byDayOfYear);

      expect(normalizedEntries).toEqual(byDayOfYear);

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 10) });
    });
  });

  context(dateTime(2019, 2, 6), date => {
    it('35,78', () => {
      byDayOfYear = [35, 78];

      const normalizedEntries = normalizeByDayOfYear(date, byDayOfYear);

      expect(normalizedEntries).toEqual(byDayOfYear);

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 3, 19) });
    });

    it('-35,-78', () => {
      byDayOfYear = [-35, -78];

      const normalizedEntries = normalizeByDayOfYear(date, byDayOfYear);

      expect(normalizedEntries).toEqual([288, 331]);

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 10, 15) });
    });
  });

  // test leap year
  context(dateTime(2019, 7, 6), date => {
    it('366', () => {
      byDayOfYear = [366];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2020, 12, 31) });
    });
  });
});

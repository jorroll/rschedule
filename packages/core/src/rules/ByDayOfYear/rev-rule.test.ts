import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { buildRevRuleFn, dateTime } from '../test-utilities';
import { RevByDayOfYearRule } from './rev-rule';

const buildRule = buildRevRuleFn<
  typeof RevByDayOfYearRule,
  { byDayOfYear: RuleOption.ByDayOfYear[] }
>(RevByDayOfYearRule);

describe('RevByDayOfYearRule', () => {
  let byDayOfYear: RuleOption.ByDayOfYear[];

  afterEach(() => {
    byDayOfYear = [];
  });

  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      byDayOfYear = [1];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('10,5', () => {
      byDayOfYear = [10, 5];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2018, 1, 10, 23, 59, 59, 999) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1', () => {
      byDayOfYear = [1];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 23, 59, 59, 999) });
    });

    it('10,5', () => {
      byDayOfYear = [10, 5];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 5, 23, 59, 59, 999) });
    });
  });

  context(dateTime(2019, 2, 6), date => {
    it('35,78', () => {
      byDayOfYear = [35, 78];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 2, 4, 23, 59, 59, 999) });
    });

    it('-35,-78', () => {
      byDayOfYear = [-35, -78];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2018, 11, 27, 23, 59, 59, 999) });
    });
  });

  // test leap year
  context(dateTime(2020, 12, 30), date => {
    it('366', () => {
      byDayOfYear = [366];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2016, 12, 31, 23, 59, 59, 999) });
    });
  });

  // test leap year
  context(dateTime(2020, 12, 31), date => {
    it('366', () => {
      byDayOfYear = [366];

      const rule = buildRule(date, { byDayOfYear });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });
  });
});

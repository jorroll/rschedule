import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { buildRevRuleFn, dateTime } from '../test-utilities';
import { RevByMonthOfYearRule } from './rev-rule';

const buildRule = buildRevRuleFn<
  typeof RevByMonthOfYearRule,
  { byMonthOfYear: RuleOption.ByMonthOfYear[] }
>(RevByMonthOfYearRule);

describe('RevByMonthOfYearRule', () => {
  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      const rule = buildRule(date, {
        byMonthOfYear: [1],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('5,10', () => {
      const rule = buildRule(date, {
        byMonthOfYear: [5, 10],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2018, 10, 31, 23, 59, 59, 999) });
    });
  });

  context(dateTime(2019, 6, 10), date => {
    it('1', () => {
      const rule = buildRule(date, {
        byMonthOfYear: [1],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 31, 23, 59, 59, 999) });
    });

    it('5,10', () => {
      const rule = buildRule(date, {
        byMonthOfYear: [5, 10],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 5, 31, 23, 59, 59, 999) });
    });
  });
});

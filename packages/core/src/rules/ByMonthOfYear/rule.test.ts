import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { dateTime } from '../../test-utilities';
import { buildRuleFn } from '../test-utilities';
import { ByMonthOfYearRule } from './rule';

const buildRule = buildRuleFn<
  typeof ByMonthOfYearRule,
  { byMonthOfYear: RuleOption.ByMonthOfYear[] }
>(ByMonthOfYearRule);

describe('ByMonthOfYearRule', () => {
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
      expect(result).toEqual({ date: dateTime(2019, 5, 1) });
    });
  });

  context(dateTime(2019, 6, 10), date => {
    it('1', () => {
      const rule = buildRule(date, {
        byMonthOfYear: [1],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2020, 1, 1) });
    });

    it('5,10', () => {
      const rule = buildRule(date, {
        byMonthOfYear: [5, 10],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 10, 1) });
    });
  });
});

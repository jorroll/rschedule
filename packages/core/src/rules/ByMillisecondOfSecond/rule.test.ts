import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { buildRuleFn, dateTime } from '../test-utilities';
import { ByMillisecondOfSecondRule } from './rule';

const buildRule = buildRuleFn<
  typeof ByMillisecondOfSecondRule,
  { byMillisecondOfSecond: RuleOption.ByMillisecondOfSecond[] }
>(ByMillisecondOfSecondRule);

describe('ByMillisecondOfSecondRule', () => {
  let byMillisecondOfSecond: RuleOption.ByMillisecondOfSecond[];

  afterEach(() => {
    byMillisecondOfSecond = [];
  });

  context(dateTime(2019, 1, 1, 1, 1, 1, 1), date => {
    it('1', () => {
      byMillisecondOfSecond = [1];

      const rule = buildRule(date, { byMillisecondOfSecond });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('5,10', () => {
      byMillisecondOfSecond = [5, 10];

      const rule = buildRule(date, { byMillisecondOfSecond });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 1, 1, 5) });
    });
  });

  context(dateTime(2019, 1, 1, 1, 1, 1, 6), date => {
    it('1', () => {
      byMillisecondOfSecond = [1];

      const rule = buildRule(date, { byMillisecondOfSecond });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 1, 2, 1) });
    });

    it('5,10', () => {
      byMillisecondOfSecond = [5, 10];

      const rule = buildRule(date, { byMillisecondOfSecond });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 1, 1, 10) });
    });
  });
});

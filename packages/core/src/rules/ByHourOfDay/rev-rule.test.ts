import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { dateTime } from '../../test-utilities';
import { buildRevRuleFn } from '../test-utilities';
import { RevByHourOfDayRule } from './rev-rule';

const buildRule = buildRevRuleFn<
  typeof RevByHourOfDayRule,
  { byHourOfDay: RuleOption.ByHourOfDay[] }
>(RevByHourOfDayRule);

describe('RevByHourOfDayPipe', () => {
  context(dateTime(2019, 1, 1, 1), date => {
    it('1', () => {
      const rule = buildRule(date, {
        byHourOfDay: [1],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('10,5', () => {
      const rule = buildRule(date, {
        byHourOfDay: [5, 10],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2018, 12, 31, 10, 59, 59, 999) });
    });
  });

  context(dateTime(2019, 1, 1, 6), date => {
    it('1', () => {
      const rule = buildRule(date, {
        byHourOfDay: [1],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 59, 59, 999) });
    });

    it('10,5', () => {
      const rule = buildRule(date, {
        byHourOfDay: [5, 10],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 5, 59, 59, 999) });
    });
  });
});

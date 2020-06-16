import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { dateTime } from '../../test-utilities';
import { buildRevRuleFn } from '../test-utilities';
import { RevByMinuteOfHourRule } from './rev-rule';

const buildRule = buildRevRuleFn<
  typeof RevByMinuteOfHourRule,
  { byMinuteOfHour: RuleOption.ByMinuteOfHour[] }
>(RevByMinuteOfHourRule);

describe('RevByMinuteOfHourRule', () => {
  context(dateTime(2019, 1, 1, 1, 1), date => {
    it('1', () => {
      const rule = buildRule(date, {
        byMinuteOfHour: [1],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('5,10', () => {
      const rule = buildRule(date, {
        byMinuteOfHour: [5, 10],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 0, 10, 59, 999) });
    });
  });

  context(dateTime(2019, 1, 1, 1, 6), date => {
    it('1', () => {
      const rule = buildRule(date, {
        byMinuteOfHour: [1],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 1, 59, 999) });
    });

    it('5,10', () => {
      const rule = buildRule(date, {
        byMinuteOfHour: [5, 10],
      });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 5, 59, 999) });
    });
  });
});

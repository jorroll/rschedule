import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { dateTime } from '../../test-utilities';
import { buildRuleFn } from '../test-utilities';
import { ByMinuteOfHourRule } from './rule';

const buildRule = buildRuleFn<
  typeof ByMinuteOfHourRule,
  { byMinuteOfHour: RuleOption.ByMinuteOfHour[] }
>(ByMinuteOfHourRule);

describe('ByMinuteOfHourRule', () => {
  let byMinuteOfHour: RuleOption.ByMinuteOfHour[];

  afterEach(() => {
    byMinuteOfHour = [];
  });

  context(dateTime(2019, 1, 1, 1, 1), date => {
    it('1', () => {
      byMinuteOfHour = [1];

      const rule = buildRule(date, { byMinuteOfHour });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('5,10', () => {
      byMinuteOfHour = [5, 10];

      const rule = buildRule(date, { byMinuteOfHour });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 5) });
    });
  });

  context(dateTime(2019, 1, 1, 1, 6), date => {
    it('1', () => {
      byMinuteOfHour = [1];

      const rule = buildRule(date, { byMinuteOfHour });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 2, 1) });
    });

    it('5,10', () => {
      byMinuteOfHour = [5, 10];

      const rule = buildRule(date, { byMinuteOfHour });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 1, 10) });
    });
  });
});

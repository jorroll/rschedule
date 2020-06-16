import { context } from '@local-tests/utilities';
import { InvalidDateTime, RuleOption, ValidDateTime } from '@rschedule/core';
import { dateTime } from '../../test-utilities';
import { buildRevRuleFn } from '../test-utilities';
import { RevByDayOfMonthRule } from './rev-rule';

const buildRule = buildRevRuleFn<
  typeof RevByDayOfMonthRule,
  { byDayOfMonth: RuleOption.ByDayOfMonth[]; byDayOfWeek?: RuleOption.ByDayOfWeek[] }
>(RevByDayOfMonthRule);

describe('RevByDayOfMonthRule', () => {
  let byDayOfMonth: RuleOption.ByDayOfMonth[];
  let byDayOfWeek: RuleOption.ByDayOfWeek[] | undefined;

  afterEach(() => {
    byDayOfMonth = [];
    byDayOfWeek = undefined;
  });

  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      byDayOfMonth = [1];

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(ValidDateTime);
      expect(result).toEqual({ date });
    });

    it('10,5', () => {
      byDayOfMonth = [10, 5];

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2018, 12, 10, 23, 59, 59, 999) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1', () => {
      byDayOfMonth = [1];

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 23, 59, 59, 999) });
    });

    it('10,5', () => {
      byDayOfMonth = [10, 5];

      const rule = buildRule(date, { byDayOfMonth });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 5, 23, 59, 59, 999) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('5 and SA', () => {
      byDayOfMonth = [5];
      byDayOfWeek = ['SA'];

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 5, 23, 59, 59, 999) });
    });

    it('10,5 and TU', () => {
      byDayOfMonth = [10, 5];
      byDayOfWeek = ['TU'];

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2018, 7, 10, 23, 59, 59, 999) });
    });
  });

  context(dateTime(2019, 1, 6), date => {
    it('1 and 1TU', () => {
      byDayOfMonth = [1];
      byDayOfWeek = [['TU', 1]];

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2019, 1, 1, 23, 59, 59, 999) });
    });

    it('10,5 and MO,2TH', () => {
      byDayOfMonth = [10, 5];
      byDayOfWeek = ['MO', ['TH', 2]];

      const rule = buildRule(date, { byDayOfMonth, byDayOfWeek });

      const result = rule.run(date);

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(2018, 12, 10, 23, 59, 59, 999) });
    });
  });
});

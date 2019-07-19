import { context } from '../../../../../../tests/utilities';
import { IByMonthOfYearRuleOptions } from './02-by-month-of-year.pipe';
import { RevByMonthOfYearPipe } from './rev-02-by-month-of-year.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof RevByMonthOfYearPipe, IByMonthOfYearRuleOptions>(
  RevByMonthOfYearPipe,
);

describe('RevByMonthOfYearPipe', () => {
  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byMonthOfYear: [1],
      });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byMonthOfYear: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2018, 10, 31, 23, 59, 59, 999),
      });
    });
  });

  context(dateTime(2019, 6, 10), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byMonthOfYear: [1],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 31, 23, 59, 59, 999),
      });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byMonthOfYear: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 5, 31, 23, 59, 59, 999),
      });
    });
  });
});

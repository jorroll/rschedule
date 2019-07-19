import { context } from '../../../../../../tests/utilities';
import { ByMonthOfYearPipe, IByMonthOfYearRuleOptions } from './02-by-month-of-year.pipe';
import { buildPipeFn, dateTime, fakePipe } from './test-utilities';

const buildPipe = buildPipeFn<typeof ByMonthOfYearPipe, IByMonthOfYearRuleOptions>(
  ByMonthOfYearPipe,
);

describe('ByMonthOfYearPipe', () => {
  context(dateTime(2019, 1, 1), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byMonthOfYear: [1],
      });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('5,10', () => {
      const pipe = buildPipe(date, {
        byMonthOfYear: [5, 10],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 5, 1),
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
        skipToDate: dateTime(2020, 1, 1),
      });
    });

    it('5,10', () => {
      const pipe = buildPipe(date, {
        byMonthOfYear: [5, 10],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 10, 1),
      });
    });
  });
});

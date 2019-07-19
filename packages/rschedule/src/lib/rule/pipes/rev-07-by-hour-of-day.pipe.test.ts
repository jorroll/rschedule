import { context } from '../../../../../../tests/utilities';
import { IByHourOfDayRuleOptions } from './07-by-hour-of-day.pipe';
import { RevByHourOfDayPipe } from './rev-07-by-hour-of-day.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof RevByHourOfDayPipe, IByHourOfDayRuleOptions>(
  RevByHourOfDayPipe,
);

describe('RevByHourOfDayPipe', () => {
  context(dateTime(2019, 1, 1, 1), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byHourOfDay: [1],
      });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byHourOfDay: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2018, 12, 31, 10, 59, 59, 999),
      });
    });
  });

  context(dateTime(2019, 1, 1, 6), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byHourOfDay: [1],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 59, 59, 999),
      });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byHourOfDay: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 5, 59, 59, 999),
      });
    });
  });
});

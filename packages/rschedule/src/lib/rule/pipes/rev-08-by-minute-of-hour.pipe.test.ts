import { context } from '../../../../../../tests/utilities';
import { IByMinuteOfHourRulePipe } from './08-by-minute-of-hour.pipe';
import { RevByMinuteOfHourPipe } from './rev-08-by-minute-of-hour.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof RevByMinuteOfHourPipe, IByMinuteOfHourRulePipe>(
  RevByMinuteOfHourPipe,
);

describe('RevByMinuteOfHourPipe', () => {
  context(dateTime(2019, 1, 1, 1, 1), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byMinuteOfHour: [1],
      });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byMinuteOfHour: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 0, 10, 59, 999),
      });
    });
  });

  context(dateTime(2019, 1, 1, 1, 6), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byMinuteOfHour: [1],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 59, 999),
      });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byMinuteOfHour: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 5, 59, 999),
      });
    });
  });
});

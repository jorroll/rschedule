import { context } from '../../../../../../tests/utilities';
import { IBySecondOfMinuteRuleOptions } from './09-by-second-of-minute.pipe';
import { RevBySecondOfMinutePipe } from './rev-09-by-second-of-minute.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof RevBySecondOfMinutePipe, IBySecondOfMinuteRuleOptions>(
  RevBySecondOfMinutePipe,
);

describe('RevBySecondOfMinutePipe', () => {
  context(dateTime(2019, 1, 1, 1, 1, 1), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        bySecondOfMinute: [1],
      });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        bySecondOfMinute: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 0, 10, 999),
      });
    });
  });

  context(dateTime(2019, 1, 1, 1, 1, 6), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        bySecondOfMinute: [1],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 1, 999),
      });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        bySecondOfMinute: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 5, 999),
      });
    });
  });
});

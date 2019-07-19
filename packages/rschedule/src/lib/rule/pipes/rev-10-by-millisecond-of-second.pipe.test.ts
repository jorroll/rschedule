import { context } from '../../../../../../tests/utilities';
import { IByMillisecondOfSecondRuleOptions } from './10-by-millisecond-of-second.pipe';
import { RevByMillisecondOfSecondPipe } from './rev-10-by-millisecond-of-second.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<
  typeof RevByMillisecondOfSecondPipe,
  IByMillisecondOfSecondRuleOptions
>(RevByMillisecondOfSecondPipe);

describe('RevByMillisecondOfSecondPipe', () => {
  context(dateTime(2019, 1, 1, 1, 1, 1, 1), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byMillisecondOfSecond: [1],
      });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byMillisecondOfSecond: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 0, 10),
      });
    });
  });

  context(dateTime(2019, 1, 1, 1, 1, 1, 6), date => {
    it('1', () => {
      const pipe = buildPipe(date, {
        byMillisecondOfSecond: [1],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 1, 1),
      });
    });

    it('10,5', () => {
      const pipe = buildPipe(date, {
        byMillisecondOfSecond: [10, 5],
      });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 1, 5),
      });
    });
  });
});

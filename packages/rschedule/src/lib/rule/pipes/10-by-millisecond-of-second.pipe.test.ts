import { context } from '../../../../../../tests/utilities';
import { RuleOption } from '../rule-options';
import {
  ByMillisecondOfSecondPipe,
  IByMillisecondOfSecondRuleOptions,
} from './10-by-millisecond-of-second.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof ByMillisecondOfSecondPipe, IByMillisecondOfSecondRuleOptions>(
  ByMillisecondOfSecondPipe,
);

describe('ByMillisecondOfSecondPipe', () => {
  let byMillisecondOfSecond: RuleOption.ByMillisecondOfSecond[];

  afterEach(() => {
    byMillisecondOfSecond = [];
  });

  context(dateTime(2019, 1, 1, 1, 1, 1, 1), date => {
    it('1', () => {
      byMillisecondOfSecond = [1];

      const pipe = buildPipe(date, { byMillisecondOfSecond });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('5,10', () => {
      byMillisecondOfSecond = [5, 10];

      const pipe = buildPipe(date, { byMillisecondOfSecond });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 1, 5),
      });
    });
  });

  context(dateTime(2019, 1, 1, 1, 1, 1, 6), date => {
    it('1', () => {
      byMillisecondOfSecond = [1];

      const pipe = buildPipe(date, { byMillisecondOfSecond });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 2, 1),
      });
    });

    it('5,10', () => {
      byMillisecondOfSecond = [5, 10];

      const pipe = buildPipe(date, { byMillisecondOfSecond });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 1, 10),
      });
    });
  });
});

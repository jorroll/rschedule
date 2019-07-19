import { context } from '../../../../../../tests/utilities';
import { DateTime } from '../../date-time';
import { RuleOption } from '../rule-options';
import { ResultPipe } from './11-result.pipe';
import { IPipeRule } from './interfaces';
import { dateTime, fakePipe } from './test-utilities';

function buildPipe(start: DateTime, end?: DateTime) {
  const pipe = new ResultPipe({ start, options: {} });
  pipe.firstPipe = fakePipe;
  return pipe;
}

describe('ResultPipe', () => {
  context(dateTime(2019, 1, 1), date => {
    it('', () => {
      const pipe = buildPipe(date);

      expect(pipe.run({ date })).toEqual(date);
    });

    it('end', () => {
      const pipe = buildPipe(date, dateTime(2019, 1, 10));

      expect(pipe.run({ date })).toEqual(date);
    });

    it('invalidDate', () => {
      const pipe = buildPipe(date);

      expect(pipe.run({ date, invalidDate: true })).toEqual({ date, invalidDate: true });
    });

    it('end,invalidDate', () => {
      const pipe = buildPipe(date, dateTime(2019, 1, 10));

      expect(pipe.run({ date, invalidDate: true })).toEqual({ date, invalidDate: true });
    });

    it('invalidDate,skipToDate', () => {
      const pipe = buildPipe(date);

      expect(pipe.run({ date, invalidDate: true, skipToDate: dateTime(2019, 2, 10) })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 2, 10),
      });
    });
  });
});

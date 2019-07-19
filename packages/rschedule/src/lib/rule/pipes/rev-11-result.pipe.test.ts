import { context } from '../../../../../../tests/utilities';
import { DateTime } from '../../date-time';
import { RevResultPipe } from './rev-11-result.pipe';
import { dateTime, fakePipe, isoString } from './test-utilities';

function buildPipe(start: DateTime, end?: DateTime) {
  const pipe = new RevResultPipe({ start, end, options: {} });
  pipe.firstPipe = fakePipe;
  return pipe;
}

describe('RevResultPipe', () => {
  describe(`${isoString(2019, 1, 1)} - ${isoString(2019, 2, 5)}`, () => {
    const start = dateTime(2019, 1, 1);
    const end = dateTime(2019, 2, 5);

    it('', () => {
      const pipe = buildPipe(start, end);

      expect(pipe.run({ date: end })).toEqual(end);
    });

    it('end future', () => {
      const pipe = buildPipe(start, end);

      expect(pipe.run({ date: dateTime(2018, 1, 1) })).toBe(null);
    });

    it('end past', () => {
      const pipe = buildPipe(start, end);

      expect(pipe.run({ date: end })).toEqual(end);
    });

    it('invalidDate', () => {
      const pipe = buildPipe(start, end);

      expect(pipe.run({ date: end, invalidDate: true })).toEqual({ date: end, invalidDate: true });
    });

    it('end,invalidDate', () => {
      const pipe = buildPipe(start, end);

      expect(pipe.run({ date: end, invalidDate: true })).toEqual({ date: end, invalidDate: true });
    });

    it('invalidDate,skipToDate', () => {
      const pipe = buildPipe(start, end);

      expect(pipe.run({ date: end, invalidDate: true, skipToDate: dateTime(2019, 1, 10) })).toEqual(
        {
          date: end,
          invalidDate: true,
          skipToDate: dateTime(2019, 1, 10),
        },
      );
    });
  });
});

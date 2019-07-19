import { context } from '../../../../../../tests/utilities';
import { RuleOption } from '../rule-options';
import { ByMinuteOfHourPipe, IByMinuteOfHourRulePipe } from './08-by-minute-of-hour.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof ByMinuteOfHourPipe, IByMinuteOfHourRulePipe>(
  ByMinuteOfHourPipe,
);

describe('ByMinuteOfHourPipe', () => {
  let byMinuteOfHour: RuleOption.ByMinuteOfHour[];

  afterEach(() => {
    byMinuteOfHour = [];
  });

  context(dateTime(2019, 1, 1, 1, 1), date => {
    it('1', () => {
      byMinuteOfHour = [1];

      const pipe = buildPipe(date, { byMinuteOfHour });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('5,10', () => {
      byMinuteOfHour = [5, 10];

      const pipe = buildPipe(date, { byMinuteOfHour });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 5),
      });
    });
  });

  context(dateTime(2019, 1, 1, 1, 6), date => {
    it('1', () => {
      byMinuteOfHour = [1];

      const pipe = buildPipe(date, { byMinuteOfHour });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 2, 1),
      });
    });

    it('5,10', () => {
      byMinuteOfHour = [5, 10];

      const pipe = buildPipe(date, { byMinuteOfHour });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 10),
      });
    });
  });
});

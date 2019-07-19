import { context } from '../../../../../../tests/utilities';
import { RuleOption } from '../rule-options';
import { ByHourOfDayPipe, IByHourOfDayRuleOptions } from './07-by-hour-of-day.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof ByHourOfDayPipe, IByHourOfDayRuleOptions>(ByHourOfDayPipe);

describe('ByHourOfDayPipe', () => {
  let byHourOfDay: RuleOption.ByHourOfDay[];

  afterEach(() => {
    byHourOfDay = [];
  });

  context(dateTime(2019, 1, 1, 1), date => {
    it('1', () => {
      byHourOfDay = [1];

      const pipe = buildPipe(date, { byHourOfDay });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('5,10', () => {
      byHourOfDay = [5, 10];

      const pipe = buildPipe(date, { byHourOfDay });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 5),
      });
    });
  });

  context(dateTime(2019, 1, 1, 6), date => {
    it('1', () => {
      byHourOfDay = [1];

      const pipe = buildPipe(date, { byHourOfDay });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 2, 1),
      });
    });

    it('5,10', () => {
      byHourOfDay = [5, 10];

      const pipe = buildPipe(date, { byHourOfDay });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 10),
      });
    });
  });
});

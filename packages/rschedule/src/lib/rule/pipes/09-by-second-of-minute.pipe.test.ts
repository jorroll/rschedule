import { context } from '../../../../../../tests/utilities';
import { RuleOption } from '../rule-options';
import { BySecondOfMinutePipe, IBySecondOfMinuteRuleOptions } from './09-by-second-of-minute.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof BySecondOfMinutePipe, IBySecondOfMinuteRuleOptions>(
  BySecondOfMinutePipe,
);

describe('BySecondOfMinutePipe', () => {
  let bySecondOfMinute: RuleOption.BySecondOfMinute[];

  afterEach(() => {
    bySecondOfMinute = [];
  });

  context(dateTime(2019, 1, 1, 1, 1, 1), date => {
    it('1', () => {
      bySecondOfMinute = [1];

      const pipe = buildPipe(date, { bySecondOfMinute });

      expect(pipe.run({ date })).toEqual({ date });
    });

    it('5,10', () => {
      bySecondOfMinute = [5, 10];

      const pipe = buildPipe(date, { bySecondOfMinute });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 5),
      });
    });
  });

  context(dateTime(2019, 1, 1, 1, 1, 6), date => {
    it('1', () => {
      bySecondOfMinute = [1];

      const pipe = buildPipe(date, { bySecondOfMinute });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 2, 1),
      });
    });

    it('5,10', () => {
      bySecondOfMinute = [5, 10];

      const pipe = buildPipe(date, { bySecondOfMinute });

      expect(pipe.run({ date })).toEqual({
        date,
        invalidDate: true,
        skipToDate: dateTime(2019, 1, 1, 1, 1, 10),
      });
    });
  });
});

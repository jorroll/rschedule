import { context, isoString, test } from '../../../../../../tests/utilities';
import { freqToGranularity } from '../../basic-utilities';
import { DateTime } from '../../date-time';
import { RuleOption } from '../rule-options';
import { IFrequencyRuleOptions } from './01-frequency.pipe';
import { RevFrequencyPipe } from './rev-01-frequency.pipe';
import { buildPipeFn, dateTime, fakePipe } from './test-utilities';

function buildPipe(end: DateTime, options: IFrequencyRuleOptions) {
  const pipe = new RevFrequencyPipe({ start: end, end, options });
  pipe.nextPipe = fakePipe;
  return pipe;
}

describe('RevFrequencyPipe', () => {
  context('YEARLY', (frequency: 'YEARLY') => {
    context('MO', (weekStart: RuleOption.WeekStart) => {
      context(1, interval => {
        context(dateTime(2019, 1, 1, 2, 3, 4, 5), date => {
          let pipe: RevFrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as RevFrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.subtract(1, 'millisecond') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2020, 2, 10, 2, 3, 4, 5),
              }),
            ).toEqual({ date: dateTime(2020, 2, 10, 2, 3, 4, 5) });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2018, 2, 10, 2, 3, 4, 5),
              }),
            ).toEqual({ date: dateTime(2018, 2, 10, 2, 3, 4, 5) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.subtract(1, 'year').subtract(10, 'day') })).toEqual({
              date: date.granularity('year').subtract(1, 'millisecond'),
            });
          });
        });
      });

      context(3, interval => {
        context(dateTime(2019, 1, 1), date => {
          let pipe: RevFrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as RevFrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date: date.add(1, 'millisecond') })).toEqual({ date });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2018, 2, 10),
              }),
            ).toEqual({ date: date.subtract(interval, 'year').endGranularity('year') });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2018, 2, 10),
              }),
            ).toEqual({ date: date.subtract(interval, 'year').endGranularity('year') });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date })).toEqual({
              date: date.subtract(interval, 'year').endGranularity('year'),
            });
          });
        });
      });

      context(131, interval => {
        context(dateTime(2019, 1, 1), date => {
          let pipe: RevFrequencyPipe;
          let expectedDate: DateTime;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as RevFrequencyPipe;

            expectedDate = date.subtract(interval, 'year').endGranularity('year');
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date: date.add(1, 'millisecond') })).toEqual({ date });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2018, 2, 10),
              }),
            ).toEqual({ date: expectedDate });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2018, 2, 10),
              }),
            ).toEqual({ date: expectedDate });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: expectedDate });
          });
        });
      });
    });
  });

  context('MONTHLY' as RuleOption.Frequency, frequency => {
    it('', () => {
      const pipe = buildPipe(dateTime(1997, 9, 2, 9), {
        frequency,
        interval: 1,
        weekStart: 'MO',
      });

      expect(
        pipe.run({
          date: dateTime(1998, 2, 26, 23, 59, 59, 999),
          skipToDate: dateTime(1998, 1, 31, 23, 59, 59, 999),
        }),
      ).toEqual({ date: dateTime(1998, 1, 31, 23, 59, 59, 999) });
    });
  });

  context('WEEKLY', (frequency: 'WEEKLY') => {
    context('MO', (weekStart: RuleOption.WeekStart) => {
      context(1, interval => {
        context(dateTime(2019, 1, 1), date => {
          let pipe: RevFrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as RevFrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.subtract(1, 'millisecond') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2018, 2, 10),
              }),
            ).toEqual({ date: dateTime(2018, 2, 10) });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2017, 2, 10),
              }),
            ).toEqual({ date: dateTime(2017, 2, 10) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.subtract(2, 'day') })).toEqual({
              date: date.granularity('week', { weekStart }).subtract(1, 'millisecond'),
            });
          });
        });
      });

      context(3, interval => {
        context(dateTime(2019, 1, 1), date => {
          let pipe: RevFrequencyPipe;
          let expectedDate: DateTime;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as RevFrequencyPipe;

            expectedDate = date.endGranularity('week', { weekStart }).subtract(interval, 'week');
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.subtract(1, 'millisecond') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2018, 12, 30),
              }),
            ).toEqual({ date: expectedDate });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2018, 12, 25),
              }),
            ).toEqual({ date: expectedDate });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: dateTime(2018, 12, 30) })).toEqual({
              date: expectedDate,
            });
          });
        });
      });

      context(131, interval => {
        context(dateTime(2019, 1, 1), date => {
          let pipe: RevFrequencyPipe;
          let expectedDate: DateTime;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as RevFrequencyPipe;

            expectedDate = date.endGranularity('week', { weekStart }).subtract(interval, 'week');
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.subtract(1, 'millisecond') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2018, 12, 25),
              }),
            ).toEqual({ date: expectedDate });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2017, 12, 25),
              }),
            ).toEqual({ date: expectedDate });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: dateTime(2018, 12, 25) })).toEqual({
              date: expectedDate,
            });
          });
        });
      });
    });
  });
});

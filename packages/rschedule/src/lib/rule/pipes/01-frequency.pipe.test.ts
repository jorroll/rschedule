import { context, isoString, test } from '../../../../../../tests/utilities';
import { freqToGranularity } from '../../basic-utilities';
import { RuleOption } from '../rule-options';
import {
  FrequencyPipe,
  IFrequencyRuleOptions,
  intervalDifferenceBetweenDates,
} from './01-frequency.pipe';
import { buildPipeFn, dateTime } from './test-utilities';

const buildPipe = buildPipeFn<typeof FrequencyPipe, IFrequencyRuleOptions>(FrequencyPipe);

describe('FrequencyPipe', () => {
  context('YEARLY', (frequency: 'YEARLY') => {
    context('MO', (weekStart: RuleOption.WeekStart) => {
      context(1, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 10)} - ${isoString(2019, 12, 31)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2019, 12, 31);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });
            expect(difference).toBe(0);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2020, 1, 1)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2020, 1, 1);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });
            expect(difference).toBe(1);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2051, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2051, 2, 10);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });
            expect(difference).toBe(32);
          });
        });

        context(dateTime(2019, 1, 1, 2, 3, 4, 5), date => {
          let pipe: FrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as FrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.add(1, 'second') });
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
                skipToDate: dateTime(2019, 2, 10, 2, 3, 4, 5),
              }),
            ).toEqual({ date: dateTime(2019, 2, 10, 2, 3, 4, 5) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.add(1, 'year').add(10, 'day') })).toEqual({
              date: date.granularity('year').add(1, 'year'),
            });
          });
        });
      });

      context(3, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 10)} - ${isoString(2019, 12, 31)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2019, 12, 31);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });
            expect(difference).toBe(0);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2020, 1, 1)}`, () => {
            const first = dateTime(2019, 1, 10);

            const second = dateTime(2020, 1, 1);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(3);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2051, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2051, 2, 10);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(33);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let pipe: FrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as FrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.add(1, 'second') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2020, 2, 10),
              }),
            ).toEqual({ date: dateTime(2022, 1, 1) });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2019, 2, 10),
              }),
            ).toEqual({ date: dateTime(2019, 2, 10) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.add(1, 'year').add(10, 'day') })).toEqual({
              date: dateTime(2022, 1, 1),
            });
          });
        });
      });

      context(131, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 10)} - ${isoString(2019, 12, 31)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2019, 12, 31);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(0);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2020, 1, 1)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2020, 1, 1);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(131);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2051, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2051, 2, 10);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(131);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let pipe: FrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as FrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.add(1, 'second') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2020, 2, 10),
              }),
            ).toEqual({ date: dateTime(2150, 1, 1) });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2019, 2, 10),
              }),
            ).toEqual({ date: dateTime(2019, 2, 10) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.add(1, 'year').add(10, 'day') })).toEqual({
              date: dateTime(2150, 1, 1),
            });
          });
        });
      });
    });
  });

  context('WEEKLY', (frequency: 'WEEKLY') => {
    context('MO', (weekStart: RuleOption.WeekStart) => {
      context(1, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 10)} - ${isoString(2019, 12, 31)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2019, 12, 31);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(51);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2020, 1, 6)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2020, 1, 6);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(52);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2051, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2051, 2, 10);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(1674);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let pipe: FrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as FrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.add(1, 'second') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2020, 2, 10),
              }),
            ).toEqual({ date: dateTime(2020, 2, 10) });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2019, 2, 10),
              }),
            ).toEqual({ date: dateTime(2019, 2, 10) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.add(1, 'year').add(10, 'day') })).toEqual({
              date: date.add(6, 'day'),
            });
          });
        });
      });

      context(3, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 10)} - ${isoString(2019, 12, 31)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2019, 12, 31);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(51);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2020, 1, 1)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2020, 1, 6);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(54);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2051, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2051, 2, 10);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(1674);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let pipe: FrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as FrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.add(1, 'second') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2020, 2, 10),
              }),
            ).toEqual({ date: dateTime(2020, 2, 24) });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2019, 2, 10),
              }),
            ).toEqual({ date: dateTime(2019, 2, 11) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.add(1, 'year').add(10, 'day') })).toEqual({
              date: date.granularity('week', { weekStart }).add(3, 'week'),
            });
          });
        });
      });

      context(131, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 10)} - ${isoString(2019, 12, 31)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2019, 12, 31);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(131);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2020, 1, 1)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2020, 1, 1);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(131);
          });

          it(`${isoString(2019, 1, 10)} - ${isoString(2051, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 10);
            const second = dateTime(2051, 2, 10);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
            });

            expect(difference).toBe(1703);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let pipe: FrequencyPipe;

          beforeEach(() => {
            pipe = buildPipe(date, {
              frequency,
              interval,
              weekStart,
            }) as FrequencyPipe;
          });

          it('nextDateIsWithinInterval', () => {
            expect(pipe.run({ date })).toEqual({ date: date.add(1, 'second') });
          });

          it('skipToDate', () => {
            expect(
              pipe.run({
                date,
                skipToDate: dateTime(2020, 2, 10),
              }),
            ).toEqual({ date: dateTime(2021, 7, 5) });
          });

          it('skipToDate,invalidDate', () => {
            expect(
              pipe.run({
                date,
                invalidDate: true,
                skipToDate: dateTime(2019, 2, 10),
              }),
            ).toEqual({ date: dateTime(2021, 7, 5) });
          });

          it('nextDateIsOutsideInterval', () => {
            expect(pipe.run({ date: date.add(1, 'year').add(10, 'day') })).toEqual({
              date: date.granularity('week', { weekStart }).add(131, 'week'),
            });
          });
        });
      });
    });
  });
});

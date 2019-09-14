import { context, isoString } from '@local-tests/utilities';
import {
  DateTime,
  freqToGranularity,
  InvalidDateTime,
  RuleOption,
  ValidDateTime,
} from '@rschedule/core';
import { dateTime } from '../test-utilities';
import { FrequencyRule, IFrequencyRuleOptions, intervalDifferenceBetweenDates } from './rule';

function buildRule(start: DateTime, options: IFrequencyRuleOptions & { start: DateTime }) {
  return new FrequencyRule(
    {
      start,
      reverse: false,
      options: {
        start,
        frequency: 'YEARLY',
        interval: 1,
        weekStart: 'MO' as RuleOption.WeekStart,
        ...options,
      } as any,
    },
    start,
  );
}

describe('FrequencyRule', () => {
  context('YEARLY' as 'YEARLY', frequency => {
    context('MO' as 'MO', weekStart => {
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
              direction: 'after',
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
              direction: 'after',
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
              direction: 'after',
            });
            expect(difference).toBe(32);
          });
        });

        context(dateTime(2019, 1, 1, 2, 3, 4, 5), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(
              new InvalidDateTime(dateTime(2020, 2, 10, 2, 3, 4, 5)),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2020, 2, 10, 2, 3, 4, 5) });
          });

          it('skipToDate2', () => {
            const result = logic.validateDate(
              new InvalidDateTime(dateTime(2019, 2, 10, 2, 3, 4, 5)),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 2, 10, 2, 3, 4, 5) });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(
              new ValidDateTime(date.add(1, 'year').add(10, 'day')),
            );

            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: date.add(1, 'year').add(10, 'day') });
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
              direction: 'after',
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
              direction: 'after',
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
              direction: 'after',
            });

            expect(difference).toBe(33);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2020, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2022, 1, 1) });
          });

          it('skipToDate2', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2019, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 2, 10) });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(
              new ValidDateTime(date.add(1, 'year').add(10, 'day')),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2022, 1, 1) });
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
              direction: 'after',
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
              direction: 'after',
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
              direction: 'after',
            });

            expect(difference).toBe(131);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2020, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2150, 1, 1) });
          });

          it('skipToDate2', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2019, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 2, 10) });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(
              new ValidDateTime(date.add(1, 'year').add(10, 'day')),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2150, 1, 1) });
          });
        });
      });
    });
  });

  context('MONTHLY', frequency => {
    it('intervalDifferenceBetweenDates()', () => {
      const diff = intervalDifferenceBetweenDates({
        first: dateTime(1998, 2, 26, 23, 59, 59, 999),
        second: dateTime(1998, 1, 31, 23, 59, 59, 999),
        unit: freqToGranularity(frequency),
        interval: 1,
        weekStart: 'MO',
        direction: 'after',
      });

      expect(diff).toBe(-1);
    });
  });

  context('WEEKLY' as 'WEEKLY', frequency => {
    context('MO' as 'MO', weekStart => {
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
              direction: 'after',
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
              direction: 'after',
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
              direction: 'after',
            });

            expect(difference).toBe(1674);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2020, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2020, 2, 10) });
          });

          it('skipToDate2', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2019, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 2, 10) });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(
              new ValidDateTime(date.add(1, 'year').add(10, 'day')),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: date.add(1, 'year').add(10, 'day') });
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
              direction: 'after',
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
              direction: 'after',
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
              direction: 'after',
            });

            expect(difference).toBe(1674);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2020, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2020, 2, 24) });
          });

          it('skipToDate2', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2019, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 2, 11) });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date.add(4, 'week')));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({
              date: date.granularity('week', { weekStart }).add(6, 'week'),
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
              direction: 'after',
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
              direction: 'after',
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
              direction: 'after',
            });

            expect(difference).toBe(1703);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2019, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2021, 7, 5) });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(
              new ValidDateTime(date.add(1, 'year').add(10, 'day')),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({
              date: date.granularity('week', { weekStart }).add(131, 'week'),
            });
          });
        });
      });
    });
  });

  context<RuleOption.Frequency>('MILLISECONDLY', frequency => {
    context<RuleOption.WeekStart>('MO', weekStart => {
      context(1, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 1, 0, 0, 0, 1)} - ${isoString(2019, 1, 1, 0, 0, 0, 50)}`, () => {
            const first = dateTime(2019, 1, 1, 0, 0, 0, 1);
            const second = dateTime(2019, 1, 1, 0, 0, 0, 50);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'after',
            });
            expect(difference).toBe(49);
          });

          it(`${isoString(2019, 1, 1, 0, 0, 0, 1)} - ${isoString(2019, 1, 1, 0, 0, 1, 50)}`, () => {
            const first = dateTime(2019, 1, 1, 0, 0, 0, 1);
            const second = dateTime(2019, 1, 1, 0, 0, 1, 50);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'after',
            });
            expect(difference).toBe(1049);
          });
        });

        context(dateTime(2019, 1, 1, 0, 0, 0, 1), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(
              new InvalidDateTime(dateTime(2019, 1, 1, 0, 0, 0, 50)),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 1, 1, 0, 0, 0, 50) });
          });
        });
      });

      context(3, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 1, 0, 0, 0, 1)} - ${isoString(2019, 1, 1, 0, 0, 0, 50)}`, () => {
            const first = dateTime(2019, 1, 1, 0, 0, 0, 1);
            const second = dateTime(2019, 1, 1, 0, 0, 0, 50);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'after',
            });
            expect(difference).toBe(51);
          });

          it(`${isoString(2019, 1, 1, 0, 0, 0, 1)} - ${isoString(2019, 1, 1, 0, 0, 1, 50)}`, () => {
            const first = dateTime(2019, 1, 1, 0, 0, 0, 1);
            const second = dateTime(2019, 1, 1, 0, 0, 1, 50);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'after',
            });
            expect(difference).toBe(1050);
          });
        });

        context(dateTime(2019, 1, 1, 0, 0, 0, 1), date => {
          let logic: FrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(
              new InvalidDateTime(dateTime(2019, 1, 1, 0, 0, 0, 51)),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 1, 1, 0, 0, 0, 52) });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(new ValidDateTime(dateTime(2019, 1, 1, 0, 0, 0, 2)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2019, 1, 1, 0, 0, 0, 4) });
          });
        });
      });
    });
  });
});

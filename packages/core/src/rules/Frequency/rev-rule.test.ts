import { context } from '@local-tests/utilities';
import {
  DateTime,
  freqToGranularity,
  InvalidDateTime,
  RuleOption,
  ValidDateTime,
} from '@rschedule/core';
import { dateTime, isoString } from '../test-utilities';
import { RevFrequencyRule } from './rev-rule';
import { IFrequencyRuleOptions, intervalDifferenceBetweenDates } from './rule';

function buildRule(start: DateTime, options: IFrequencyRuleOptions & { start: DateTime }) {
  return new RevFrequencyRule(
    {
      start,
      end: start,
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

describe('RevFrequencyRule', () => {
  context('YEARLY' as 'YEARLY', frequency => {
    context('MO' as 'MO', weekStart => {
      context(1, interval => {
        context(dateTime(2019, 1, 1, 2, 3, 4, 5), date => {
          let logic: RevFrequencyRule;

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
            const date = dateTime(2020, 2, 10, 2, 3, 4, 5);
            const result = logic.validateDate(new InvalidDateTime(date));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate,invalidDate', () => {
            const date = dateTime(2018, 2, 10, 2, 3, 4, 5);
            const result = logic.validateDate(new InvalidDateTime(date));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(
              new ValidDateTime(date.subtract(1, 'year').subtract(10, 'day')),
            );
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({
              date: date.subtract(1, 'year').subtract(10, 'day'),
            });
          });
        });
      });

      context(3, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2019, 1, 1)} - ${isoString(2018, 2, 1)}`, () => {
            const first = dateTime(2019, 1, 1);
            const second = dateTime(2018, 2, 1);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'before',
            });

            expect(difference).toBe(-3);
          });

          it(`${isoString(2019, 1, 1)} - ${isoString(1951, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 1);
            const second = dateTime(1951, 2, 10);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'before',
            });
            expect(difference).toBe(-69);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let logic: RevFrequencyRule;

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
            const result = logic.validateDate(new InvalidDateTime(dateTime(2018, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({
              date: date.subtract(interval, 'year').endGranularity('year'),
            });
          });

          it('skipToDate,invalidDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2018, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({
              date: date.subtract(interval, 'year').endGranularity('year'),
            });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date.subtract(2, 'day')));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({
              date: date.subtract(interval, 'year').endGranularity('year'),
            });
          });
        });
      });

      context(131, interval => {
        context(dateTime(2019, 1, 1), date => {
          let expectedDate: DateTime;
          let logic: RevFrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });

            expectedDate = date.subtract(interval, 'year').endGranularity('year');
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2018, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date.subtract(2, 'day')));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });
        });
      });
    });
  });

  context('MONTHLY' as 'MONTHLY', frequency => {
    it('', () => {
      const logic = buildRule(dateTime(1997, 9, 2, 9), {
        start: dateTime(1997, 9, 2, 9),
        frequency,
        interval: 1,
        weekStart: 'MO',
      });

      const result = logic.validateDate(
        new InvalidDateTime(dateTime(1998, 1, 31, 23, 59, 59, 999)),
      );

      expect(result).toBeInstanceOf(InvalidDateTime);
      expect(result).toEqual({ date: dateTime(1998, 1, 31, 23, 59, 59, 999) });
    });
  });

  context('WEEKLY' as 'WEEKLY', frequency => {
    context('MO' as 'MO', weekStart => {
      context(1, interval => {
        context(dateTime(2019, 1, 1), date => {
          let logic: RevFrequencyRule;

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
            const result = logic.validateDate(new InvalidDateTime(dateTime(2018, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2018, 2, 10) });
          });

          it('skipToDate,invalidDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2017, 2, 10)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: dateTime(2017, 2, 10) });
          });

          it('skipToDate,ValidDateTime', () => {
            const result = logic.validateDate(new ValidDateTime(date.subtract(2, 'day')));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({
              date: date.subtract(2, 'day'),
            });
          });
        });
      });

      context(3, interval => {
        describe('intervalDifferenceBetweenDates()', () => {
          it(`${isoString(2018, 12, 31)} - ${isoString(2019, 1, 1)}`, () => {
            const first = dateTime(2018, 12, 31);
            const second = dateTime(2019, 1, 1);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'before',
            });

            expect(difference).toBe(0);
          });

          it(`${isoString(2018, 12, 31)} - ${isoString(2018, 12, 30)}`, () => {
            const first = dateTime(2018, 12, 31);
            const second = dateTime(2018, 12, 30);

            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'before',
            });

            expect(difference).toBe(-3);
          });

          it(`${isoString(2019, 1, 1)} - ${isoString(1951, 2, 10)}`, () => {
            const first = dateTime(2019, 1, 1);
            const second = dateTime(2017, 11, 20);
            const difference = intervalDifferenceBetweenDates({
              first,
              second,
              unit: freqToGranularity(frequency),
              interval,
              weekStart,
              direction: 'before',
            });
            expect(difference).toBe(-60);
          });
        });

        context(dateTime(2019, 1, 1), date => {
          let expectedDate: DateTime;
          let logic: RevFrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });

            expectedDate = date.endGranularity('week', { weekStart }).subtract(interval, 'week');
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2018, 12, 30)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });

          it('skipToDate,invalidDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2018, 12, 25)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(new ValidDateTime(dateTime(2018, 12, 30)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });
        });
      });

      context(131, interval => {
        context(dateTime(2019, 1, 1), date => {
          let expectedDate: DateTime;
          let logic: RevFrequencyRule;

          beforeEach(() => {
            logic = buildRule(date, {
              start: date,
              frequency,
              interval,
              weekStart,
            });

            expectedDate = date.endGranularity('week', { weekStart }).subtract(interval, 'week');
          });

          it('nextDateIsWithinInterval', () => {
            const result = logic.validateDate(new ValidDateTime(date));
            expect(result).toBeInstanceOf(ValidDateTime);
            expect(result).toEqual({ date });
          });

          it('skipToDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2018, 12, 25)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });

          it('skipToDate,invalidDate', () => {
            const result = logic.validateDate(new InvalidDateTime(dateTime(2017, 12, 25)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });

          it('nextDateIsOutsideInterval', () => {
            const result = logic.validateDate(new ValidDateTime(dateTime(2018, 12, 25)));
            expect(result).toBeInstanceOf(InvalidDateTime);
            expect(result).toEqual({ date: expectedDate });
          });
        });
      });
    });
  });
});

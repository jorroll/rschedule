/**
 * Credit:
 * The vast majority of these tests were taken from [rrulejs](https://github.com/jakubroztocil/rrule),
 * which itself credits the python library `dateutil.rrule` for first creating the tests.
 */

import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-date-adapter';
import {
  DateAdapterConstructor,
  IDateAdapter,
  IDateAdapterConstructor,
  RRule,
  Utils,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import {
  context,
  dateAdapter,
  DatetimeFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  standardDatetimeFn,
  TIMEZONES,
} from './utilities';

function testRecurring(
  testName: string,
  rule: RRule<DateAdapterConstructor>,
  expectedDates: Array<IDateAdapter<any>>,
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      const expected = expectedDates.map(date => date.toISOString());
      const actual = rule
        .occurrences()
        .toArray()!
        .map(date => date.toISOString());

      expect(actual).toEqual(expected);
    });

    it('allows skipping iterations', () => {
      if (expectedDates.length < 3) {
        return;
      }

      const iterable = rule.occurrences();

      let date = iterable.next().value;

      expect(date.toISOString()).toBe(expectedDates[0].toISOString());

      date = iterable.next({ skipToDate: expectedDates[2] }).value;

      expect(date && date.toISOString()).toBe(expectedDates[2].toISOString());
    });

    it('allows skipping iterations in reverse', () => {
      if (expectedDates.length !== 3) {
        return;
      }

      const iterable = rule.occurrences({ reverse: true });

      let date = iterable.next().value;

      expect(date.toISOString()).toBe(expectedDates[2].toISOString());

      date = iterable.next({ skipToDate: expectedDates[0] }).value;

      expect(date.toISOString()).toBe(expectedDates[0].toISOString());
    });

    /**
     * Problem with start & count: because occurrence
     * counting begins when start is, count also begins
     * when the start is. The effect of this is that when a rule
     * has a count of 3, say, you'll always take three occurrences,
     * no matter where you start from. Intuitively, you'd probably
     * only want to take the first 3 occurrences from the dtstart
     */

    describe('w/args', () => {
      it('END', () => {
        let newExpectedDates: Array<IDateAdapter<any>>;
        let end: IDateAdapter<any> | undefined;

        if (expectedDates.length > 2) {
          end = expectedDates[1];
          newExpectedDates = expectedDates.slice(0, 2);
        } else if (expectedDates.length > 1) {
          end = expectedDates[0];
          newExpectedDates = [expectedDates[0]];
        } else {
          newExpectedDates = expectedDates.slice();
        }

        const expected = newExpectedDates.map(date => date.toISOString());
        const actual = rule
          .occurrences({ end: end && end.date })
          .toArray()!
          .map(date => date.toISOString());

        expect(actual).toEqual(expected);
      });

      it('REVERSE', () => {
        if (expectedDates.length === 0) {
          // can't generate a start date in this scenerio so simply return
          return;
        }

        const newExpectedDates = expectedDates.slice().reverse();

        const expected = newExpectedDates.map(date => date.toISOString());
        const actual = rule
          .occurrences({ start: newExpectedDates[0].date, reverse: true })
          .toArray()!
          .map(date => date.toISOString());

        expect(actual).toEqual(expected);
      });
    });

    describe('#occursOn()', () => {
      expectedDates.forEach(adapter => {
        describe(adapter.toISOString(), () => {
          it('date', () =>
            expect(rule.occursOn({ date: adapter.date })).toBeTruthy());

          describe('weekday', () => {
            it('no options', () =>
              expect(
                rule.occursOn({ weekday: adapter.get('weekday') }),
              ).toBeTruthy());
            it('excludeDates', () =>
              expect(
                rule.occursOn({
                  weekday: adapter.get('weekday'),
                  excludeDates: expectedDates.map(adapter => adapter.date),
                }),
              ).toBeFalsy());
          });
        });
      });

      if (expectedDates.length > 0) {
        const first = expectedDates[0];
        const last = expectedDates[expectedDates.length - 1];

        describe(first.toISOString(), () => {
          describe('weekday', () => {
            it('before first including', () =>
              expect(
                rule.occursOn({
                  weekday: first.get('weekday'),
                  before: first.date,
                }),
              ).toBeTruthy());
            it('before first excluding', () =>
              expect(
                rule.occursOn({
                  weekday: first.get('weekday'),
                  before: first.date,
                  excludeEnds: true,
                }),
              ).toBeFalsy());
            it('after first including', () =>
              expect(
                rule.occursOn({
                  weekday: first.get('weekday'),
                  after: first.date,
                }),
              ).toBeTruthy());
            // don't think there's a generic way to know what the answer should be (e.g. take a `MINUTELY` rule of count 3 which only takes place
            // on one day, if you exclude that day it doesn't happen).
            // it('after first excluding', () => expect(rule.occursOn({weekday: first.get('weekday'), after: first, excludeEnds: true})).toBeTruthy())
          });
        });

        describe(last.toISOString(), () => {
          describe('weekday', () => {
            it('before last including', () =>
              expect(
                rule.occursOn({
                  weekday: last.get('weekday'),
                  before: last.date,
                }),
              ).toBeTruthy());
            // don't think there's a generic way to know what the answer should be (e.g. take a `MINUTELY` rule of count 3 which only takes place
            // on one day, if you exclude that day it doesn't happen).
            // it('before last excluding', () => expect(rule.occursOn({weekday: last.get('weekday'), before: last, excludeEnds: true})).toBeTruthy())
            it('after last including', () =>
              expect(
                rule.occursOn({
                  weekday: last.get('weekday'),
                  after: last.date,
                }),
              ).toBeTruthy());
            it('after last excluding', () =>
              expect(
                rule.occursOn({
                  weekday: last.get('weekday'),
                  after: last.date,
                  excludeEnds: true,
                }),
              ).toBeFalsy());
          });
        });
      }
    });
  });
}

function testRecurringBetween(
  testName: string,
  rule: RRule<DateAdapterConstructor>,
  start: IDateAdapter<any>,
  end: IDateAdapter<any>,
  inclusive: boolean,
  expectedDates: Array<IDateAdapter<any>>,
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrences = rule
        .occurrences({ start: start.date, end: end.date })
        .toArray()!;

      if (!inclusive) {
        occurrences = occurrences.filter(
          date => !(date.isEqual(start) || date.isEqual(end)),
        );
      }

      expect(occurrences.map(d => d.toISOString())).toEqual(
        expectedDates.map(d => d.toISOString()),
      );
    });
  });
}

function testPreviousOccurrence(
  testName: string,
  rule: RRule<DateAdapterConstructor>,
  start: IDateAdapter<any>,
  inclusive: boolean,
  expectedDate: IDateAdapter<any>,
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrence: IDateAdapter<any>;

      for (const day of rule.occurrences({
        start: start.date,
        reverse: true,
      })) {
        if (!inclusive && day.isEqual(start)) {
          continue;
        }
        occurrence = day;
        break;
      }

      expect(occurrence!.toISOString()).toEqual(expectedDate.toISOString());
    });
  });
}

function testNextOccurrence(
  testName: string,
  rule: RRule<DateAdapterConstructor>,
  start: IDateAdapter<any>,
  inclusive: boolean,
  expectedDate: IDateAdapter<any>,
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrence: IDateAdapter<any>;

      for (const day of rule.occurrences({ start: start.date })) {
        if (!inclusive && day.isEqual(start)) {
          continue;
        }
        occurrence = day;
        break;
      }

      expect(occurrence!.toISOString()).toEqual(expectedDate.toISOString());
    });
  });
}

const DATE_ADAPTERS = [
  [StandardDateAdapter, standardDatetimeFn],
  [MomentDateAdapter, momentDatetimeFn],
  [MomentTZDateAdapter, momentTZDatetimeFn],
  [LuxonDateAdapter, luxonDatetimeFn],
] as [
  [typeof StandardDateAdapter, DatetimeFn<Date>],
  [typeof MomentDateAdapter, DatetimeFn<MomentST>],
  [typeof MomentTZDateAdapter, DatetimeFn<MomentTZ>],
  [typeof LuxonDateAdapter, DatetimeFn<DateTime>]
];

DATE_ADAPTERS.forEach(dateAdapterSet => {
  environment(dateAdapterSet, dateAdapterSet => {
    const [DateAdapter, datetime] = dateAdapterSet as [
      IDateAdapterConstructor<DateAdapterConstructor>,
      DatetimeFn<any>
    ];

    const zones = !DateAdapter.hasTimezoneSupport
      ? [undefined, 'UTC']
      : TIMEZONES;

    zones.forEach(zone => {
      // function to create new dateAdapter instances
      const dateAdapter: DatetimeFn<IDateAdapter<any>> = (
        ...args: Array<number | string | undefined>
      ) => {
        let timezone: string | undefined;

        if (typeof args[args.length - 1] === 'string') {
          timezone = args[args.length - 1] as string;
        } else if (zone !== undefined) {
          args.push(zone);
          timezone = zone;
        }

        // @ts-ignore
        return new DateAdapter(datetime(...args), { timezone });
      };

      const parse = (str: string) => {
        const parts: Array<number | string> = str
          .match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)!
          .map(part => Number(part));

        parts.shift();

        // @ts-ignore
        return dateAdapter(...parts);
      };

      context(zone, zone => {
        describe('specific bugs', () => {
          if (DateAdapter.hasTimezoneSupport) {
            it('occursOn() arg is in a different timezone from rule start', () => {
              const start = dateAdapter(2018, 8, 16, 0, 0, 0, 0, zone);

              const rule = new RRule(
                {
                  frequency: 'WEEKLY',
                  start,
                  byDayOfWeek: ['TH'],
                },
                { dateAdapter: DateAdapter },
              );

              const date = start.clone().set('timezone', 'America/Los_Angeles');
              const first = rule.occurrences({ take: 1 }).toArray()![0];

              expect(start.valueOf()).toBe(date.valueOf());
              expect(first.valueOf()).toBe(start.valueOf());

              expect(rule.occursOn({ date: date.date })).toBeTruthy();
            });
          }
        });

        testPreviousOccurrence(
          'testBefore',
          new RRule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 5, 9, 0, 0, 0, zone),
          false,
          dateAdapter(1997, 9, 4, 9, 0, 0, 0, zone),
        );

        testPreviousOccurrence(
          'testBeforeInc',
          new RRule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 5, 9, 0, 0, 0, zone),
          true,
          dateAdapter(1997, 9, 5, 9, 0, 0, 0, zone),
        );

        testNextOccurrence(
          'testAfter',
          new RRule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 4, 9, 0, 0, 0, zone),
          false,
          dateAdapter(1997, 9, 5, 9, 0, 0, 0, zone),
        );

        testNextOccurrence(
          'testAfterInc',
          new RRule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 4, 9, 0, 0, 0, zone),
          true,
          dateAdapter(1997, 9, 4, 9, 0, 0, 0, zone),
        );

        testRecurringBetween(
          'testBetween',
          new RRule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
          dateAdapter(1997, 9, 6, 9, 0, 0, 0, zone),
          false,
          [
            dateAdapter(1997, 9, 3, 9, 0, 0, 0, zone),
            dateAdapter(1997, 9, 4, 9, 0, 0, 0, zone),
            dateAdapter(1997, 9, 5, 9, 0, 0, 0, zone),
          ],
        );

        testRecurringBetween(
          'testBetweenInc',
          new RRule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
          dateAdapter(1997, 9, 6, 9, 0, 0, 0, zone),
          true,
          [
            dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
            dateAdapter(1997, 9, 3, 9, 0, 0, 0, zone),
            dateAdapter(1997, 9, 4, 9, 0, 0, 0, zone),
            dateAdapter(1997, 9, 5, 9, 0, 0, 0, zone),
            dateAdapter(1997, 9, 6, 9, 0, 0, 0, zone),
          ],
        );

        describe('YEARLY', () => {
          testRecurring(
            'testYearly',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                start: dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 0, 0, zone),
              dateAdapter(1998, 9, 2, 9, 0, 0, 0, zone),
              dateAdapter(1999, 9, 2, 9, 0, 0, 0, zone),
            ],
          );

          testRecurring(
            'testYearlyInterval',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                interval: 2,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1999, 9, 2, 9, 0),
              dateAdapter(2001, 9, 2, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyIntervalLarge',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                interval: 100,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(2097, 9, 2, 9, 0),
              dateAdapter(2197, 9, 2, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonth',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 2, 9, 0),
              dateAdapter(1998, 3, 2, 9, 0),
              dateAdapter(1999, 1, 2, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonthDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byDayOfMonth: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 3, 9, 0),
              dateAdapter(1997, 10, 1, 9, 0),
              dateAdapter(1997, 10, 3, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonthAndMonthDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByWeekDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
              dateAdapter(1997, 9, 9, 9, 0),
              // dateAdapter(1997, 9, 12, 9, 0),
              // dateAdapter(1997, 9, 16, 9, 0),
              // dateAdapter(1997, 9, 18, 9, 0),
              // dateAdapter(1997, 9, 23, 9, 0),
              // dateAdapter(1997, 9, 25, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByNWeekDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byDayOfWeek: [['TU', 1], ['TH', -1]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 12, 25, 9, 0),
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 12, 31, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByNWeekDayLarge',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byDayOfWeek: [['TU', 3], ['TH', -3]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 12, 11, 9, 0),
              dateAdapter(1998, 1, 20, 9, 0),
              dateAdapter(1998, 12, 17, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonthAndWeekDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 1, 8, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonthAndNWeekDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: [['TU', 1], ['TH', -1]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 1, 29, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonthAndNWeekDayLarge',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: [['TU', 3], ['TH', -3]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 15, 9, 0),
              dateAdapter(1998, 1, 20, 9, 0),
              dateAdapter(1998, 3, 12, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 2, 3, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByMonthAndMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
              dateAdapter(2001, 3, 1, 9, 0),
            ],
          );

          testRecurring(
            'testYearlyByHour',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byHourOfDay: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0),
              dateAdapter(1998, 9, 2, 6, 0),
              dateAdapter(1998, 9, 2, 18, 0),
            ],
          );

          testRecurring(
            'testYearlyByMinute',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6),
              dateAdapter(1997, 9, 2, 9, 18),
              dateAdapter(1998, 9, 2, 9, 6),
            ],
          );

          testRecurring(
            'testYearlyBySecond',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 6),
              dateAdapter(1997, 9, 2, 9, 0, 18),
              dateAdapter(1998, 9, 2, 9, 0, 6),
            ],
          );

          testRecurring(
            'testYearlyByHourAndMinute',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6),
              dateAdapter(1997, 9, 2, 18, 18),
              dateAdapter(1998, 9, 2, 6, 6),
            ],
          );

          testRecurring(
            'testYearlyByHourAndSecond',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byHourOfDay: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 6),
              dateAdapter(1997, 9, 2, 18, 0, 18),
              dateAdapter(1998, 9, 2, 6, 0, 6),
            ],
          );

          testRecurring(
            'testYearlyByMinuteAndSecond',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 6),
              dateAdapter(1997, 9, 2, 9, 6, 18),
              dateAdapter(1997, 9, 2, 9, 18, 6),
            ],
          );

          testRecurring(
            'testYearlyByHourAndMinuteAndSecond',
            new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 6),
              dateAdapter(1997, 9, 2, 18, 6, 18),
              dateAdapter(1997, 9, 2, 18, 18, 6),
            ],
          );

          testRecurringBetween(
            'testYearlyBetweenInc',
            new RRule(
              {
                frequency: 'YEARLY',
                start: parse('20150101T000000'),
              },
              { dateAdapter: DateAdapter },
            ),
            parse('20160101T000000'),
            parse('20160101T000000'),
            true,
            [dateAdapter(2016, 1, 1)],
          );

          testRecurringBetween(
            'testYearlyBetweenIncLargeSpan',
            new RRule(
              {
                frequency: 'YEARLY',
                start: parse('19200101T000000'),
              },
              { dateAdapter: DateAdapter },
            ),
            parse('20160101T000000'),
            parse('20160101T000000'),
            true,
            [dateAdapter(2016, 1, 1)],
          );

          testRecurringBetween(
            'testYearlyBetweenIncLargeSpan2',
            new RRule(
              {
                frequency: 'YEARLY',
                start: parse('19200101T000000'),
              },
              { dateAdapter: DateAdapter },
            ),
            parse('20160101T000000'),
            parse('20170101T000000'),
            true,
            [dateAdapter(2016, 1, 1), dateAdapter(2017, 1, 1)],
          );
        });

        describe('MONTHLY', () => {
          testRecurring(
            'testMonthly',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 10, 2, 9, 0),
              dateAdapter(1997, 11, 2, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyInterval',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                interval: 2,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 11, 2, 9, 0),
              dateAdapter(1998, 1, 2, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyIntervalLarge',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                interval: 18,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1999, 3, 2, 9, 0),
              dateAdapter(2000, 9, 2, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonth',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMonthOfYear: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 2, 9, 0),
              dateAdapter(1998, 3, 2, 9, 0),
              dateAdapter(1999, 1, 2, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonthDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byDayOfMonth: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 3, 9, 0),
              dateAdapter(1997, 10, 1, 9, 0),
              dateAdapter(1997, 10, 3, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonthAndMonthDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByWeekDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
              dateAdapter(1997, 9, 9, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByNWeekDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byDayOfWeek: [['TU', 1], ['TH', -1]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 25, 9, 0),
              dateAdapter(1997, 10, 7, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByNWeekDayLarge',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byDayOfWeek: [['TU', 3], ['TH', -3]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 11, 9, 0),
              dateAdapter(1997, 9, 16, 9, 0),
              dateAdapter(1997, 10, 16, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonthAndWeekDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 1, 8, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonthAndNWeekDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: [['TU', 1], ['TH', -1]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 1, 29, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonthAndNWeekDayLarge',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: [['TU', 3], ['TH', -3]],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 15, 9, 0),
              dateAdapter(1998, 1, 20, 9, 0),
              dateAdapter(1998, 3, 12, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 2, 3, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMonthAndMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
              dateAdapter(2001, 3, 1, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyByHour',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byHourOfDay: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0),
              dateAdapter(1997, 10, 2, 6, 0),
              dateAdapter(1997, 10, 2, 18, 0),
            ],
          );

          testRecurring(
            'testMonthlyByMinute',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6),
              dateAdapter(1997, 9, 2, 9, 18),
              dateAdapter(1997, 10, 2, 9, 6),
            ],
          );

          testRecurring(
            'testMonthlyBySecond',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 6),
              dateAdapter(1997, 9, 2, 9, 0, 18),
              dateAdapter(1997, 10, 2, 9, 0, 6),
            ],
          );

          testRecurring(
            'testMonthlyByHourAndMinute',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6),
              dateAdapter(1997, 9, 2, 18, 18),
              dateAdapter(1997, 10, 2, 6, 6),
            ],
          );

          testRecurring(
            'testMonthlyByHourAndSecond',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byHourOfDay: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 6),
              dateAdapter(1997, 9, 2, 18, 0, 18),
              dateAdapter(1997, 10, 2, 6, 0, 6),
            ],
          );

          testRecurring(
            'testMonthlyByMinuteAndSecond',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 6),
              dateAdapter(1997, 9, 2, 9, 6, 18),
              dateAdapter(1997, 9, 2, 9, 18, 6),
            ],
          );

          testRecurring(
            'testMonthlyByHourAndMinuteAndSecond',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 6),
              dateAdapter(1997, 9, 2, 18, 6, 18),
              dateAdapter(1997, 9, 2, 18, 18, 6),
            ],
          );

          testRecurring(
            'testMonthlyNegByMonthDayJanFebForNonLeapYear',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 4,
                byDayOfMonth: [-1],
                start: parse('20131201T0900000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(2013, 12, 31, 9, 0),
              dateAdapter(2014, 1, 31, 9, 0),
              dateAdapter(2014, 2, 28, 9, 0),
              dateAdapter(2014, 3, 31, 9, 0),
            ],
          );

          testRecurring(
            'testMonthlyNegByMonthDayJanFebForLeapYear',
            new RRule(
              {
                frequency: 'MONTHLY',
                count: 4,
                byDayOfMonth: [-1],
                start: parse('20151201T0900000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(2015, 12, 31, 9, 0),
              dateAdapter(2016, 1, 31, 9, 0),
              dateAdapter(2016, 2, 29, 9, 0),
              dateAdapter(2016, 3, 31, 9, 0),
            ],
          );
        });

        describe('WEEKLY', () => {
          testRecurring(
            'testWeekly',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 9, 9, 0),
              dateAdapter(1997, 9, 16, 9, 0),
            ],
          );

          testRecurring(
            'testWeeklyInterval',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                interval: 2,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 16, 9, 0),
              dateAdapter(1997, 9, 30, 9, 0),
            ],
          );

          testRecurring(
            'testWeeklyIntervalLarge',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                interval: 20,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1998, 1, 20, 9, 0),
              dateAdapter(1998, 6, 9, 9, 0),
            ],
          );

          testRecurring(
            'testWeeklyByMonth',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byMonthOfYear: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 1, 13, 9, 0),
              dateAdapter(1998, 1, 20, 9, 0),
            ],
          );

          testRecurring(
            'testWeeklyByWeekDay',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
              dateAdapter(1997, 9, 9, 9, 0),
            ],
          );

          testRecurring(
            'testWeeklyByMonthAndWeekDay',
            // This test is interesting, because it crosses the year
            // boundary in a weekly period to find day '1' as a
            // valid recurrence.
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 1, 8, 9, 0),
            ],
          );

          testRecurring(
            'testWeeklyByHour',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byHourOfDay: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0),
              dateAdapter(1997, 9, 9, 6, 0),
              dateAdapter(1997, 9, 9, 18, 0),
            ],
          );

          testRecurring(
            'testWeeklyByMinute',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6),
              dateAdapter(1997, 9, 2, 9, 18),
              dateAdapter(1997, 9, 9, 9, 6),
            ],
          );

          testRecurring(
            'testWeeklyBySecond',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 6),
              dateAdapter(1997, 9, 2, 9, 0, 18),
              dateAdapter(1997, 9, 9, 9, 0, 6),
            ],
          );

          testRecurring(
            'testWeeklyByHourAndMinute',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6),
              dateAdapter(1997, 9, 2, 18, 18),
              dateAdapter(1997, 9, 9, 6, 6),
            ],
          );

          testRecurring(
            'testWeeklyByHourAndSecond',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byHourOfDay: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 6),
              dateAdapter(1997, 9, 2, 18, 0, 18),
              dateAdapter(1997, 9, 9, 6, 0, 6),
            ],
          );

          testRecurring(
            'testWeeklyByMinuteAndSecond',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 6),
              dateAdapter(1997, 9, 2, 9, 6, 18),
              dateAdapter(1997, 9, 2, 9, 18, 6),
            ],
          );

          testRecurring(
            'testWeeklyByHourAndMinuteAndSecond',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 6),
              dateAdapter(1997, 9, 2, 18, 6, 18),
              dateAdapter(1997, 9, 2, 18, 18, 6),
            ],
          );

          testRecurring(
            'calculates weekly recurrences correctly across DST boundaries',
            new RRule(
              {
                frequency: 'WEEKLY',
                start: parse('20181031T180000'),
                until: parse('20181115T050000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(2018, 10, 31, 18),
              dateAdapter(2018, 11, 7, 18),
              dateAdapter(2018, 11, 14, 18),
            ],
          );

          // Grabbed these tests from a recent patch to rrulejs, but, at second glance,
          // this one doesn't look valid. It is expecting a date before the start time...
          // which, unless I'm too sleep deprived at the moment, shouldn't be possible.
          // Don't have time to investigate to just commenting them out for later.

          // testRecurring(
          //   'calculates byweekday recurrences correctly across DST boundaries',
          //   new RRule({
          //     frequency: 'WEEKLY',
          //     start: parse('20181000T000000'),
          //     until: parse('20181009T000000'),
          //     byDayOfWeek: ['SU', 'WE'],
          //   }, {dateAdapter: DateAdapter}),
          //   [
          //     dateAdapter(2018, 9, 30),
          //     dateAdapter(2018, 10, 3),
          //     dateAdapter(2018, 10, 7),
          //   ]
          // )
        });

        describe('DAILY', () => {
          testRecurring(
            'testDaily',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 3, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
            ],
          );

          testRecurring(
            'testDailyInterval',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                interval: 2,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
              dateAdapter(1997, 9, 6, 9, 0),
            ],
          );

          testRecurring(
            'testDailyIntervalLarge',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                interval: 92,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 12, 3, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByMonth',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byMonthOfYear: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 2, 9, 0),
              dateAdapter(1998, 1, 3, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByMonthDay',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byDayOfMonth: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 3, 9, 0),
              dateAdapter(1997, 10, 1, 9, 0),
              dateAdapter(1997, 10, 3, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByMonthAndMonthDay',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByWeekDay',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
              dateAdapter(1997, 9, 9, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByMonthAndWeekDay',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 6, 9, 0),
              dateAdapter(1998, 1, 8, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 2, 3, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByMonthAndMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
              dateAdapter(2001, 3, 1, 9, 0),
            ],
          );

          testRecurring(
            'testDailyByHour',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byHourOfDay: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0),
              dateAdapter(1997, 9, 3, 6, 0),
              dateAdapter(1997, 9, 3, 18, 0),
            ],
          );

          testRecurring(
            'testDailyByMinute',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6),
              dateAdapter(1997, 9, 2, 9, 18),
              dateAdapter(1997, 9, 3, 9, 6),
            ],
          );

          testRecurring(
            'testDailyBySecond',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 6),
              dateAdapter(1997, 9, 2, 9, 0, 18),
              dateAdapter(1997, 9, 3, 9, 0, 6),
            ],
          );

          testRecurring(
            'testDailyByHourAndMinute',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6),
              dateAdapter(1997, 9, 2, 18, 18),
              dateAdapter(1997, 9, 3, 6, 6),
            ],
          );

          testRecurring(
            'testDailyByHourAndSecond',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byHourOfDay: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 6),
              dateAdapter(1997, 9, 2, 18, 0, 18),
              dateAdapter(1997, 9, 3, 6, 0, 6),
            ],
          );

          testRecurring(
            'testDailyByMinuteAndSecond',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 6),
              dateAdapter(1997, 9, 2, 9, 6, 18),
              dateAdapter(1997, 9, 2, 9, 18, 6),
            ],
          );

          testRecurring(
            'testDailyByHourAndMinuteAndSecond',
            new RRule(
              {
                frequency: 'DAILY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 6),
              dateAdapter(1997, 9, 2, 18, 6, 18),
              dateAdapter(1997, 9, 2, 18, 18, 6),
            ],
          );

          testRecurring(
            'calculates daily recurrences correctly across DST boundaries',
            new RRule(
              {
                frequency: 'DAILY',
                start: parse('20181101T110000'),
                until: parse('20181106T110000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(2018, 11, 1, 11),
              dateAdapter(2018, 11, 2, 11),
              dateAdapter(2018, 11, 3, 11),
              dateAdapter(2018, 11, 4, 11),
              dateAdapter(2018, 11, 5, 11),
              dateAdapter(2018, 11, 6, 11),
            ],
          );
        });

        describe('HOURLY', () => {
          testRecurring(
            'testHourly',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 2, 10, 0),
              dateAdapter(1997, 9, 2, 11, 0),
            ],
          );

          testRecurring(
            'testHourlyInterval',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                interval: 2,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 2, 11, 0),
              dateAdapter(1997, 9, 2, 13, 0),
            ],
          );

          testRecurring(
            'testHourlyIntervalLarge',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                interval: 769,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 10, 4, 10, 0),
              dateAdapter(1997, 11, 5, 11, 0),
            ],
          );

          testRecurring(
            'testHourlyByMonth',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byMonthOfYear: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 1, 0),
              dateAdapter(1998, 1, 1, 2, 0),
            ],
          );

          testRecurring(
            'testHourlyByMonthDay',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byDayOfMonth: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 3, 0, 0),
              dateAdapter(1997, 9, 3, 1, 0),
              dateAdapter(1997, 9, 3, 2, 0),
            ],
          );

          testRecurring(
            'testHourlyByMonthAndMonthDay',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 5, 0, 0),
              dateAdapter(1998, 1, 5, 1, 0),
              dateAdapter(1998, 1, 5, 2, 0),
            ],
          );

          testRecurring(
            'testHourlyByWeekDay',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 2, 10, 0),
              dateAdapter(1997, 9, 2, 11, 0),
            ],
          );

          testRecurring(
            'testHourlyByMonthAndWeekDay',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 1, 0),
              dateAdapter(1998, 1, 1, 2, 0),
            ],
          );

          testRecurring(
            'testHourlyByMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 1, 0),
              dateAdapter(1998, 1, 1, 2, 0),
            ],
          );

          testRecurring(
            'testHourlyByMonthAndMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 1, 0),
              dateAdapter(1998, 1, 1, 2, 0),
            ],
          );

          testRecurring(
            'testHourlyByHour',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byHourOfDay: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0),
              dateAdapter(1997, 9, 3, 6, 0),
              dateAdapter(1997, 9, 3, 18, 0),
            ],
          );

          testRecurring(
            'testHourlyByMinute',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6),
              dateAdapter(1997, 9, 2, 9, 18),
              dateAdapter(1997, 9, 2, 10, 6),
            ],
          );

          testRecurring(
            'testHourlyBySecond',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 6),
              dateAdapter(1997, 9, 2, 9, 0, 18),
              dateAdapter(1997, 9, 2, 10, 0, 6),
            ],
          );

          testRecurring(
            'testHourlyByHourAndMinute',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6),
              dateAdapter(1997, 9, 2, 18, 18),
              dateAdapter(1997, 9, 3, 6, 6),
            ],
          );

          testRecurring(
            'testHourlyByHourAndSecond',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byHourOfDay: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 6),
              dateAdapter(1997, 9, 2, 18, 0, 18),
              dateAdapter(1997, 9, 3, 6, 0, 6),
            ],
          );

          testRecurring(
            'testHourlyByMinuteAndSecond',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 6),
              dateAdapter(1997, 9, 2, 9, 6, 18),
              dateAdapter(1997, 9, 2, 9, 18, 6),
            ],
          );

          testRecurring(
            'testHourlyByHourAndMinuteAndSecond',
            new RRule(
              {
                frequency: 'HOURLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 6),
              dateAdapter(1997, 9, 2, 18, 6, 18),
              dateAdapter(1997, 9, 2, 18, 18, 6),
            ],
          );
        });

        describe('MINUTELY', () => {
          testRecurring(
            'testMinutely',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 2, 9, 1),
              dateAdapter(1997, 9, 2, 9, 2),
            ],
          );

          testRecurring(
            'testMinutelyInterval',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                interval: 2,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 2, 9, 2),
              dateAdapter(1997, 9, 2, 9, 4),
            ],
          );

          testRecurring(
            'testMinutelyIntervalLarge',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                interval: 1501,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 3, 10, 1),
              dateAdapter(1997, 9, 4, 11, 2),
            ],
          );

          testRecurring(
            'testMinutelyByMonth',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byMonthOfYear: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 0, 1),
              dateAdapter(1998, 1, 1, 0, 2),
            ],
          );

          testRecurring(
            'testMinutelyByMonthDay',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byDayOfMonth: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 3, 0, 0),
              dateAdapter(1997, 9, 3, 0, 1),
              dateAdapter(1997, 9, 3, 0, 2),
            ],
          );

          testRecurring(
            'testMinutelyByMonthAndMonthDay',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 5, 0, 0),
              dateAdapter(1998, 1, 5, 0, 1),
              dateAdapter(1998, 1, 5, 0, 2),
            ],
          );

          testRecurring(
            'testMinutelyByWeekDay',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 2, 9, 1),
              dateAdapter(1997, 9, 2, 9, 2),
            ],
          );

          testRecurring(
            'testMinutelyByMonthAndWeekDay',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 0, 1),
              dateAdapter(1998, 1, 1, 0, 2),
            ],
          );

          testRecurring(
            'testMinutelyByMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 0, 1),
              dateAdapter(1998, 1, 1, 0, 2),
            ],
          );

          testRecurring(
            'testMinutelyByMonthAndMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0),
              dateAdapter(1998, 1, 1, 0, 1),
              dateAdapter(1998, 1, 1, 0, 2),
            ],
          );

          testRecurring(
            'testMinutelyByHour',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byHourOfDay: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0),
              dateAdapter(1997, 9, 2, 18, 1),
              dateAdapter(1997, 9, 2, 18, 2),
            ],
          );

          testRecurring(
            'testMinutelyByMinute',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6),
              dateAdapter(1997, 9, 2, 9, 18),
              dateAdapter(1997, 9, 2, 10, 6),
            ],
          );

          testRecurring(
            'testMinutelyBySecond',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 6),
              dateAdapter(1997, 9, 2, 9, 0, 18),
              dateAdapter(1997, 9, 2, 9, 1, 6),
            ],
          );

          testRecurring(
            'testMinutelyByHourAndMinute',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6),
              dateAdapter(1997, 9, 2, 18, 18),
              dateAdapter(1997, 9, 3, 6, 6),
            ],
          );

          testRecurring(
            'testMinutelyByHourAndSecond',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byHourOfDay: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 6),
              dateAdapter(1997, 9, 2, 18, 0, 18),
              dateAdapter(1997, 9, 2, 18, 1, 6),
            ],
          );

          testRecurring(
            'testMinutelyByMinuteAndSecond',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 6),
              dateAdapter(1997, 9, 2, 9, 6, 18),
              dateAdapter(1997, 9, 2, 9, 18, 6),
            ],
          );

          testRecurring(
            'testMinutelyByHourAndMinuteAndSecond',
            new RRule(
              {
                frequency: 'MINUTELY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T180606'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 6),
              dateAdapter(1997, 9, 2, 18, 6, 18),
              dateAdapter(1997, 9, 2, 18, 18, 6),
            ],
          );
        });

        describe('SECONDLY', () => {
          testRecurring(
            'testSecondly',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 0),
              dateAdapter(1997, 9, 2, 9, 0, 1),
              dateAdapter(1997, 9, 2, 9, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyInterval',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                interval: 2,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 0),
              dateAdapter(1997, 9, 2, 9, 0, 2),
              dateAdapter(1997, 9, 2, 9, 0, 4),
            ],
          );

          testRecurring(
            'testSecondlyIntervalLarge',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                interval: 90061,
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 0),
              dateAdapter(1997, 9, 3, 10, 1, 1),
              dateAdapter(1997, 9, 4, 11, 2, 2),
            ],
          );

          testRecurring(
            'testSecondlyByMonth',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byMonthOfYear: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0, 0),
              dateAdapter(1998, 1, 1, 0, 0, 1),
              dateAdapter(1998, 1, 1, 0, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByMonthDay',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byDayOfMonth: [1, 3],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 3, 0, 0, 0),
              dateAdapter(1997, 9, 3, 0, 0, 1),
              dateAdapter(1997, 9, 3, 0, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByMonthAndMonthDay',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 5, 0, 0, 0),
              dateAdapter(1998, 1, 5, 0, 0, 1),
              dateAdapter(1998, 1, 5, 0, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByWeekDay',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 0),
              dateAdapter(1997, 9, 2, 9, 0, 1),
              dateAdapter(1997, 9, 2, 9, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByMonthAndWeekDay',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0, 0),
              dateAdapter(1998, 1, 1, 0, 0, 1),
              dateAdapter(1998, 1, 1, 0, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0, 0),
              dateAdapter(1998, 1, 1, 0, 0, 1),
              dateAdapter(1998, 1, 1, 0, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByMonthAndMonthDayAndWeekDay',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1998, 1, 1, 0, 0, 0),
              dateAdapter(1998, 1, 1, 0, 0, 1),
              dateAdapter(1998, 1, 1, 0, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByHour',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byHourOfDay: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 0),
              dateAdapter(1997, 9, 2, 18, 0, 1),
              dateAdapter(1997, 9, 2, 18, 0, 2),
            ],
          );

          testRecurring(
            'testSecondlyByMinute',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 0),
              dateAdapter(1997, 9, 2, 9, 6, 1),
              dateAdapter(1997, 9, 2, 9, 6, 2),
            ],
          );

          testRecurring(
            'testSecondlyBySecond',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 6),
              dateAdapter(1997, 9, 2, 9, 0, 18),
              dateAdapter(1997, 9, 2, 9, 1, 6),
            ],
          );

          testRecurring(
            'testSecondlyByHourAndMinute',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 0),
              dateAdapter(1997, 9, 2, 18, 6, 1),
              dateAdapter(1997, 9, 2, 18, 6, 2),
            ],
          );

          testRecurring(
            'testSecondlyByHourAndSecond',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byHourOfDay: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 0, 6),
              dateAdapter(1997, 9, 2, 18, 0, 18),
              dateAdapter(1997, 9, 2, 18, 1, 6),
            ],
          );

          testRecurring(
            'testSecondlyByMinuteAndSecond',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 6, 6),
              dateAdapter(1997, 9, 2, 9, 6, 18),
              dateAdapter(1997, 9, 2, 9, 18, 6),
            ],
          );

          testRecurring(
            'testSecondlyByHourAndMinuteAndSecond',
            new RRule(
              {
                frequency: 'SECONDLY',
                count: 3,
                byHourOfDay: [6, 18],
                byMinuteOfHour: [6, 18],
                bySecondOfMinute: [6, 18],
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 18, 6, 6),
              dateAdapter(1997, 9, 2, 18, 6, 18),
              dateAdapter(1997, 9, 2, 18, 18, 6),
            ],
          );
        });

        describe('UNTIL', () => {
          testRecurring(
            'testUntilNotMatching',
            new RRule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                until: parse('19970905T080000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 3, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
            ],
          );

          testRecurring(
            'testUntilMatching',
            new RRule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                until: parse('19970904T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 3, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
            ],
          );

          testRecurring(
            'testUntilSingle',
            new RRule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                until: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [dateAdapter(1997, 9, 2, 9, 0)],
          );

          testRecurring(
            'testUntilEmpty',
            new RRule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                until: parse('19970901T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [],
          );

          testRecurring(
            'testUntilWithDate',
            new RRule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                until: dateAdapter(1997, 9, 5),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 3, 9, 0),
              dateAdapter(1997, 9, 4, 9, 0),
            ],
          );
        });

        describe('WKST', () => {
          testRecurring(
            'testWkStIntervalMO',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                interval: 2,
                byDayOfWeek: ['TU', 'SU'],
                weekStart: 'MO',
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 7, 9, 0),
              dateAdapter(1997, 9, 16, 9, 0),
            ],
          );

          testRecurring(
            'testWkStIntervalSU',
            new RRule(
              {
                frequency: 'WEEKLY',
                count: 3,
                interval: 2,
                byDayOfWeek: ['TU', 'SU'],
                weekStart: 'SU',
                start: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1997, 9, 14, 9, 0),
              dateAdapter(1997, 9, 16, 9, 0),
            ],
          );
        });

        testRecurring(
          'testDTStartIsDate',
          new RRule(
            {
              frequency: 'DAILY',
              count: 3,
              start: dateAdapter(1997, 9, 2),
            },
            { dateAdapter: DateAdapter },
          ),
          [
            dateAdapter(1997, 9, 2, 0, 0),
            dateAdapter(1997, 9, 3, 0, 0),
            dateAdapter(1997, 9, 4, 0, 0),
          ],
        );

        testRecurring(
          'testDTStartWithMicroseconds',
          new RRule(
            {
              frequency: 'DAILY',
              count: 3,
              start: parse('19970902T090000.5'),
            },
            { dateAdapter: DateAdapter },
          ),
          [
            dateAdapter(1997, 9, 2, 9, 0),
            dateAdapter(1997, 9, 3, 9, 0),
            dateAdapter(1997, 9, 4, 9, 0),
          ],
        );

        describe('testMaxYear', () => {
          it('throws error', () => {
            const rule = new RRule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [2],
                byDayOfMonth: [31],
                start: parse('99970902T090000'),
              },
              { dateAdapter: DateAdapter },
            );

            expect(() => {
              rule.occurrences().toArray();
            }).toThrowError();
          });
        });

        testRecurring(
          'testSubsecondStartYearly',
          new RRule(
            {
              frequency: 'YEARLY',
              count: 1,
              start: dateAdapter(2014, 12, 31, 22, 0, 0, 1),
            },
            { dateAdapter: DateAdapter },
          ),
          [dateAdapter(2014, 12, 31, 22, 0, 0, 1)],
        );
      });
    });
  });
});

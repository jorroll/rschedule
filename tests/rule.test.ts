/**
 * Credit:
 * The vast majority of these tests were taken from [rrulejs](https://github.com/jakubroztocil/rrule),
 * which itself credits the python library `dateutil.rrule` for first creating the tests.
 */

import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import { DateAdapter as DateAdapterConstructor, RScheduleConfig, Rule } from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import {
  context,
  DatetimeFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  standardDatetimeFn,
  timezoneDateAdapterFn,
  TIMEZONES,
} from './utilities';

function testRecurring(
  testName: string,
  rule: Rule<typeof DateAdapterConstructor>,
  expectedDates: DateAdapterConstructor[],
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

    describe('w/args', () => {
      it('END', () => {
        let newExpectedDates: DateAdapterConstructor[];
        let end: DateAdapterConstructor | undefined;

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
          .occurrences({ end })
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
          .occurrences({ end: newExpectedDates[0], reverse: true })
          .toArray()!
          .map(date => date.toISOString());

        expect(actual).toEqual(expected);
      });
    });

    describe('#occursOn()', () => {
      expectedDates
        .map(date => date.toDateTime())
        .forEach(date => {
          describe(date.toISOString(), () => {
            it('date', () => expect(rule.occursOn({ date })).toBeTruthy());

            describe('weekday', () => {
              it('no options', () =>
                expect(rule.occursOn({ weekday: date.get('weekday') })).toBeTruthy());

              it('excludeDates', () =>
                expect(
                  rule.occursOn({
                    weekday: date.get('weekday'),
                    excludeDates: expectedDates,
                  }),
                ).toBeFalsy());
            });
          });
        });

      if (expectedDates.length > 0) {
        const first = expectedDates[0].toDateTime();
        const last = expectedDates[expectedDates.length - 1].toDateTime();

        describe(first.toISOString(), () => {
          describe('weekday', () => {
            it('before first including', () => {
              expect(
                rule.occursOn({
                  weekday: first.get('weekday'),
                  before: first,
                }),
              ).toBeTruthy();
            });

            it('before first excluding', () =>
              expect(
                rule.occursOn({
                  weekday: first.get('weekday'),
                  before: first,
                  excludeEnds: true,
                }),
              ).toBeFalsy());

            it('after first including', () =>
              expect(
                rule.occursOn({
                  weekday: first.get('weekday'),
                  after: first,
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
                  before: last,
                }),
              ).toBeTruthy());

            // don't think there's a generic way to know what the answer should be (e.g. take a `MINUTELY` rule of count 3 which only takes place
            // on one day, if you exclude that day it doesn't happen).
            // it('before last excluding', () => expect(rule.occursOn({weekday: last.get('weekday'), before: last, excludeEnds: true})).toBeTruthy())
            it('after last including', () =>
              expect(
                rule.occursOn({
                  weekday: last.get('weekday'),
                  after: last,
                }),
              ).toBeTruthy());

            it('after last excluding', () =>
              expect(
                rule.occursOn({
                  weekday: last.get('weekday'),
                  after: last,
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
  rule: Rule<typeof DateAdapterConstructor>,
  start: DateAdapterConstructor,
  end: DateAdapterConstructor,
  inclusive: boolean,
  expectedDates: DateAdapterConstructor[],
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrences = rule.occurrences({ start, end }).toArray()!;

      if (!inclusive) {
        occurrences = occurrences.filter(
          date =>
            !(
              date.toDateTime().isEqual(start.toDateTime()) ||
              date.toDateTime().isEqual(end.toDateTime())
            ),
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
  rule: Rule<typeof DateAdapterConstructor>,
  end: DateAdapterConstructor,
  inclusive: boolean,
  expectedDate: DateAdapterConstructor,
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrence: DateAdapterConstructor;
      for (const day of rule.occurrences({
        end,
        reverse: true,
      })) {
        if (!inclusive && day.toDateTime().isEqual(end.toDateTime())) {
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
  rule: Rule<typeof DateAdapterConstructor>,
  start: DateAdapterConstructor,
  inclusive: boolean,
  expectedDate: DateAdapterConstructor,
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrence: DateAdapterConstructor;
      for (const day of rule.occurrences({ start })) {
        if (!inclusive && day.toDateTime().isEqual(start.toDateTime())) {
          continue;
        }
        occurrence = day;
        break;
      }
      expect(occurrence!).not.toBe(undefined);
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
      typeof DateAdapterConstructor,
      DatetimeFn<any>
    ];

    // const timezones = !DateAdapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];
    const timezones = !DateAdapter.hasTimezoneSupport ? [undefined, 'UTC'] : TIMEZONES;

    timezones.forEach(timezone => {
      RScheduleConfig.defaultDateAdapter = DateAdapter;
      RScheduleConfig.defaultTimezone = timezone;

      context(timezone, zone => {
        const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, zone);

        // legacy function to create new dateAdapter instances
        const parse = (str: string) => {
          const parts: Array<number | string> = str
            .match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)!
            .map(part => Number(part));

          parts.shift();

          // @ts-ignore
          return dateAdapter(...parts);
        };

        describe('specific bugs', () => {
          if (DateAdapter.hasTimezoneSupport) {
            it('occursOn() arg is in a different timezone from rule start', () => {
              const start = dateAdapter(2018, 8, 16, 0, 0, 0, 0);

              const rule = new Rule(
                {
                  frequency: 'WEEKLY',
                  start,
                  byDayOfWeek: ['TH'],
                },
                { dateAdapter: DateAdapter },
              );

              const secondOccurrence = dateAdapter(2018, 8, 23, 0, 0, 0, 0).set(
                'timezone',
                'America/Los_Angeles',
              );

              const falseSecondOccurrence = dateAdapter(2018, 8, 22, 0, 0, 0, 0).set(
                'timezone',
                'America/Los_Angeles',
              );

              expect(rule.occursOn({ date: secondOccurrence })).toBeTruthy();
              expect(rule.occursOn({ date: falseSecondOccurrence })).toBeFalsy();
            });
          }
        });

        testPreviousOccurrence(
          'testBefore',
          new Rule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 5, 9, 0, 0, 0),
          false,
          dateAdapter(1997, 9, 4, 9, 0, 0, 0),
        );

        testPreviousOccurrence(
          'testBeforeInc',
          new Rule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 5, 9, 0, 0, 0),
          true,
          dateAdapter(1997, 9, 5, 9, 0, 0, 0),
        );

        testNextOccurrence(
          'testAfter',
          new Rule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 4, 9, 0, 0, 0),
          false,
          dateAdapter(1997, 9, 5, 9, 0, 0, 0),
        );

        testNextOccurrence(
          'testAfterInc',
          new Rule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 4, 9, 0, 0, 0),
          true,
          dateAdapter(1997, 9, 4, 9, 0, 0, 0),
        );

        testRecurringBetween(
          'testBetween',
          new Rule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 2, 9, 0, 0, 0),
          dateAdapter(1997, 9, 6, 9, 0, 0, 0),
          false,
          [
            dateAdapter(1997, 9, 3, 9, 0, 0, 0),
            dateAdapter(1997, 9, 4, 9, 0, 0, 0),
            dateAdapter(1997, 9, 5, 9, 0, 0, 0),
          ],
        );

        testRecurringBetween(
          'testBetweenInc',
          new Rule(
            {
              frequency: 'DAILY',
              start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
            },
            { dateAdapter: DateAdapter },
          ),
          dateAdapter(1997, 9, 2, 9, 0, 0, 0),
          dateAdapter(1997, 9, 6, 9, 0, 0, 0),
          true,
          [
            dateAdapter(1997, 9, 2, 9, 0, 0, 0),
            dateAdapter(1997, 9, 3, 9, 0, 0, 0),
            dateAdapter(1997, 9, 4, 9, 0, 0, 0),
            dateAdapter(1997, 9, 5, 9, 0, 0, 0),
            dateAdapter(1997, 9, 6, 9, 0, 0, 0),
          ],
        );

        describe('YEARLY', () => {
          testRecurring(
            'testYearly',
            new Rule(
              {
                frequency: 'YEARLY',
                count: 3,
                start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(1997, 9, 2, 9, 0, 0, 0),
              dateAdapter(1998, 9, 2, 9, 0, 0, 0),
              dateAdapter(1999, 9, 2, 9, 0, 0, 0),
            ],
          );

          testRecurring(
            'testYearlyInterval',
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
              {
                frequency: 'WEEKLY',
                start: parse('20181031T180000'),
                end: parse('20181115T050000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [
              dateAdapter(2018, 10, 31, 18),
              dateAdapter(2018, 11, 7, 18),
              dateAdapter(2018, 11, 14, 18),
            ],
          );

          testRecurring(
            'calculates byweekday recurrences correctly across DST boundaries',
            new Rule(
              {
                frequency: 'WEEKLY',
                start: parse('20181001T000000'),
                end: parse('20181009T000000'),
                byDayOfWeek: ['SU', 'WE'],
              },
              { dateAdapter: DateAdapter },
            ),
            [
              DateAdapter.fromJSON({
                timezone: zone,
                duration: undefined,
                year: 2018,
                month: 10,
                day: 3,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
              }),
              DateAdapter.fromJSON({
                timezone: zone,
                duration: undefined,
                year: 2018,
                month: 10,
                day: 7,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
              }),
            ],
          );
        });

        describe('DAILY', () => {
          testRecurring(
            'testDaily',
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
              {
                frequency: 'DAILY',
                start: parse('20181101T110000'),
                end: parse('20181106T110000'),
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
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
            new Rule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                end: parse('19970905T080000'),
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
            new Rule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                end: parse('19970904T090000'),
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
            new Rule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                end: parse('19970902T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [dateAdapter(1997, 9, 2, 9, 0)],
          );

          testRecurring(
            'testUntilEmpty',
            new Rule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                end: parse('19970901T090000'),
              },
              { dateAdapter: DateAdapter },
            ),
            [],
          );

          testRecurring(
            'testUntilWithDate',
            new Rule(
              {
                frequency: 'DAILY',
                // count: 3,
                start: parse('19970902T090000'),
                end: dateAdapter(1997, 9, 5),
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
            new Rule(
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
            new Rule(
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
          new Rule(
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
          new Rule(
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
            const rule = new Rule(
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
          new Rule(
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

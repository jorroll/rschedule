/**
 * Credit:
 * The vast majority of these tests were taken from [rrulejs](https://github.com/jakubroztocil/rrule),
 * which itself credits the python library `dateutil.rrule` for first creating the tests.
 */

import {
  DateAdapter as DateAdapterConstructor,
  RecurrenceRulesOptions,
  NormalizedRecurrenceRulesOptions,
} from '@rschedule/core';

import { OccurrenceGenerator } from '@rschedule/core/generators';
import { FrequencyRuleModule, ByMonthOfYearRuleModule, ByDayOfMonthRuleModule, ByDayOfWeekRuleModule, ByHourOfDayRuleModule, ByMinuteOfHourRuleModule, BySecondOfMinuteRuleModule, ByMillisecondOfSecondRuleModule, ByDayOfWeek } from '@rschedule/core/rules';

export const RECURRENCE_RULES = [
  FrequencyRuleModule,
  ByMonthOfYearRuleModule,
  ByDayOfMonthRuleModule,
  ByDayOfWeekRuleModule,
  ByHourOfDayRuleModule,
  ByMinuteOfHourRuleModule,
  BySecondOfMinuteRuleModule,
  ByMillisecondOfSecondRuleModule,
];

export type IRuleOptions<T extends DateAdapterConstructor> = RecurrenceRulesOptions<T, typeof RECURRENCE_RULES>;
export type INormalizedRuleOptions = NormalizedRecurrenceRulesOptions<typeof RECURRENCE_RULES>;


function testRecurring(
  testName: string,
  rule: Readonly<OccurrenceGenerator<DateAdapterConstructor>>,
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
  rule: Readonly<OccurrenceGenerator<DateAdapterConstructor>>,
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
  rule: Readonly<OccurrenceGenerator<DateAdapterConstructor>>,
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
  rule: Readonly<OccurrenceGenerator<DateAdapterConstructor>>,
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

export function ruleTests(
  DateAdapter: typeof DateAdapterConstructor,
  dateAdapter: (
    ...args: (number | { duration?: number; timezone?: string | null })[]
  ) => DateAdapterConstructor,
  parse: (str: string) => DateAdapterConstructor,
  buildGenerator: (config: IRuleOptions<any>) => Readonly<OccurrenceGenerator<any>>,
) {
  describe('specific bugs', () => {
    if (DateAdapter.hasTimezoneSupport) {
      it('occursOn() arg is in a different timezone from rule start', () => {
        const start = dateAdapter(2018, 8, 16, 0, 0, 0, 0);

        const rule = buildGenerator({
          frequency: 'WEEKLY',
          start,
          byDayOfWeek: ['TH'] as ByDayOfWeek[],
        });

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
    buildGenerator({
      frequency: 'DAILY',
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
    }),
    dateAdapter(1997, 9, 5, 9, 0, 0, 0),
    false,
    dateAdapter(1997, 9, 4, 9, 0, 0, 0),
  );

  testPreviousOccurrence(
    'testBeforeInc',
    buildGenerator({
      frequency: 'DAILY',
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
    }),
    dateAdapter(1997, 9, 5, 9, 0, 0, 0),
    true,
    dateAdapter(1997, 9, 5, 9, 0, 0, 0),
  );

  testNextOccurrence(
    'testAfter',
    buildGenerator({
      frequency: 'DAILY',
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
    }),
    dateAdapter(1997, 9, 4, 9, 0, 0, 0),
    false,
    dateAdapter(1997, 9, 5, 9, 0, 0, 0),
  );

  testNextOccurrence(
    'testAfterInc',
    buildGenerator({
      frequency: 'DAILY',
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
    }),
    dateAdapter(1997, 9, 4, 9, 0, 0, 0),
    true,
    dateAdapter(1997, 9, 4, 9, 0, 0, 0),
  );

  testRecurringBetween(
    'testBetween',
    buildGenerator({
      frequency: 'DAILY',
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
    }),
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
    buildGenerator({
      frequency: 'DAILY',
      start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
    }),
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
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 0, 0),
        dateAdapter(1998, 9, 2, 9, 0, 0, 0),
        dateAdapter(1999, 9, 2, 9, 0, 0, 0),
      ],
    );

    testRecurring(
      'testYearlyWithEndDate',
      buildGenerator({
        frequency: 'YEARLY',
        start: dateAdapter(1997, 9, 2, 9, 0, 0, 0),
        end: dateAdapter(1999, 9, 2, 9, 0, 0, 0),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 0, 0),
        dateAdapter(1998, 9, 2, 9, 0, 0, 0),
        dateAdapter(1999, 9, 2, 9, 0, 0, 0),
      ],
    );

    testRecurring(
      'testYearlyBySecondWithEndDate',
      buildGenerator({
        frequency: 'YEARLY',
        bySecondOfMinute: [2, 4],
        start: dateAdapter(2010, 10, 10, 0, 0, 0),
        end: dateAdapter(2010, 10, 10, 0, 2, 0),
      }),
      [dateAdapter(2010, 10, 10, 0, 0, 2), dateAdapter(2010, 10, 10, 0, 0, 4)],
    );

    testRecurring(
      'testYearlyInterval',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        interval: 2,
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1999, 9, 2, 9, 0), dateAdapter(2001, 9, 2, 9, 0)],
    );

    testRecurring(
      'testYearlyIntervalLarge',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        interval: 100,
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(2097, 9, 2, 9, 0), dateAdapter(2197, 9, 2, 9, 0)],
    );

    testRecurring(
      'testYearlyByMonth',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 2, 9, 0), dateAdapter(1998, 3, 2, 9, 0), dateAdapter(1999, 1, 2, 9, 0)],
    );

    testRecurring(
      'testYearlyByMonthDay',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byDayOfMonth: [1, 3],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 3, 9, 0),
        dateAdapter(1997, 10, 1, 9, 0),
        dateAdapter(1997, 10, 3, 9, 0),
      ],
    );

    testRecurring(
      'testYearlyByMonthAndMonthDay',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [5, 7],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)],
    );

    testRecurring(
      'testYearlyByWeekDay',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
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
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byDayOfWeek: [['TU', 1], ['TH', -1]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 12, 25, 9, 0),
        dateAdapter(1998, 1, 6, 9, 0),
        dateAdapter(1998, 12, 31, 9, 0),
      ],
    );

    testRecurring(
      'testYearlyByNWeekDayLarge',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byDayOfWeek: [['TU', 3], ['TH', -3]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 12, 11, 9, 0),
        dateAdapter(1998, 1, 20, 9, 0),
        dateAdapter(1998, 12, 17, 9, 0),
      ],
    );

    testRecurring(
      'testYearlyByMonthAndWeekDay',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)],
    );

    testRecurring(
      'testYearlyByMonthAndNWeekDay',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: [['TU', 1], ['TH', -1]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 6, 9, 0),
        dateAdapter(1998, 1, 29, 9, 0),
        dateAdapter(1998, 3, 3, 9, 0),
      ],
    );

    testRecurring(
      'testYearlyByMonthAndNWeekDayLarge',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: [['TU', 3], ['TH', -3]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 15, 9, 0),
        dateAdapter(1998, 1, 20, 9, 0),
        dateAdapter(1998, 3, 12, 9, 0),
      ],
    );

    testRecurring(
      'testYearlyByMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 2, 3, 9, 0), dateAdapter(1998, 3, 3, 9, 0)],
    );

    testRecurring(
      'testYearlyByMonthAndMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 3, 3, 9, 0), dateAdapter(2001, 3, 1, 9, 0)],
    );

    testRecurring(
      'testYearlyByHour',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byHourOfDay: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0),
        dateAdapter(1998, 9, 2, 6, 0),
        dateAdapter(1998, 9, 2, 18, 0),
      ],
    );

    testRecurring(
      'testYearlyByMinute',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6),
        dateAdapter(1997, 9, 2, 9, 18),
        dateAdapter(1998, 9, 2, 9, 6),
      ],
    );

    testRecurring(
      'testYearlyBySecond',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 6),
        dateAdapter(1997, 9, 2, 9, 0, 18),
        dateAdapter(1998, 9, 2, 9, 0, 6),
      ],
    );

    testRecurring(
      'testYearlyByHourAndMinute',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6),
        dateAdapter(1997, 9, 2, 18, 18),
        dateAdapter(1998, 9, 2, 6, 6),
      ],
    );

    testRecurring(
      'testYearlyByHourAndSecond',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byHourOfDay: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 6),
        dateAdapter(1997, 9, 2, 18, 0, 18),
        dateAdapter(1998, 9, 2, 6, 0, 6),
      ],
    );

    testRecurring(
      'testYearlyByMinuteAndSecond',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 6),
        dateAdapter(1997, 9, 2, 9, 6, 18),
        dateAdapter(1997, 9, 2, 9, 18, 6),
      ],
    );

    testRecurring(
      'testYearlyByHourAndMinuteAndSecond',
      buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6, 6),
        dateAdapter(1997, 9, 2, 18, 6, 18),
        dateAdapter(1997, 9, 2, 18, 18, 6),
      ],
    );

    // This is testing a bug I found while iterating in reverse
    testRecurring(
      'testYearlyByMonthAndByWeekWithEndDate',
      buildGenerator({
        frequency: 'YEARLY',
        byMonthOfYear: [2, 6],
        byDayOfWeek: ['SU', ['MO', 3]] as ByDayOfWeek[],
        start: dateAdapter(2010, 2, 7),
        end: dateAdapter(2010, 2, 15),
      }),
      [dateAdapter(2010, 2, 7), dateAdapter(2010, 2, 14), dateAdapter(2010, 2, 15)],
    );

    testRecurringBetween(
      'testYearlyBetweenInc',
      buildGenerator({
        frequency: 'YEARLY',
        start: parse('20150101T000000'),
      }),
      parse('20160101T000000'),
      parse('20160101T000000'),
      true,
      [dateAdapter(2016, 1, 1)],
    );

    testRecurringBetween(
      'testYearlyBetweenIncLargeSpan',
      buildGenerator({
        frequency: 'YEARLY',
        start: parse('19200101T000000'),
      }),
      parse('20160101T000000'),
      parse('20160101T000000'),
      true,
      [dateAdapter(2016, 1, 1)],
    );

    testRecurringBetween(
      'testYearlyBetweenIncLargeSpan2',
      buildGenerator({
        frequency: 'YEARLY',
        start: parse('19200101T000000'),
      }),
      parse('20160101T000000'),
      parse('20170101T000000'),
      true,
      [dateAdapter(2016, 1, 1), dateAdapter(2017, 1, 1)],
    );
  });

  describe('MONTHLY', () => {
    testRecurring(
      'testMonthly',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 10, 2, 9, 0),
        dateAdapter(1997, 11, 2, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyWithEndDate',
      buildGenerator({
        frequency: 'MONTHLY',
        start: parse('19970902T090000'),
        end: dateAdapter(1997, 11, 2, 9, 0),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 10, 2, 9, 0),
        dateAdapter(1997, 11, 2, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyInterval',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        interval: 2,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 11, 2, 9, 0),
        dateAdapter(1998, 1, 2, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyIntervalLarge',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        interval: 18,
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1999, 3, 2, 9, 0), dateAdapter(2000, 9, 2, 9, 0)],
    );

    testRecurring(
      'testMonthlyByMonth',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 2, 9, 0), dateAdapter(1998, 3, 2, 9, 0), dateAdapter(1999, 1, 2, 9, 0)],
    );

    testRecurring(
      'testMonthlyByMonthDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byDayOfMonth: [1, 3],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 3, 9, 0),
        dateAdapter(1997, 10, 1, 9, 0),
        dateAdapter(1997, 10, 3, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyByMonthAndMonthDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [5, 7],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)],
    );

    testRecurring(
      'testMonthlyByWeekDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 9, 9, 0)],
    );

    testRecurring(
      'testMonthlyByNWeekDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byDayOfWeek: [['TU', 1], ['TH', -1]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 25, 9, 0),
        dateAdapter(1997, 10, 7, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyByNWeekDayLarge',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byDayOfWeek: [['TU', 3], ['TH', -3]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 11, 9, 0),
        dateAdapter(1997, 9, 16, 9, 0),
        dateAdapter(1997, 10, 16, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyByMonthAndWeekDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)],
    );

    testRecurring(
      'testMonthlyByMonthAndNWeekDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: [['TU', 1], ['TH', -1]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 6, 9, 0),
        dateAdapter(1998, 1, 29, 9, 0),
        dateAdapter(1998, 3, 3, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyByMonthAndNWeekDayLarge',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: [['TU', 3], ['TH', -3]] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 15, 9, 0),
        dateAdapter(1998, 1, 20, 9, 0),
        dateAdapter(1998, 3, 12, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyByMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 2, 3, 9, 0), dateAdapter(1998, 3, 3, 9, 0)],
    );

    testRecurring(
      'testMonthlyByMonthAndMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 3, 3, 9, 0), dateAdapter(2001, 3, 1, 9, 0)],
    );

    testRecurring(
      'testMonthlyByHour',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byHourOfDay: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0),
        dateAdapter(1997, 10, 2, 6, 0),
        dateAdapter(1997, 10, 2, 18, 0),
      ],
    );

    testRecurring(
      'testMonthlyByMinute',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6),
        dateAdapter(1997, 9, 2, 9, 18),
        dateAdapter(1997, 10, 2, 9, 6),
      ],
    );

    testRecurring(
      'testMonthlyBySecond',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 6),
        dateAdapter(1997, 9, 2, 9, 0, 18),
        dateAdapter(1997, 10, 2, 9, 0, 6),
      ],
    );

    testRecurring(
      'testMonthlyByHourAndMinute',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6),
        dateAdapter(1997, 9, 2, 18, 18),
        dateAdapter(1997, 10, 2, 6, 6),
      ],
    );

    testRecurring(
      'testMonthlyByHourAndSecond',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byHourOfDay: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 6),
        dateAdapter(1997, 9, 2, 18, 0, 18),
        dateAdapter(1997, 10, 2, 6, 0, 6),
      ],
    );

    testRecurring(
      'testMonthlyByMinuteAndSecond',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 6),
        dateAdapter(1997, 9, 2, 9, 6, 18),
        dateAdapter(1997, 9, 2, 9, 18, 6),
      ],
    );

    testRecurring(
      'testMonthlyByHourAndMinuteAndSecond',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6, 6),
        dateAdapter(1997, 9, 2, 18, 6, 18),
        dateAdapter(1997, 9, 2, 18, 18, 6),
      ],
    );

    testRecurring(
      'testMonthlyNegByMonthDayJanFebForNonLeapYear',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 4,
        byDayOfMonth: [-1],
        start: parse('20131201T0900000'),
      }),
      [
        dateAdapter(2013, 12, 31, 9, 0),
        dateAdapter(2014, 1, 31, 9, 0),
        dateAdapter(2014, 2, 28, 9, 0),
        dateAdapter(2014, 3, 31, 9, 0),
      ],
    );

    testRecurring(
      'testMonthlyNegByMonthDayJanFebForLeapYear',
      buildGenerator({
        frequency: 'MONTHLY',
        count: 4,
        byDayOfMonth: [-1],
        start: parse('20151201T0900000'),
      }),
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
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 9, 9, 0),
        dateAdapter(1997, 9, 16, 9, 0),
      ],
    );

    testRecurring(
      'testWeeklyWithEndDate',
      buildGenerator({
        frequency: 'WEEKLY',
        start: parse('19970902T090000'),
        end: dateAdapter(1997, 9, 16, 9, 0),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 9, 9, 0),
        dateAdapter(1997, 9, 16, 9, 0),
      ],
    );

    testRecurring(
      'testWeeklyInterval',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        interval: 2,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 16, 9, 0),
        dateAdapter(1997, 9, 30, 9, 0),
      ],
    );

    testRecurring(
      'testWeeklyIntervalLarge',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        interval: 20,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1998, 1, 20, 9, 0),
        dateAdapter(1998, 6, 9, 9, 0),
      ],
    );

    testRecurring(
      'testWeeklyByMonth',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 6, 9, 0),
        dateAdapter(1998, 1, 13, 9, 0),
        dateAdapter(1998, 1, 20, 9, 0),
      ],
    );

    testRecurring(
      'testWeeklyByWeekDay',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 9, 9, 0)],
    );

    testRecurring(
      'testWeeklyByMonthAndWeekDay',
      // This test is interesting, because it crosses the year
      // boundary in a weekly period to find day '1' as a
      // valid recurrence.
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)],
    );

    testRecurring(
      'testWeeklyByHour',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byHourOfDay: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0),
        dateAdapter(1997, 9, 9, 6, 0),
        dateAdapter(1997, 9, 9, 18, 0),
      ],
    );

    testRecurring(
      'testWeeklyByMinute',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6),
        dateAdapter(1997, 9, 2, 9, 18),
        dateAdapter(1997, 9, 9, 9, 6),
      ],
    );

    testRecurring(
      'testWeeklyBySecond',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 6),
        dateAdapter(1997, 9, 2, 9, 0, 18),
        dateAdapter(1997, 9, 9, 9, 0, 6),
      ],
    );

    testRecurring(
      'testWeeklyByHourAndMinute',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6),
        dateAdapter(1997, 9, 2, 18, 18),
        dateAdapter(1997, 9, 9, 6, 6),
      ],
    );

    testRecurring(
      'testWeeklyByHourAndSecond',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byHourOfDay: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 6),
        dateAdapter(1997, 9, 2, 18, 0, 18),
        dateAdapter(1997, 9, 9, 6, 0, 6),
      ],
    );

    testRecurring(
      'testWeeklyByMinuteAndSecond',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 6),
        dateAdapter(1997, 9, 2, 9, 6, 18),
        dateAdapter(1997, 9, 2, 9, 18, 6),
      ],
    );

    testRecurring(
      'testWeeklyByHourAndMinuteAndSecond',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6, 6),
        dateAdapter(1997, 9, 2, 18, 6, 18),
        dateAdapter(1997, 9, 2, 18, 18, 6),
      ],
    );

    testRecurring(
      'calculates weekly recurrences correctly across DST boundaries',
      buildGenerator({
        frequency: 'WEEKLY',
        start: parse('20181031T180000'),
        end: parse('20181115T050000'),
      }),
      [dateAdapter(2018, 10, 31, 18), dateAdapter(2018, 11, 7, 18), dateAdapter(2018, 11, 14, 18)],
    );

    testRecurring(
      'calculates byweekday recurrences correctly across DST boundaries',
      buildGenerator({
        frequency: 'WEEKLY',
        start: parse('20181001T000000'),
        end: parse('20181009T000000'),
        byDayOfWeek: ['SU', 'WE'] as ByDayOfWeek[],
      }),
      [dateAdapter(2018, 10, 3), dateAdapter(2018, 10, 7)],
    );
  });

  describe('DAILY', () => {
    testRecurring(
      'testDaily',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)],
    );

    testRecurring(
      'testDailyWithEndDate',
      buildGenerator({
        frequency: 'DAILY',
        start: parse('19970902T090000'),
        end: dateAdapter(1997, 9, 4, 9, 0),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)],
    );

    testRecurring(
      'testDailyInterval',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        interval: 2,
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 6, 9, 0)],
    );

    testRecurring(
      'testDailyIntervalLarge',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        interval: 92,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 12, 3, 9, 0),
        dateAdapter(1998, 3, 5, 9, 0),
      ],
    );

    testRecurring(
      'testDailyByMonth',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 2, 9, 0), dateAdapter(1998, 1, 3, 9, 0)],
    );

    testRecurring(
      'testDailyByMonthDay',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byDayOfMonth: [1, 3],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 3, 9, 0),
        dateAdapter(1997, 10, 1, 9, 0),
        dateAdapter(1997, 10, 3, 9, 0),
      ],
    );

    testRecurring(
      'testDailyByMonthAndMonthDay',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [5, 7],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)],
    );

    testRecurring(
      'testDailyByWeekDay',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 9, 9, 0)],
    );

    testRecurring(
      'testDailyByMonthAndWeekDay',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)],
    );

    testRecurring(
      'testDailyByMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 2, 3, 9, 0), dateAdapter(1998, 3, 3, 9, 0)],
    );

    testRecurring(
      'testDailyByMonthAndMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 3, 3, 9, 0), dateAdapter(2001, 3, 1, 9, 0)],
    );

    testRecurring(
      'testDailyByHour',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byHourOfDay: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0),
        dateAdapter(1997, 9, 3, 6, 0),
        dateAdapter(1997, 9, 3, 18, 0),
      ],
    );

    testRecurring(
      'testDailyByMinute',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6),
        dateAdapter(1997, 9, 2, 9, 18),
        dateAdapter(1997, 9, 3, 9, 6),
      ],
    );

    testRecurring(
      'testDailyBySecond',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 6),
        dateAdapter(1997, 9, 2, 9, 0, 18),
        dateAdapter(1997, 9, 3, 9, 0, 6),
      ],
    );

    testRecurring(
      'testDailyByHourAndMinute',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6),
        dateAdapter(1997, 9, 2, 18, 18),
        dateAdapter(1997, 9, 3, 6, 6),
      ],
    );

    testRecurring(
      'testDailyByHourAndSecond',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byHourOfDay: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 6),
        dateAdapter(1997, 9, 2, 18, 0, 18),
        dateAdapter(1997, 9, 3, 6, 0, 6),
      ],
    );

    testRecurring(
      'testDailyByMinuteAndSecond',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 6),
        dateAdapter(1997, 9, 2, 9, 6, 18),
        dateAdapter(1997, 9, 2, 9, 18, 6),
      ],
    );

    testRecurring(
      'testDailyByHourAndMinuteAndSecond',
      buildGenerator({
        frequency: 'DAILY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6, 6),
        dateAdapter(1997, 9, 2, 18, 6, 18),
        dateAdapter(1997, 9, 2, 18, 18, 6),
      ],
    );

    testRecurring(
      'calculates daily recurrences correctly across DST boundaries',
      buildGenerator({
        frequency: 'DAILY',
        start: parse('20181101T110000'),
        end: parse('20181106T110000'),
      }),
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
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 2, 10, 0),
        dateAdapter(1997, 9, 2, 11, 0),
      ],
    );

    testRecurring(
      'testHourlyWithEndDate',
      buildGenerator({
        frequency: 'HOURLY',
        start: parse('19970902T090000'),
        end: dateAdapter(1997, 9, 2, 11, 0),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 2, 10, 0),
        dateAdapter(1997, 9, 2, 11, 0),
      ],
    );

    testRecurring(
      'testHourlyInterval',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        interval: 2,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 2, 11, 0),
        dateAdapter(1997, 9, 2, 13, 0),
      ],
    );

    testRecurring(
      'testHourlyIntervalLarge',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        interval: 769,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 10, 4, 10, 0),
        dateAdapter(1997, 11, 5, 11, 0),
      ],
    );

    testRecurring(
      'testHourlyByMonth',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)],
    );

    testRecurring(
      'testHourlyByMonthDay',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byDayOfMonth: [1, 3],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 3, 0, 0), dateAdapter(1997, 9, 3, 1, 0), dateAdapter(1997, 9, 3, 2, 0)],
    );

    testRecurring(
      'testHourlyByMonthAndMonthDay',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [5, 7],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 5, 0, 0), dateAdapter(1998, 1, 5, 1, 0), dateAdapter(1998, 1, 5, 2, 0)],
    );

    testRecurring(
      'testHourlyByWeekDay',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 2, 10, 0),
        dateAdapter(1997, 9, 2, 11, 0),
      ],
    );

    testRecurring(
      'testHourlyByMonthAndWeekDay',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)],
    );

    testRecurring(
      'testHourlyByMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)],
    );

    testRecurring(
      'testHourlyByMonthAndMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)],
    );

    testRecurring(
      'testHourlyByHour',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byHourOfDay: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0),
        dateAdapter(1997, 9, 3, 6, 0),
        dateAdapter(1997, 9, 3, 18, 0),
      ],
    );

    testRecurring(
      'testHourlyByMinute',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6),
        dateAdapter(1997, 9, 2, 9, 18),
        dateAdapter(1997, 9, 2, 10, 6),
      ],
    );

    testRecurring(
      'testHourlyBySecond',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 6),
        dateAdapter(1997, 9, 2, 9, 0, 18),
        dateAdapter(1997, 9, 2, 10, 0, 6),
      ],
    );

    testRecurring(
      'testHourlyByHourAndMinute',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6),
        dateAdapter(1997, 9, 2, 18, 18),
        dateAdapter(1997, 9, 3, 6, 6),
      ],
    );

    testRecurring(
      'testHourlyByHourAndSecond',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byHourOfDay: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 6),
        dateAdapter(1997, 9, 2, 18, 0, 18),
        dateAdapter(1997, 9, 3, 6, 0, 6),
      ],
    );

    testRecurring(
      'testHourlyByMinuteAndSecond',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 6),
        dateAdapter(1997, 9, 2, 9, 6, 18),
        dateAdapter(1997, 9, 2, 9, 18, 6),
      ],
    );

    testRecurring(
      'testHourlyByHourAndMinuteAndSecond',
      buildGenerator({
        frequency: 'HOURLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
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
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 9, 1), dateAdapter(1997, 9, 2, 9, 2)],
    );

    testRecurring(
      'testMinutelyWithEndDate',
      buildGenerator({
        frequency: 'MINUTELY',
        start: parse('19970902T090000'),
        end: dateAdapter(1997, 9, 2, 9, 2),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 9, 1), dateAdapter(1997, 9, 2, 9, 2)],
    );

    testRecurring(
      'testMinutelyInterval',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        interval: 2,
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 9, 2), dateAdapter(1997, 9, 2, 9, 4)],
    );

    testRecurring(
      'testMinutelyIntervalLarge',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        interval: 1501,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 3, 10, 1),
        dateAdapter(1997, 9, 4, 11, 2),
      ],
    );

    testRecurring(
      'testMinutelyByMonth',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)],
    );

    testRecurring(
      'testMinutelyByMonthDay',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byDayOfMonth: [1, 3],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 3, 0, 0), dateAdapter(1997, 9, 3, 0, 1), dateAdapter(1997, 9, 3, 0, 2)],
    );

    testRecurring(
      'testMinutelyByMonthAndMonthDay',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [5, 7],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 5, 0, 0), dateAdapter(1998, 1, 5, 0, 1), dateAdapter(1998, 1, 5, 0, 2)],
    );

    testRecurring(
      'testMinutelyByWeekDay',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 9, 1), dateAdapter(1997, 9, 2, 9, 2)],
    );

    testRecurring(
      'testMinutelyByMonthAndWeekDay',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)],
    );

    testRecurring(
      'testMinutelyByMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)],
    );

    testRecurring(
      'testMinutelyByMonthAndMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)],
    );

    testRecurring(
      'testMinutelyByHour',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byHourOfDay: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0),
        dateAdapter(1997, 9, 2, 18, 1),
        dateAdapter(1997, 9, 2, 18, 2),
      ],
    );

    testRecurring(
      'testMinutelyByMinute',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6),
        dateAdapter(1997, 9, 2, 9, 18),
        dateAdapter(1997, 9, 2, 10, 6),
      ],
    );

    testRecurring(
      'testMinutelyBySecond',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 6),
        dateAdapter(1997, 9, 2, 9, 0, 18),
        dateAdapter(1997, 9, 2, 9, 1, 6),
      ],
    );

    testRecurring(
      'testMinutelyByHourAndMinute',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6),
        dateAdapter(1997, 9, 2, 18, 18),
        dateAdapter(1997, 9, 3, 6, 6),
      ],
    );

    testRecurring(
      'testMinutelyByHourAndSecond',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byHourOfDay: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 6),
        dateAdapter(1997, 9, 2, 18, 0, 18),
        dateAdapter(1997, 9, 2, 18, 1, 6),
      ],
    );

    testRecurring(
      'testMinutelyByMinuteAndSecond',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 6),
        dateAdapter(1997, 9, 2, 9, 6, 18),
        dateAdapter(1997, 9, 2, 9, 18, 6),
      ],
    );

    testRecurring(
      'testMinutelyByHourAndMinuteAndSecond',
      buildGenerator({
        frequency: 'MINUTELY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T180606'),
      }),
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
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 0),
        dateAdapter(1997, 9, 2, 9, 0, 1),
        dateAdapter(1997, 9, 2, 9, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyWithEndDate',
      buildGenerator({
        frequency: 'SECONDLY',
        start: parse('19970902T090000'),
        end: dateAdapter(1997, 9, 2, 9, 0, 2),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 0),
        dateAdapter(1997, 9, 2, 9, 0, 1),
        dateAdapter(1997, 9, 2, 9, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyInterval',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        interval: 2,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 0),
        dateAdapter(1997, 9, 2, 9, 0, 2),
        dateAdapter(1997, 9, 2, 9, 0, 4),
      ],
    );

    testRecurring(
      'testSecondlyIntervalLarge',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        interval: 90061,
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 0),
        dateAdapter(1997, 9, 3, 10, 1, 1),
        dateAdapter(1997, 9, 4, 11, 2, 2),
      ],
    );

    testRecurring(
      'testSecondlyByMonth',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byMonthOfYear: [1, 3],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 1, 0, 0, 0),
        dateAdapter(1998, 1, 1, 0, 0, 1),
        dateAdapter(1998, 1, 1, 0, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByMonthDay',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byDayOfMonth: [1, 3],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 3, 0, 0, 0),
        dateAdapter(1997, 9, 3, 0, 0, 1),
        dateAdapter(1997, 9, 3, 0, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByMonthAndMonthDay',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [5, 7],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 5, 0, 0, 0),
        dateAdapter(1998, 1, 5, 0, 0, 1),
        dateAdapter(1998, 1, 5, 0, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByWeekDay',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 0),
        dateAdapter(1997, 9, 2, 9, 0, 1),
        dateAdapter(1997, 9, 2, 9, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByMonthAndWeekDay',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 1, 0, 0, 0),
        dateAdapter(1998, 1, 1, 0, 0, 1),
        dateAdapter(1998, 1, 1, 0, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 1, 0, 0, 0),
        dateAdapter(1998, 1, 1, 0, 0, 1),
        dateAdapter(1998, 1, 1, 0, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByMonthAndMonthDayAndWeekDay',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byMonthOfYear: [1, 3],
        byDayOfMonth: [1, 3],
        byDayOfWeek: ['TU', 'TH'] as ByDayOfWeek[],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1998, 1, 1, 0, 0, 0),
        dateAdapter(1998, 1, 1, 0, 0, 1),
        dateAdapter(1998, 1, 1, 0, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByHour',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byHourOfDay: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 0),
        dateAdapter(1997, 9, 2, 18, 0, 1),
        dateAdapter(1997, 9, 2, 18, 0, 2),
      ],
    );

    testRecurring(
      'testSecondlyByMinute',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 0),
        dateAdapter(1997, 9, 2, 9, 6, 1),
        dateAdapter(1997, 9, 2, 9, 6, 2),
      ],
    );

    testRecurring(
      'testSecondlyBySecond',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0, 6),
        dateAdapter(1997, 9, 2, 9, 0, 18),
        dateAdapter(1997, 9, 2, 9, 1, 6),
      ],
    );

    testRecurring(
      'testSecondlyByHourAndMinute',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 6, 0),
        dateAdapter(1997, 9, 2, 18, 6, 1),
        dateAdapter(1997, 9, 2, 18, 6, 2),
      ],
    );

    testRecurring(
      'testSecondlyByHourAndSecond',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byHourOfDay: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 18, 0, 6),
        dateAdapter(1997, 9, 2, 18, 0, 18),
        dateAdapter(1997, 9, 2, 18, 1, 6),
      ],
    );

    testRecurring(
      'testSecondlyByMinuteAndSecond',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 6, 6),
        dateAdapter(1997, 9, 2, 9, 6, 18),
        dateAdapter(1997, 9, 2, 9, 18, 6),
      ],
    );

    testRecurring(
      'testSecondlyByHourAndMinuteAndSecond',
      buildGenerator({
        frequency: 'SECONDLY',
        count: 3,
        byHourOfDay: [6, 18],
        byMinuteOfHour: [6, 18],
        bySecondOfMinute: [6, 18],
        start: parse('19970902T090000'),
      }),
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
      buildGenerator({
        frequency: 'DAILY',
        // count: 3,
        start: parse('19970902T090000'),
        end: parse('19970905T080000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)],
    );

    testRecurring(
      'testUntilMatching',
      buildGenerator({
        frequency: 'DAILY',
        // count: 3,
        start: parse('19970902T090000'),
        end: parse('19970904T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)],
    );

    testRecurring(
      'testUntilSingle',
      buildGenerator({
        frequency: 'DAILY',
        // count: 3,
        start: parse('19970902T090000'),
        end: parse('19970902T090000'),
      }),
      [dateAdapter(1997, 9, 2, 9, 0)],
    );

    testRecurring(
      'testUntilEmpty',
      buildGenerator({
        frequency: 'DAILY',
        // count: 3,
        start: parse('19970902T090000'),
        end: parse('19970901T090000'),
      }),
      [],
    );

    testRecurring(
      'testUntilWithDate',
      buildGenerator({
        frequency: 'DAILY',
        // count: 3,
        start: parse('19970902T090000'),
        end: dateAdapter(1997, 9, 5),
      }),
      [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)],
    );
  });

  describe('WKST', () => {
    testRecurring(
      'testWkStIntervalMO',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        interval: 2,
        byDayOfWeek: ['TU', 'SU'] as ByDayOfWeek[],
        weekStart: 'MO',
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 7, 9, 0),
        dateAdapter(1997, 9, 16, 9, 0),
      ],
    );

    testRecurring(
      'testWkStIntervalSU',
      buildGenerator({
        frequency: 'WEEKLY',
        count: 3,
        interval: 2,
        byDayOfWeek: ['TU', 'SU'] as ByDayOfWeek[],
        weekStart: 'SU',
        start: parse('19970902T090000'),
      }),
      [
        dateAdapter(1997, 9, 2, 9, 0),
        dateAdapter(1997, 9, 14, 9, 0),
        dateAdapter(1997, 9, 16, 9, 0),
      ],
    );
  });

  testRecurring(
    'testDTStartIsDate',
    buildGenerator({
      frequency: 'DAILY',
      count: 3,
      start: dateAdapter(1997, 9, 2),
    }),
    [dateAdapter(1997, 9, 2, 0, 0), dateAdapter(1997, 9, 3, 0, 0), dateAdapter(1997, 9, 4, 0, 0)],
  );

  testRecurring(
    'testDTStartWithMicroseconds',
    buildGenerator({
      frequency: 'DAILY',
      count: 3,
      start: parse('19970902T090000.5'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)],
  );

  describe('testMaxYear', () => {
    it('throws error', () => {
      const rule = buildGenerator({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [2],
        byDayOfMonth: [31],
        start: parse('99970902T090000'),
      });

      expect(() => {
        rule.occurrences().toArray();
      }).toThrowError();
    });
  });

  testRecurring(
    'testSubsecondStartYearly',
    buildGenerator({
      frequency: 'YEARLY',
      count: 1,
      start: dateAdapter(2014, 12, 31, 22, 0, 0, 1),
    }),
    [dateAdapter(2014, 12, 31, 22, 0, 0, 1)],
  );
}

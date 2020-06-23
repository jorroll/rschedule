import { context, dateAdapterFn, TIMEZONES, toISOStrings } from '../../../../tests/utilities';

import { DateAdapter, DateAdapterBase } from '@rschedule/core';
import {
  Calendar,
  CollectionsGranularity,
  Dates,
  ICollectionsArgs,
  Rule,
  Schedule,
} from '@rschedule/core/generators';

export default function calendarTests() {
  function toISOStringsCol(calendar: Calendar | DateAdapter[][], args: ICollectionsArgs = {}) {
    if (Array.isArray(calendar)) {
      return calendar.map(dates => dates.map(date => date.toISOString()));
    }

    return calendar
      .collections({ skipEmptyPeriods: true, granularity: 'millisecond', ...args })
      .toArray()
      .map(({ dates }) => dates.map(date => date.toISOString()));
  }

  function testOccurrences(
    name: string,
    calendar: Calendar,
    expectation: DateAdapter[],
    collections: {
      millisecondly: DateAdapter[][];
      yearly: DateAdapter[][];
      monthly: { no: DateAdapter[][]; week: DateAdapter[][] };
    },
  ) {
    describe(name, () => {
      describe('occurrences', () => {
        const index = expectation.length < 4 ? 1 : Math.ceil(expectation.length / 2);

        it('no args', () => {
          expect(toISOStrings(calendar)).toEqual(toISOStrings(expectation));
        });

        if (expectation.length > 1) {
          it('start', () => {
            expect(toISOStrings(calendar, { start: expectation[index] })).toEqual(
              toISOStrings(expectation.slice(index)),
            );
          });

          it('end', () => {
            expect(toISOStrings(calendar, { end: expectation[index] })).toEqual(
              toISOStrings(expectation.slice(0, index + 1)),
            );
          });
        }

        it('reverse', () => {
          expect(toISOStrings(calendar, { reverse: true })).toEqual(
            toISOStrings(expectation.reverse()),
          );
        });

        describe('occursOn', () => {
          it('date', () => {
            for (const date of expectation) {
              expect(calendar.occursOn({ date })).toBeTruthy();
            }
          });

          it('weekday', () => {
            let weekdays: DateAdapter.Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

            for (const date of expectation) {
              const weekday = date.toDateTime().get('weekday');

              expect(calendar.occursOn({ weekday })).toBeTruthy();

              weekdays = weekdays.filter(day => day !== weekday);
            }

            for (const weekday of weekdays) {
              expect(calendar.occursOn({ weekday })).toBeFalsy();
            }
          });
        });
      });

      describe('collections', () => {
        [
          ['millisecond', collections.millisecondly],
          ['year', collections.yearly],
          ['month', collections.monthly.no],
        ].forEach(pair => {
          context(pair[0] as CollectionsGranularity, granularity => {
            const expectations = pair[1] as DateAdapter[][];

            const collectionIndex =
              expectations.length < 4 ? 1 : Math.ceil(expectations.length / 2);

            it('no args', () => {
              expect(toISOStringsCol(calendar, { granularity })).toEqual(
                toISOStringsCol(expectations),
              );
            });

            if (expectations.length > 1) {
              it('start', () => {
                expect(
                  toISOStringsCol(calendar, {
                    granularity,
                    start: expectations[collectionIndex][0],
                  }),
                ).toEqual(toISOStringsCol(expectations.slice(collectionIndex)));
              });

              it('end', () => {
                expect(
                  toISOStringsCol(calendar, {
                    granularity,
                    end: expectations[collectionIndex][0],
                  }),
                ).toEqual(toISOStringsCol(expectations.slice(0, collectionIndex + 1)));
              });
            }
          });
        });

        describe('month', () => {
          describe('w/ weekStart', () => {
            const expectations = collections.monthly.week;

            if (expectations.length === 0) return;

            const index = expectations.length < 4 ? 1 : Math.ceil(expectations.length / 2);

            it('basic args', () => {
              expect(
                toISOStringsCol(calendar, {
                  granularity: 'month',
                  weekStart: 'MO',
                  start: expectations[0][0],
                  end:
                    expectations[expectations.length - 1][
                    expectations[expectations.length - 1].length - 1
                    ],
                }),
              ).toEqual(toISOStringsCol(expectations));
            });

            if (expectations.length > 1) {
              it('start', () => {
                expect(
                  toISOStringsCol(calendar, {
                    granularity: 'month',
                    weekStart: 'MO',
                    start: expectations[index][0],
                    end:
                      expectations[expectations.length - 1][
                      expectations[expectations.length - 1].length - 1
                      ],
                  }),
                ).toEqual(toISOStringsCol(expectations.slice(index)));
              });
            }
          });
        });
      });
    });
  }

  describe('Calendar', () => {
    context(DateAdapterBase.adapter.name, () => {
      // const timezones = !DateAdapterBase.adapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];

      const timezones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = dateAdapterFn(timezone);

          describe('CalendarClass', () => {
            it('is instantiable', () =>
              expect(new Calendar({ timezone })).toBeInstanceOf(Calendar));
          });

          // tests issue https://gitlab.com/john.carroll.p/rschedule/-/issues/41
          it('_run `skipToDate` must be in the future', () => {
            const first = dateAdapter(1997, 9, 2, 9).toDateTime();
            const second = dateAdapter(1998, 9, 2, 9).toDateTime();
            const third = dateAdapter(1999, 9, 2, 9).toDateTime();

            const generator1 = new Calendar({
              schedules: new Dates({
                dates: [first, second, third],
              }),
              timezone,
            });

            const iterator1 = generator1._run();

            expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
            expect(() => iterator1.next({ skipToDate: first })).toThrowError();

            const iterator2 = generator1._run();

            expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
            expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(third.valueOf());
            expect(() => iterator2.next({ skipToDate: first })).toThrowError();

            // test second with a Schedule source
            const generator2 = new Calendar({
              schedules: new Schedule({
                rrules: [
                  // YearlyByMonthAndMonthDay
                  {
                    frequency: 'YEARLY',
                    start: first,
                    count: 3,
                    interval: 1,
                    weekStart: 'MO',
                  },
                ],
              }),
              timezone,
            });

            const iterator3 = generator2._run();

            expect(iterator3.next().value!.valueOf()).toEqual(first.valueOf());
            expect(() => iterator3.next({ skipToDate: first })).toThrowError();

            const iterator4 = generator2._run();

            expect(iterator4.next().value!.valueOf()).toEqual(first.valueOf());
            expect(iterator4.next({ skipToDate: third }).value!.valueOf()).toEqual(third.valueOf());
            expect(() => iterator4.next({ skipToDate: first })).toThrowError();
          });

          it('skipEmptyPeriods: false', () => {
            const calendar = new Calendar({
              schedules: new Schedule({
                rrules: [
                  // YearlyByMonthAndMonthDay
                  {
                    frequency: 'YEARLY',
                    count: 3,
                    byMonthOfYear: [1, 3],
                    byDayOfMonth: [5, 7],
                    start: dateAdapter(1997, 9, 2, 9),
                  },
                ],
              }),
              timezone,
            });

            let result = calendar
              .collections({ granularity: 'year', start: dateAdapter(1997, 9, 2, 9) })
              .toArray()
              .map(({ dates }) => dates.map(date => date.toISOString()));

            expect(result).toEqual([
              [],
              [
                dateAdapter(1998, 1, 5, 9, 0).toISOString(),
                dateAdapter(1998, 1, 7, 9, 0).toISOString(),
                dateAdapter(1998, 3, 5, 9, 0).toISOString(),
              ],
            ]);

            result = calendar
              .collections({ granularity: 'month', start: dateAdapter(1997, 9, 2, 9) })
              .toArray()
              .map(({ dates }) => dates.map(date => date.toISOString()));

            expect(result).toEqual([
              [],
              [],
              [],
              [],
              [
                dateAdapter(1998, 1, 5, 9, 0).toISOString(),
                dateAdapter(1998, 1, 7, 9, 0).toISOString(),
              ],
              [],
              [dateAdapter(1998, 3, 5, 9, 0).toISOString()],
            ]);
          });

          testOccurrences(
            '1 schedule & 1 rule',
            new Calendar({
              schedules: new Schedule({
                rrules: [
                  // YearlyByMonthAndMonthDay
                  {
                    frequency: 'YEARLY',
                    count: 3,
                    byMonthOfYear: [1, 3],
                    byDayOfMonth: [5, 7],
                    start: dateAdapter(1997, 9, 2, 9),
                  },
                ],
              }),
              timezone,
            }),
            [
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
            {
              millisecondly: [
                [dateAdapter(1998, 1, 5, 9, 0)],
                [dateAdapter(1998, 1, 7, 9, 0)],
                [dateAdapter(1998, 3, 5, 9, 0)],
              ],
              yearly: [
                [
                  dateAdapter(1998, 1, 5, 9, 0),
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(1998, 3, 5, 9, 0),
                ],
              ],
              monthly: {
                no: [
                  [dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0)],
                  [dateAdapter(1998, 3, 5, 9, 0)],
                ],
                week: [[dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0)]],
              },
            },
          );

          testOccurrences(
            '2 schedules w/ rrules',
            new Calendar({
              schedules: [
                new Schedule({
                  rrules: [
                    // YearlyByMonthAndMonthDay
                    {
                      frequency: 'YEARLY',
                      count: 3,
                      byMonthOfYear: [1, 3],
                      byDayOfMonth: [5, 7],
                      start: dateAdapter(1997, 9, 2, 9),
                    },
                    // WeeklyIntervalLarge
                    {
                      frequency: 'WEEKLY',
                      count: 2,
                      interval: 20,
                      start: dateAdapter(1997, 9, 2, 9),
                    },
                  ],
                }),
                new Schedule({
                  rrules: [
                    // DailyByMonthDayAndWeekDay
                    {
                      frequency: 'DAILY',
                      count: 3,
                      byDayOfMonth: [1, 3],
                      byDayOfWeek: ['TU', 'TH'],
                      start: dateAdapter(1997, 9, 2, 9),
                    },
                  ],
                }),
              ],
              timezone,
            }),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 1, 20, 9, 0),
              dateAdapter(1998, 2, 3, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
            {
              millisecondly: [
                [dateAdapter(1997, 9, 2, 9, 0)],
                [dateAdapter(1998, 1, 1, 9, 0)],
                [dateAdapter(1998, 1, 5, 9, 0)],
                [dateAdapter(1998, 1, 7, 9, 0)],
                [dateAdapter(1998, 1, 20, 9, 0)],
                [dateAdapter(1998, 2, 3, 9, 0)],
                [dateAdapter(1998, 3, 3, 9, 0)],
                [dateAdapter(1998, 3, 5, 9, 0)],
              ],
              yearly: [
                [dateAdapter(1997, 9, 2, 9, 0)],
                [
                  dateAdapter(1998, 1, 1, 9, 0),
                  dateAdapter(1998, 1, 5, 9, 0),
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(1998, 1, 20, 9, 0),
                  dateAdapter(1998, 2, 3, 9, 0),
                  dateAdapter(1998, 3, 3, 9, 0),
                  dateAdapter(1998, 3, 5, 9, 0),
                ],
              ],
              monthly: {
                no: [
                  [dateAdapter(1997, 9, 2, 9, 0)],
                  [
                    dateAdapter(1998, 1, 1, 9, 0),
                    dateAdapter(1998, 1, 5, 9, 0),
                    dateAdapter(1998, 1, 7, 9, 0),
                    dateAdapter(1998, 1, 20, 9, 0),
                  ],
                  [dateAdapter(1998, 2, 3, 9, 0)],
                  [dateAdapter(1998, 3, 3, 9, 0), dateAdapter(1998, 3, 5, 9, 0)],
                ],
                week: [
                  [
                    dateAdapter(1998, 1, 1, 9, 0),
                    dateAdapter(1998, 1, 5, 9, 0),
                    dateAdapter(1998, 1, 7, 9, 0),
                    dateAdapter(1998, 1, 20, 9, 0),
                  ],
                ],
              },
            },
          );

          testOccurrences(
            '1 schedule & 1 dates',
            new Calendar({
              schedules: [
                new Schedule({
                  rdates: [dateAdapter(1998, 1, 1, 9, 0)],
                }),
                new Dates({
                  dates: [
                    dateAdapter(1998, 1, 1, 9, 0),
                    dateAdapter(2000, 1, 1, 9, 0),
                    dateAdapter(2017, 1, 1, 9, 0),
                  ],
                }),
              ],
              timezone,
            }),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(2000, 1, 1, 9, 0),
              dateAdapter(2017, 1, 1, 9, 0),
            ],
            {
              millisecondly: [
                [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
                [dateAdapter(2000, 1, 1, 9, 0)],
                [dateAdapter(2017, 1, 1, 9, 0)],
              ],
              yearly: [
                [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
                [dateAdapter(2000, 1, 1, 9, 0)],
                [dateAdapter(2017, 1, 1, 9, 0)],
              ],
              monthly: {
                no: [
                  [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
                  [dateAdapter(2000, 1, 1, 9, 0)],
                  [dateAdapter(2017, 1, 1, 9, 0)],
                ],
                week: [[dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)]],
              },
            },
          );

          testOccurrences(
            '2 schedules w/ rdates & exdates',
            new Calendar({
              schedules: [
                new Schedule({
                  rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
                  exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
                }),
                new Schedule({
                  rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
                  exdates: [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
                }),
              ],
              timezone,
            }),
            [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
            {
              millisecondly: [[dateAdapter(2000, 1, 1, 9, 0)], [dateAdapter(2017, 1, 1, 9, 0)]],
              yearly: [[dateAdapter(2000, 1, 1, 9, 0)], [dateAdapter(2017, 1, 1, 9, 0)]],
              monthly: {
                no: [[dateAdapter(2000, 1, 1, 9, 0)], [dateAdapter(2017, 1, 1, 9, 0)]],
                week: [],
              },
            },
          );

          testOccurrences(
            '3 schedules',
            new Calendar({
              schedules: [
                new Schedule({
                  rrules: [
                    // YearlyByMonthAndMonthDay
                    {
                      frequency: 'YEARLY',
                      count: 3,
                      byMonthOfYear: [1, 3],
                      byDayOfMonth: [5, 7],
                      start: dateAdapter(1997, 9, 2, 9),
                    },
                    // WeeklyIntervalLarge
                    {
                      frequency: 'WEEKLY',
                      count: 2,
                      interval: 20,
                      start: dateAdapter(1997, 9, 2, 9),
                    },
                  ],
                }),
                new Schedule({
                  rrules: [
                    // DailyByMonthDayAndWeekDay
                    {
                      frequency: 'DAILY',
                      count: 3,
                      byDayOfMonth: [1, 3],
                      byDayOfWeek: ['TU', 'TH'],
                      start: dateAdapter(1997, 9, 2, 9),
                    },
                  ],
                }),
                new Schedule({
                  rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
                  exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
                }),
              ],
              timezone,
            }),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 1, 20, 9, 0),
              dateAdapter(1998, 2, 3, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
              dateAdapter(2000, 1, 1, 9, 0),
            ],
            {
              millisecondly: [
                [dateAdapter(1997, 9, 2, 9, 0)],
                [dateAdapter(1998, 1, 1, 9, 0)],
                [dateAdapter(1998, 1, 5, 9, 0)],
                [dateAdapter(1998, 1, 7, 9, 0)],
                [dateAdapter(1998, 1, 20, 9, 0)],
                [dateAdapter(1998, 2, 3, 9, 0)],
                [dateAdapter(1998, 3, 3, 9, 0)],
                [dateAdapter(1998, 3, 5, 9, 0)],
                [dateAdapter(2000, 1, 1, 9, 0)],
              ],
              yearly: [
                [dateAdapter(1997, 9, 2, 9, 0)],
                [
                  dateAdapter(1998, 1, 1, 9, 0),
                  dateAdapter(1998, 1, 5, 9, 0),
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(1998, 1, 20, 9, 0),
                  dateAdapter(1998, 2, 3, 9, 0),
                  dateAdapter(1998, 3, 3, 9, 0),
                  dateAdapter(1998, 3, 5, 9, 0),
                ],
                [dateAdapter(2000, 1, 1, 9, 0)],
              ],
              monthly: {
                no: [
                  [dateAdapter(1997, 9, 2, 9, 0)],
                  [
                    dateAdapter(1998, 1, 1, 9, 0),
                    dateAdapter(1998, 1, 5, 9, 0),
                    dateAdapter(1998, 1, 7, 9, 0),
                    dateAdapter(1998, 1, 20, 9, 0),
                  ],
                  [dateAdapter(1998, 2, 3, 9, 0)],
                  [dateAdapter(1998, 3, 3, 9, 0), dateAdapter(1998, 3, 5, 9, 0)],
                  [dateAdapter(2000, 1, 1, 9, 0)],
                ],
                week: [
                  [
                    dateAdapter(1998, 1, 1, 9, 0),
                    dateAdapter(1998, 1, 5, 9, 0),
                    dateAdapter(1998, 1, 7, 9, 0),
                    dateAdapter(1998, 1, 20, 9, 0),
                  ],
                  [dateAdapter(1998, 2, 3, 9, 0)],
                ],
              },
            },
          );

          it('retains generators', () => {
            // YearlyByMonthAndMonthDay
            const rule1 = new Rule(
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: dateAdapter(1997, 9, 2, 9),
              },
              { data: 'rule 1' },
            );

            const schedule1 = new Schedule({
              rrules: [rule1],
              data: 'schedule 1',
              timezone,
            });

            const dates1 = new Dates({
              dates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
              data: 'dates 1',
              timezone,
            });

            const schedule2 = new Schedule({
              rdates: dates1,
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
              data: 'schedule 2',
              timezone,
            });

            const calendar = new Calendar({
              schedules: [schedule1, schedule2],
              timezone,
              data: 'calendar 1',
            });

            let adapter = calendar.occurrences({ start: dateAdapter(), take: 1 }).toArray()[0];

            // expect(adapter.generators).toEqual([
            //   calendar,
            //   schedule1,
            //   rule1,
            // ])

            adapter = calendar
              .occurrences({ start: dateAdapter(2000, 1, 1, 9, 0), take: 1 })
              .toArray()[0];

            expect(adapter.generators).toEqual([calendar, schedule2, dates1]);
          });
        });
      });
    });
  });
}

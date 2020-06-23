import { context, dateAdapterFn, TIMEZONES, toISOStrings } from '../../../../tests/utilities';

import { Schedule } from '@rschedule/core/generators';

import { DateAdapter, DateAdapterBase } from '@rschedule/core';

export default function scheduleTests() {
  function testOccurrences(name: string, schedule: Schedule, expectation: DateAdapter[]) {
    describe(name, () => {
      const index = expectation.length < 4 ? 1 : Math.ceil(expectation.length / 2);

      it('no args', () => {
        expect(toISOStrings(schedule)).toEqual(toISOStrings(expectation));
      });

      if (expectation.length > 1) {
        it('start', () => {
          expect(toISOStrings(schedule, { start: expectation[index] })).toEqual(
            toISOStrings(expectation.slice(index)),
          );
        });

        it('end', () => {
          expect(toISOStrings(schedule, { end: expectation[index] })).toEqual(
            toISOStrings(expectation.slice(0, index + 1)),
          );
        });
      }

      it('reverse', () => {
        expect(toISOStrings(schedule, { reverse: true })).toEqual(
          toISOStrings(expectation.reverse()),
        );
      });

      describe('occursOn', () => {
        it('date', () => {
          for (const date of expectation) {
            expect(schedule.occursOn({ date })).toBeTruthy();
          }
        });

        it('weekday', () => {
          let weekdays: DateAdapter.Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

          for (const date of expectation) {
            const weekday = date.toDateTime().get('weekday');

            expect(schedule.occursOn({ weekday })).toBeTruthy();

            weekdays = weekdays.filter(day => day !== weekday);
          }

          for (const weekday of weekdays) {
            expect(schedule.occursOn({ weekday })).toBeFalsy();
          }
        });
      });
    });
  }

  describe('Schedule', () => {
    context(DateAdapterBase.adapter.name, () => {
      // const timezones: (string | null)[] = !DateAdapterBase.adapter.hasTimezoneSupport
      //   ? ['UTC']
      //   : ['UTC'];

      const timezones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = dateAdapterFn(timezone);

          describe('ScheduleClass', () => {
            it('is instantiable', () =>
              expect(new Schedule({ timezone })).toBeInstanceOf(Schedule));
          });

          describe('bugs', () => {
            if (DateAdapterBase.adapter.hasTimezoneSupport) {
              // https://gitlab.com/john.carroll.p/rschedule/issues/35
              it('run start arg is in different time zone', () => {
                let schedule = new Schedule({
                  timezone: 'America/Phoenix',
                  rrules: [
                    {
                      frequency: 'WEEKLY',
                      byDayOfWeek: ['SU'],
                      start: dateAdapter(2019, 10, 16, 12, 30, { timezone: 'America/Phoenix' }),
                    },
                  ],
                  rdates: [dateAdapter(2019, 11, 11, 12, 30, { timezone: 'America/Phoenix' })],
                });

                schedule = schedule.set('timezone', 'America/Toronto');

                expect(schedule.timezone).toBe('America/Toronto');
                expect(schedule.rrules[0].timezone).toBe('America/Toronto');
                expect(schedule.rdates.timezone).toBe('America/Toronto');

                const adapters = schedule
                  .occurrences({
                    start: dateAdapter(2019, 10, 13),
                    take: 4,
                  })
                  .toArray();

                adapters.forEach(adapter => {
                  expect(adapter.generators.length).toBe(2);
                  expect(adapter.generators[0]).toBe(schedule);
                });

                const dates = adapters.map(({ date }) => date);

                expect(dates).toEqual([
                  dateAdapter(2019, 10, 20, 15, 30, { timezone: 'America/Toronto' }).date,
                  dateAdapter(2019, 10, 27, 15, 30, { timezone: 'America/Toronto' }).date,
                  dateAdapter(2019, 11, 3, 14, 30, { timezone: 'America/Toronto' }).date,
                  dateAdapter(2019, 11, 10, 14, 30, { timezone: 'America/Toronto' }).date,
                ]);
              });
            }

            // tests issue https://gitlab.com/john.carroll.p/rschedule/-/issues/41
            it('_run `skipToDate` must be in the future', () => {
              const first = dateAdapter(1997, 9, 2, 9).toDateTime();
              const second = dateAdapter(1998, 9, 2, 9).toDateTime();
              const third = dateAdapter(1999, 9, 2, 9).toDateTime();

              const generator = new Schedule({
                timezone,
                rrules: [
                  {
                    frequency: 'YEARLY',
                    start: first,
                    count: 3,
                    interval: 1,
                    weekStart: 'MO',
                  },
                ],
              });

              const iterator1 = generator._run();

              expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
              expect(() => iterator1.next({ skipToDate: first })).toThrowError();

              const iterator2 = generator._run();

              expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
              expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(
                third.valueOf(),
              );
              expect(() => iterator2.next({ skipToDate: first })).toThrowError();
            });
          });

          testOccurrences(
            '1 rule',
            new Schedule({
              timezone,
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
            [
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
          );

          testOccurrences(
            '3 rules',
            new Schedule({
              timezone,
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
          );

          testOccurrences(
            'rdates & duplicate',
            new Schedule({
              timezone,
              rdates: [
                dateAdapter(1998, 1, 1, 9, 0).date,
                dateAdapter(1998, 1, 1, 9, 0).date,
                dateAdapter(2000, 1, 1, 9, 0).date,
                dateAdapter(2017, 1, 1, 9, 0).date,
              ],
            }),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(2000, 1, 1, 9, 0),
              dateAdapter(2017, 1, 1, 9, 0),
            ],
          );

          testOccurrences(
            'exdates',
            new Schedule({
              timezone,
              exdates: [dateAdapter(1998, 1, 20, 9, 0).date, dateAdapter(1998, 1, 1, 9, 0).date],
            }),
            [],
          );

          testOccurrences(
            'rdates & exdates',
            new Schedule({
              timezone,
              rdates: [
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(2000, 1, 1, 9, 0),
                dateAdapter(2017, 1, 1, 9, 0),
              ],
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
          );

          testOccurrences(
            'rdates & exdates 2',
            new Schedule({
              rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
              timezone,
            }),
            [dateAdapter(2000, 1, 1, 9, 0)],
          );

          testOccurrences(
            'rdates & exdates cancelling',
            new Schedule({
              timezone,
              rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
              exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
            }),
            [],
          );

          testOccurrences(
            'rules & exdates',
            new Schedule({
              timezone,
              rrules: [
                {
                  frequency: 'WEEKLY',
                  start: dateAdapter(2018, 8, 28),
                  end: dateAdapter(2018, 9, 25),
                  byDayOfWeek: ['TU'],
                },
              ],
              exdates: [dateAdapter(2018, 9, 11)],
              rdates: [dateAdapter(2018, 9, 22)],
            }),
            [
              dateAdapter(2018, 8, 28),
              dateAdapter(2018, 9, 4),
              dateAdapter(2018, 9, 18),
              dateAdapter(2018, 9, 22),
              dateAdapter(2018, 9, 25),
            ],
          );

          testOccurrences(
            'rrules & rdates & exdates',
            new Schedule({
              timezone,
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
                // DailyByMonthDayAndWeekDay
                {
                  frequency: 'DAILY',
                  count: 3,
                  byDayOfMonth: [1, 3],
                  byDayOfWeek: ['TU', 'TH'],
                  start: dateAdapter(1997, 9, 2, 9),
                },
              ],
              rdates: [
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(2000, 1, 1, 9, 0),
                dateAdapter(2017, 1, 1, 9, 0),
              ],
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [
              dateAdapter(1997, 9, 2, 9, 0),
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 2, 3, 9, 0),
              dateAdapter(1998, 3, 3, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
              dateAdapter(2000, 1, 1, 9, 0),
              dateAdapter(2017, 1, 1, 9, 0),
            ],
          );
        });
      });
    });
  });
}

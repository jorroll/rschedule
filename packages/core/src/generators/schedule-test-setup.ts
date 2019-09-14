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
      // const timezones: (string | null)[] = !DateAdapterBase.adapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];

      const timezones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = dateAdapterFn(timezone);

          describe('ScheduleClass', () => {
            it('is instantiable', () =>
              expect(new Schedule({ timezone })).toBeInstanceOf(Schedule));
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

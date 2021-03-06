import { DateAdapter, DateAdapterBase } from '@rschedule/core';

import { context, dateAdapterFn, TIMEZONES, toISOStrings } from '../../../tests/utilities';

import { VEvent, RRule } from '@rschedule/ical-tools';
import { Dates } from '@rschedule/core/generators';
import MockDate from 'mockdate';

export default function veventTests() {
  function testOccurrences(name: string, schedule: VEvent, expectation: DateAdapter[]) {
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

  describe('VEvent', () => {
    context(DateAdapterBase.adapter.name, () => {
      // const timezones: (string | null)[] = !DateAdapterBase.adapter.hasTimezoneSupport
      //   ? ['UTC']
      //   : ['UTC'];

      const timezones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = dateAdapterFn(timezone);

          describe('VEventClass', () => {
            it('is instantiable', () => {
              expect(new VEvent({ start: dateAdapter() })).toBeInstanceOf(VEvent);
            });
          });

          describe('set', () => {
            let vEvent: VEvent;

            beforeEach(() => {
              vEvent = new VEvent({
                start: dateAdapter(2012, 5, 24),
                rrules: [
                  {
                    frequency: 'WEEKLY',
                    end: dateAdapter(2012, 6, 30),
                  },
                ],
              });
            });

            it('timezone', () => {
              expect(vEvent.timezone).toEqual(timezone);

              for (const rule of vEvent.rrules) {
                expect(rule.timezone).toEqual(timezone);
              }

              const newTimezone = 'UTC';

              vEvent = vEvent.set('timezone', newTimezone);

              expect(vEvent.timezone).toEqual(newTimezone);

              for (const rule of vEvent.rrules) {
                expect(rule.timezone).toEqual(newTimezone);
              }
            });

            it('start', () => {
              const start = dateAdapter(2012, 5, 24);

              expect(vEvent.start).toEqual(start);

              for (const rule of vEvent.rrules) {
                expect(rule.options.start).toEqual(start);
              }

              const newStart = dateAdapter(2012, 6, 10);

              vEvent = vEvent.set('start', newStart);

              expect(vEvent.start).toEqual(newStart);

              for (const rule of vEvent.rrules) {
                expect(rule.options.start).toEqual(newStart);
              }
            });

            it('rrules', () => {
              expect(vEvent.rrules).toEqual([
                new RRule({
                  start: dateAdapter(2012, 5, 24),
                  frequency: 'WEEKLY',
                  end: dateAdapter(2012, 6, 30),
                }),
              ]);

              expect(() => {
                vEvent.set('rrules', [
                  new RRule({
                    start: dateAdapter(2011, 1, 3),
                    frequency: 'DAILY',
                  }),
                ]);
              }).toThrow();

              const rrules = [
                new RRule({
                  start: dateAdapter(2012, 5, 24),
                  frequency: 'DAILY',
                }),
                new RRule({
                  start: dateAdapter(2012, 5, 24),
                  frequency: 'WEEKLY',
                  end: dateAdapter(2012, 6, 30),
                }),
              ];

              vEvent = vEvent.set('rrules', rrules);

              expect(vEvent.rrules).toEqual(rrules);
            });

            it('exrules', () => {
              expect(vEvent.exrules).toEqual([]);

              expect(() => {
                vEvent.set('exrules', [
                  new RRule({
                    start: dateAdapter(2011, 1, 3),
                    frequency: 'DAILY',
                  }),
                ]);
              }).toThrow();

              const exrules = [
                new RRule({
                  start: dateAdapter(2012, 5, 24),
                  frequency: 'DAILY',
                }),
                new RRule({
                  start: dateAdapter(2012, 5, 24),
                  frequency: 'WEEKLY',
                  end: dateAdapter(2012, 6, 30),
                }),
              ];

              vEvent = vEvent.set('exrules', exrules);

              expect(vEvent.exrules).toEqual(exrules);
            });

            it('rdates', () => {
              expect(vEvent.rdates).toEqual(new Dates({ timezone }));

              const rdates = new Dates({
                dates: [dateAdapter(2015, 1, 12)],
                timezone,
              });

              vEvent = vEvent.set('rdates', rdates);

              expect(vEvent.rdates).toEqual(rdates);
            });

            it('exdates', () => {
              expect(vEvent.exdates).toEqual(new Dates({ timezone }));

              const exdates = new Dates({
                dates: [dateAdapter(2015, 1, 12)],
                timezone,
              });

              vEvent = vEvent.set('exdates', exdates);

              expect(vEvent.exdates).toEqual(exdates);
            });
          });

          describe('specific bugs', () => {
            describe.skip('generates an RFC-compliant occurrence of an event in the BST->GMT boundary when generating it at a local time', () => {
              /**
               * This test was added in response to https://gitlab.com/john.carroll.p/rschedule/-/issues/66.
               * It appears to be a bug with the Luxon library and not with rSchedule based solely off the fact that
               * moment-timezone and js-joda are not affected. Since work was put into adding the test, I'm going to keep it
               * but skip it because the LuxonDateAdapter is currently failing.
               */
              function runTest() {
                if (!DateAdapterBase.adapter.hasTimezoneSupport) return;

                const start = dateAdapter(2021, 10, 30, 23, { timezone: 'UTC' });
                const end = dateAdapter(2021, 10, 31, 23, 59, 59, 999, { timezone: 'UTC' });

                const vEvent =
                  'BEGIN:VEVENT\n' +
                  'DTSTART;TZID=Europe/London:20210628T014500\n' +
                  'DTEND;TZID=Europe/London:20210628T020000\n' +
                  'RRULE:FREQ=DAILY\n' +
                  'END:VEVENT';

                const parsed = VEvent.fromICal(vEvent)[0];

                const occurrences = parsed.occurrences({ start, end }).toArray();

                expect(occurrences[0].toISOString()).toEqual(
                  dateAdapter(2021, 10, 31, 0, 45, { timezone: 'UTC' }).toISOString(),
                );
              }

              it('before the change', () => {
                MockDate.set(new Date(2021, 9, 31));
                runTest();
                MockDate.reset();
              });

              it('after the change', () => {
                MockDate.set(new Date(2021, 10, 1));
                runTest();
                MockDate.reset();
              });
            });
          });

          testOccurrences(
            '1 rule',
            new VEvent({
              start: dateAdapter(1998, 1, 5, 9, 0),
              rrules: [
                // YearlyByMonthAndMonthDay
                {
                  frequency: 'YEARLY',
                  count: 3,
                  byMonthOfYear: [1, 3],
                  byDayOfMonth: [5, 7],
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
            '1 rule & unique start',
            new VEvent({
              start: dateAdapter(1997, 9, 2, 9),
              rrules: [
                // YearlyByMonthAndMonthDay
                {
                  frequency: 'YEARLY',
                  count: 3,
                  byMonthOfYear: [1, 3],
                  byDayOfMonth: [5, 7],
                },
              ],
            }),
            [
              dateAdapter(1997, 9, 2, 9),
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
          );

          testOccurrences(
            '3 rules',
            new VEvent({
              start: dateAdapter(1997, 9, 2, 9),
              rrules: [
                // YearlyByMonthAndMonthDay
                {
                  frequency: 'YEARLY',
                  count: 3,
                  byMonthOfYear: [1, 3],
                  byDayOfMonth: [5, 7],
                },
                // WeeklyIntervalLarge
                {
                  frequency: 'WEEKLY',
                  count: 2,
                  interval: 20,
                },
                // DailyByMonthDayAndWeekDay
                {
                  frequency: 'DAILY',
                  count: 3,
                  byDayOfMonth: [1, 3],
                  byDayOfWeek: ['TU', 'TH'],
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
            new VEvent({
              start: dateAdapter(1998, 1, 1, 9, 0),
              rdates: [
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(2000, 1, 1, 9, 0),
                dateAdapter(2017, 1, 1, 9, 0),
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
            new VEvent({
              start: dateAdapter(1998, 1, 1, 9, 0),
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [],
          );

          testOccurrences(
            'rdates & exdates',
            new VEvent({
              start: dateAdapter(1998, 1, 1, 9, 0),
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
            new VEvent({
              start: dateAdapter(1998, 1, 1, 9, 0),
              rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [dateAdapter(2000, 1, 1, 9, 0)],
          );

          testOccurrences(
            'rdates & exdates cancelling',
            new VEvent({
              start: dateAdapter(1998, 1, 1, 9, 0),
              rdates: [dateAdapter(1998, 1, 1, 9, 0)],
              exdates: [dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [],
          );

          testOccurrences(
            'rules & exdates',
            new VEvent({
              start: dateAdapter(2018, 8, 28),
              rrules: [
                {
                  frequency: 'WEEKLY',
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
            new VEvent({
              start: dateAdapter(1997, 9, 2, 9),
              rrules: [
                // YearlyByMonthAndMonthDay
                {
                  frequency: 'YEARLY',
                  count: 3,
                  byMonthOfYear: [1, 3],
                  byDayOfMonth: [5, 7],
                },
                // WeeklyIntervalLarge
                {
                  frequency: 'WEEKLY',
                  count: 2,
                  interval: 20,
                },
                // DailyByMonthDayAndWeekDay
                {
                  frequency: 'DAILY',
                  count: 3,
                  byDayOfMonth: [1, 3],
                  byDayOfWeek: ['TU', 'TH'],
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

import { VEvent } from '@rschedule/ical-tools';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import { DateAdapter as DateAdapterConstructor, IDateAdapter } from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime as LuxonDateTime } from 'luxon';
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
  toISOStrings,
} from './utilities';

function testOccurrences(
  name: string,
  schedule: VEvent<typeof DateAdapterConstructor>,
  expectation: DateAdapterConstructor[],
) {
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
        let weekdays: IDateAdapter.Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

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

const DATE_ADAPTERS = [
  [StandardDateAdapter, standardDatetimeFn],
  [MomentDateAdapter, momentDatetimeFn],
  [MomentTZDateAdapter, momentTZDatetimeFn],
  [LuxonDateAdapter, luxonDatetimeFn],
] as [
  [typeof StandardDateAdapter, DatetimeFn<Date>],
  [typeof MomentDateAdapter, DatetimeFn<MomentST>],
  [typeof MomentTZDateAdapter, DatetimeFn<MomentTZ>],
  [typeof LuxonDateAdapter, DatetimeFn<LuxonDateTime>]
];

describe('VEvent', () => {
  DATE_ADAPTERS.forEach(dateAdapterSet => {
    environment(dateAdapterSet, dateAdapterSet => {
      const [DateAdapter, datetime] = dateAdapterSet as [
        typeof DateAdapterConstructor,
        DatetimeFn<any>
      ];

      // const timezones: (string | null)[] = !DateAdapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];

      const timezones = !DateAdapter.hasTimezoneSupport ? ([null, 'UTC'] as const) : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, timezone);

          describe('VEventClass', () => {
            it('is instantiable', () => {
              expect(new VEvent({ start: dateAdapter(), dateAdapter: DateAdapter })).toBeInstanceOf(
                VEvent,
              );
            });
          });

          testOccurrences(
            '1 rule',
            new VEvent({
              start: dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [],
          );

          testOccurrences(
            'rdates & exdates',
            new VEvent({
              start: dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
              rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [dateAdapter(2000, 1, 1, 9, 0)],
          );

          testOccurrences(
            'rdates & exdates cancelling',
            new VEvent({
              start: dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter: DateAdapter,
              rdates: [dateAdapter(1998, 1, 1, 9, 0)],
              exdates: [dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [],
          );

          testOccurrences(
            'rules & exdates',
            new VEvent({
              start: dateAdapter(2018, 8, 28),
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
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
});

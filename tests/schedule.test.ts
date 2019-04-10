import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  DateAdapter as DateAdapterConstructor,
  HasOccurrences,
  IOccurrencesArgs,
  IProvidedRuleOptions,
  RScheduleConfig,
  Schedule,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime as LuxonDateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import {
  context,
  DatetimeFn,
  dateTimeFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  standardDatetimeFn,
  timezoneDateAdapterFn,
  timezoneIsoStringFn,
  TIMEZONES,
  toISOStrings,
} from './utilities';

function testOccurrences(
  name: string,
  schedule: Schedule<typeof DateAdapterConstructor>,
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

describe('Schedule', () => {
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
          RScheduleConfig.defaultDateAdapter = DateAdapter;
          RScheduleConfig.defaultTimezone = timezone;

          const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, timezone);

          describe('ScheduleClass', () => {
            it('is instantiable', () =>
              expect(new Schedule({ dateAdapter: DateAdapter })).toBeInstanceOf(Schedule));
          });

          testOccurrences(
            '1 rule',
            new Schedule({
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
              exdates: [dateAdapter(1998, 1, 20, 9, 0).date, dateAdapter(1998, 1, 1, 9, 0).date],
            }),
            [],
          );

          testOccurrences(
            'rdates & exdates',
            new Schedule({
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
            new Schedule({
              rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
              exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
            }),
            [dateAdapter(2000, 1, 1, 9, 0)],
          );

          testOccurrences(
            'rdates & exdates cancelling',
            new Schedule({
              dateAdapter: DateAdapter,
              rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
              exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
            }),
            [],
          );

          testOccurrences(
            'rules & exdates',
            new Schedule({
              dateAdapter: DateAdapter,
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
              dateAdapter: DateAdapter,
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
});

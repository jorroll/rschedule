import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  Calendar,
  CollectionsGranularity,
  DateAdapter,
  DateAdapter as DateAdapterConstructor,
  Dates,
  HasOccurrences,
  ICollectionsArgs,
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

export function toISOStringsCol<T extends typeof DateAdapter>(
  calendar: Calendar<T> | DateAdapter[][],
  args: ICollectionsArgs<T> = {},
) {
  if (Array.isArray(calendar)) {
    return calendar.map(dates => dates.map(date => date.toISOString()));
  }

  return calendar
    .collections(args)
    .toArray()!
    .map(occ => occ.dates.map(date => date.toISOString()));
}

function testOccurrences(
  name: string,
  calendar: Calendar<typeof DateAdapterConstructor>,
  expectation: DateAdapterConstructor[],
  collections: {
    instantaniously: DateAdapterConstructor[][];
    yearly: DateAdapterConstructor[][];
    monthly: { no: DateAdapterConstructor[][]; week: DateAdapterConstructor[][] };
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
    });

    describe('collections', () => {
      [
        ['INSTANTANIOUSLY', collections.instantaniously],
        ['YEARLY', collections.yearly],
        ['MONTHLY', collections.monthly.no],
      ].forEach(pair => {
        context(pair[0] as CollectionsGranularity, granularity => {
          const expectations = pair[1] as DateAdapter[][];

          const collectionIndex = expectations.length < 4 ? 1 : Math.ceil(expectations.length / 2);

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

      describe('MONTHLY', () => {
        describe('w/ weekStart', () => {
          const expectations = collections.monthly.week;

          if (expectations.length === 0) return;

          const index = expectations.length < 4 ? 1 : Math.ceil(expectations.length / 2);

          it('basic args', () => {
            expect(
              toISOStringsCol(calendar, {
                granularity: 'MONTHLY',
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
                  granularity: 'MONTHLY',
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

describe('Calendar', () => {
  DATE_ADAPTERS.forEach(dateAdapterSet => {
    environment(dateAdapterSet, dateAdapterSet => {
      const [DateAdapter, datetime] = dateAdapterSet as [
        typeof DateAdapterConstructor,
        DatetimeFn<any>
      ];

      const timezones: (string | undefined)[] = !DateAdapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];

      // const timezones: (string | undefined)[] = !DateAdapter.hasTimezoneSupport
      //   ? [undefined, 'UTC']
      //   : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          RScheduleConfig.defaultDateAdapter = DateAdapter;
          RScheduleConfig.defaultTimezone = timezone;

          const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, timezone);

          describe('CalendarClass', () => {
            it('is instantiable', () =>
              expect(new Calendar({ dateAdapter: DateAdapter })).toBeInstanceOf(Calendar));
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
            }),
            [
              dateAdapter(1998, 1, 5, 9, 0),
              dateAdapter(1998, 1, 7, 9, 0),
              dateAdapter(1998, 3, 5, 9, 0),
            ],
            {
              instantaniously: [
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
              instantaniously: [
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
            }),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(2000, 1, 1, 9, 0),
              dateAdapter(2017, 1, 1, 9, 0),
            ],
            {
              instantaniously: [
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
            }),
            [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
            {
              instantaniously: [[dateAdapter(2000, 1, 1, 9, 0)], [dateAdapter(2017, 1, 1, 9, 0)]],
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
              instantaniously: [
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
        });
      });
    });
  });
});

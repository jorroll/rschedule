import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-date-adapter';
import {
  DateAdapter,
  DateAdapterConstructor,
  IDateAdapter,
  IDateAdapterConstructor,
  OccurrencesArgs,
  Options,
  Schedule,
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

function testOccursMethods<T extends DateAdapterConstructor>(
  name: string,
  options: {
    dateAdapter: T;
    rrules?: Array<Options.ProvidedOptions<T>>;
    exrules?: Array<Options.ProvidedOptions<T>>;
    rdates?: T[];
    exdates?: T[];
  },
  tests: any[],
  // Array<
  //   { occursBefore: IDateAdapter<T>, excludeStart?: boolean, expect: boolean } |
  //   { occursAfter: IDateAdapter<T>, excludeStart?: boolean, expect: boolean } |
  //   { occursBetween: [IDateAdapter<T>, IDateAdapter<T>], excludeEnds?: boolean, expect: boolean } |
  //   { occursOn: IDateAdapter<T>, expect: boolean }
  // >
) {
  describe(name, () => {
    let schedule: Schedule<T, any>;

    beforeEach(() => {
      schedule = new Schedule(options);
    });

    tests.forEach(obj => {
      if (obj.occursBefore) {
        describe('#occursBefore()', () => {
          it(`"${obj.occursBefore.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(
              schedule.occursBefore(obj.occursBefore.date, {
                excludeStart: obj.excludeStart,
              }),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursAfter) {
        describe('#occursAfter()', () => {
          it(`"${obj.occursAfter.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(
              schedule.occursAfter(obj.occursAfter.date, {
                excludeStart: obj.excludeStart,
              }),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursBetween) {
        describe('#occursBetween()', () => {
          it(`"${obj.occursBetween[0].toISOString()}" & "${obj.occursBetween[1].toISOString()}" excludeEnds: ${!!obj.excludeEnds}`, () => {
            expect(
              schedule.occursBetween(
                obj.occursBetween[0].date,
                obj.occursBetween[1].date,
                { excludeEnds: obj.excludeEnds },
              ),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursOn) {
        if (obj.occursOn.date) {
          describe('#occursOn()', () => {
            it(`"${obj.occursOn.date.toISOString()}"`, () => {
              expect(schedule.occursOn({ date: obj.occursOn.date.date })).toBe(
                obj.expect,
              );
            });
          });
        } else if (obj.occursOn.weekday) {
          describe('#occursOn()', () => {
            it(`"${obj.occursOn.weekday}"`, () => {
              expect(schedule.occursOn(obj.occursOn)).toBe(obj.expect);
            });
          });
        } else {
          throw new Error('Unexpected test object!');
        }
      } else {
        throw new Error('Unexpected test object!');
      }
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

      // function to get the given time array as an ISO string
      const isoString: DatetimeFn<string> = (
        ...args: Array<number | string | undefined>
      ) =>
        // @ts-ignore
        dateAdapter(...args).toISOString();

      // function to get a schedule's occurrences as ISO strings
      function toISOStrings<T extends DateAdapterConstructor>(
        schedule: Schedule<T>,
        args: OccurrencesArgs<T> = {},
      ) {
        return schedule
          .occurrences({
            ...args,
            start: args.start && (args.start as any).date,
            end: args.end && (args.end as any).date,
          })
          .toArray()!
          .map(occ => occ.toISOString());
      }

      describe('ScheduleClass', () => {
        it('is instantiable', () =>
          expect(new Schedule({ dateAdapter: DateAdapter })).toBeInstanceOf(
            Schedule,
          ));
      });

      describe(`${zone}`, () => {
        describe('#occurrences()', () => {
          describe('NO args', () => {
            it('with a single rule', () => {
              // YearlyByMonthAndMonthDay
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rrules: [
                  {
                    frequency: 'YEARLY',
                    count: 3,
                    byMonthOfYear: [1, 3],
                    byDayOfMonth: [5, 7],
                    start: dateAdapter(1997, 9, 2, 9),
                  },
                ],
              });

              expect(toISOStrings(schedule)).toEqual([
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
                isoString(1998, 3, 5, 9, 0),
              ]);

              let iterator = schedule.occurrences();

              let date = iterator.next().value;
              expect(date.toISOString()).toBe(isoString(1998, 1, 5, 9, 0));

              date = iterator.next({
                skipToDate: dateAdapter(1998, 3, 5, 9, 0),
              }).value;
              expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0));

              iterator = schedule.occurrences({ reverse: true });

              date = iterator.next().value;
              expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0));

              date = iterator.next({
                skipToDate: dateAdapter(1998, 1, 5, 9, 0),
              }).value;
              expect(date.toISOString()).toBe(isoString(1998, 1, 5, 9, 0));
            });

            it('with multiple rules', () => {
              const schedule = new Schedule({
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
              });

              expect(toISOStrings(schedule)).toEqual([
                isoString(1997, 9, 2, 9, 0),
                isoString(1998, 1, 1, 9, 0),
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
                isoString(1998, 1, 20, 9, 0),
                isoString(1998, 2, 3, 9, 0),
                isoString(1998, 3, 3, 9, 0),
                isoString(1998, 3, 5, 9, 0),
              ]);

              let iterator = schedule.occurrences();

              let date = iterator.next().value;
              expect(date.toISOString()).toBe(isoString(1997, 9, 2, 9, 0));

              date = iterator.next({
                skipToDate: dateAdapter(1998, 1, 20, 9, 0),
              }).value;
              expect(date.toISOString()).toBe(isoString(1998, 1, 20, 9, 0));

              iterator = schedule.occurrences({ reverse: true });

              date = iterator.next().value;
              expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0));

              date = iterator.next({
                skipToDate: dateAdapter(1998, 1, 7, 9, 0),
              }).value;
              expect(date.toISOString()).toBe(isoString(1998, 1, 7, 9, 0));
            });

            it('with RDates & duplicate', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule)).toEqual([
                isoString(1998, 1, 1, 9, 0),
                isoString(2000, 1, 1, 9, 0),
                isoString(2017, 1, 1, 9, 0),
              ]);
            });

            it('with EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule)).toEqual([]);
            });

            it('with RDates & EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule)).toEqual([
                isoString(2000, 1, 1, 9, 0),
                isoString(2017, 1, 1, 9, 0),
              ]);
            });

            it('with RDates & EXDates cancelling out', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
                exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
              });

              expect(toISOStrings(schedule)).toEqual([]);
            });

            it('with multiple rules & RDates & EXDates', () => {
              const schedule = new Schedule({
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
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule)).toEqual([
                isoString(1997, 9, 2, 9, 0),
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
                isoString(1998, 2, 3, 9, 0),
                isoString(1998, 3, 3, 9, 0),
                isoString(1998, 3, 5, 9, 0),
                isoString(2000, 1, 1, 9, 0),
                isoString(2017, 1, 1, 9, 0),
              ]);
            });

            it('with multiple rules & EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rrules: [
                  {
                    frequency: 'WEEKLY',
                    start: dateAdapter(2018, 8, 28),
                    until: dateAdapter(2018, 9, 25),
                    byDayOfWeek: ['TU'],
                  },
                ],
                exdates: [dateAdapter(2018, 9, 11).date],
                rdates: [dateAdapter(2018, 9, 22).date],
              });

              expect(toISOStrings(schedule)).toEqual([
                isoString(2018, 8, 28),
                isoString(2018, 9, 4),
                isoString(2018, 9, 18),
                isoString(2018, 9, 22),
                isoString(2018, 9, 25),
              ]);
            });
          });

          describe('args: END', () => {
            it('with a single rule', () => {
              // YearlyByMonthAndMonthDay
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rrules: [
                  {
                    frequency: 'YEARLY',
                    count: 3,
                    byMonthOfYear: [1, 3],
                    byDayOfMonth: [5, 7],
                    start: dateAdapter(1997, 9, 2, 9),
                  },
                ],
              });

              expect(
                toISOStrings(schedule, { end: dateAdapter(1998, 1, 7, 9, 0) }),
              ).toEqual([
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
              ]);
            });

            it('with multiple rules', () => {
              const schedule = new Schedule({
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
              });

              expect(
                toISOStrings(schedule, { end: dateAdapter(1998, 2, 3, 9, 0) }),
              ).toEqual([
                isoString(1997, 9, 2, 9, 0),
                isoString(1998, 1, 1, 9, 0),
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
                isoString(1998, 1, 20, 9, 0),
                isoString(1998, 2, 3, 9, 0),
              ]);
            });

            it('with RDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, { end: dateAdapter(2000, 1, 1, 9, 0) }),
              ).toEqual([
                isoString(1998, 1, 1, 9, 0),
                isoString(2000, 1, 1, 9, 0),
              ]);
            });

            it('with EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, { end: dateAdapter(1998, 1, 7, 9, 0) }),
              ).toEqual([]);
            });

            it('with RDates & EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, { end: dateAdapter(2000, 1, 1, 9, 0) }),
              ).toEqual([isoString(2000, 1, 1, 9, 0)]);
            });

            it('with RDates & EXDates cancelling out', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
                exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
              });

              expect(
                toISOStrings(schedule, { end: dateAdapter(1998, 1, 7, 9, 0) }),
              ).toEqual([]);
            });

            it('with multiple rules & RDates & EXDates', () => {
              const schedule = new Schedule({
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
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, { end: dateAdapter(1998, 3, 5, 9, 0) }),
              ).toEqual([
                isoString(1997, 9, 2, 9, 0),
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
                isoString(1998, 2, 3, 9, 0),
                isoString(1998, 3, 3, 9, 0),
                isoString(1998, 3, 5, 9, 0),
              ]);
            });
          });

          describe('args: TAKE', () => {
            it('with a single rule', () => {
              // YearlyByMonthAndMonthDay
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rrules: [
                  {
                    frequency: 'YEARLY',
                    count: 3,
                    byMonthOfYear: [1, 3],
                    byDayOfMonth: [5, 7],
                    start: dateAdapter(1997, 9, 2, 9),
                  },
                ],
              });

              expect(toISOStrings(schedule, { take: 2 })).toEqual([
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
              ]);
            });

            it('with multiple rules', () => {
              const schedule = new Schedule({
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
              });

              expect(toISOStrings(schedule, { take: 2 })).toEqual([
                isoString(1997, 9, 2, 9, 0),
                isoString(1998, 1, 1, 9, 0),
              ]);
            });

            it('with RDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule, { take: 2 })).toEqual([
                isoString(1998, 1, 1, 9, 0),
                isoString(2000, 1, 1, 9, 0),
              ]);
            });

            it('with EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule, { take: 2 })).toEqual([]);
            });

            it('with RDates & EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule, { take: 3 })).toEqual([
                isoString(2000, 1, 1, 9, 0),
                isoString(2017, 1, 1, 9, 0),
              ]);
            });

            it('with RDates & EXDates cancelling out', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
                exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
              });

              expect(toISOStrings(schedule, { take: 3 })).toEqual([]);
            });

            it('with multiple rules & RDates & EXDates', () => {
              const schedule = new Schedule({
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
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(schedule, { take: 5 })).toEqual([
                isoString(1997, 9, 2, 9, 0),
                isoString(1998, 1, 5, 9, 0),
                isoString(1998, 1, 7, 9, 0),
                isoString(1998, 2, 3, 9, 0),
                isoString(1998, 3, 3, 9, 0),
              ]);
            });
          });

          describe('args: REVERSE', () => {
            it('with a single rule', () => {
              // YearlyByMonthAndMonthDay
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rrules: [
                  {
                    frequency: 'YEARLY',
                    count: 3,
                    byMonthOfYear: [1, 3],
                    byDayOfMonth: [5, 7],
                    start: dateAdapter(1997, 9, 2, 9),
                  },
                ],
              });

              expect(
                toISOStrings(schedule, {
                  start: dateAdapter(1998, 3, 5, 9, 0),
                  reverse: true,
                }),
              ).toEqual(
                [
                  isoString(1998, 1, 5, 9, 0),
                  isoString(1998, 1, 7, 9, 0),
                  isoString(1998, 3, 5, 9, 0),
                ].reverse(),
              );
            });

            it('with multiple rules', () => {
              const schedule = new Schedule({
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
              });

              expect(
                toISOStrings(schedule, {
                  start: dateAdapter(1998, 3, 5, 9, 0),
                  reverse: true,
                }),
              ).toEqual(
                [
                  isoString(1997, 9, 2, 9, 0),
                  isoString(1998, 1, 1, 9, 0),
                  isoString(1998, 1, 5, 9, 0),
                  isoString(1998, 1, 7, 9, 0),
                  isoString(1998, 1, 20, 9, 0),
                  isoString(1998, 2, 3, 9, 0),
                  isoString(1998, 3, 3, 9, 0),
                  isoString(1998, 3, 5, 9, 0),
                ].reverse(),
              );
            });

            it('with RDates & duplicate', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, {
                  start: dateAdapter(2017, 1, 1, 9, 0),
                  reverse: true,
                }),
              ).toEqual(
                [
                  isoString(1998, 1, 1, 9, 0),
                  isoString(2000, 1, 1, 9, 0),
                  isoString(2017, 1, 1, 9, 0),
                ].reverse(),
              );
            });

            it('with EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, {
                  start: dateAdapter(1998, 1, 1, 9, 0),
                  reverse: true,
                }),
              ).toEqual([]);
            });

            it('with RDates & EXDates', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, {
                  start: dateAdapter(2017, 1, 1, 9, 0),
                  reverse: true,
                }),
              ).toEqual(
                [
                  isoString(2000, 1, 1, 9, 0),
                  isoString(2017, 1, 1, 9, 0),
                ].reverse(),
              );
            });

            it('with RDates & EXDates cancelling out', () => {
              const schedule = new Schedule({
                dateAdapter: DateAdapter,
                rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
                exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
              });

              expect(
                toISOStrings(schedule, {
                  start: dateAdapter(1998, 1, 1, 9, 0),
                  reverse: true,
                }),
              ).toEqual([]);
            });

            it('with multiple rules & RDates & EXDates', () => {
              const schedule = new Schedule({
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
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
                exdates: [
                  dateAdapter(1998, 1, 20, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                ],
              });

              expect(
                toISOStrings(schedule, {
                  start: dateAdapter(2017, 1, 1, 9, 0),
                  reverse: true,
                }),
              ).toEqual(
                [
                  isoString(1997, 9, 2, 9, 0),
                  isoString(1998, 1, 5, 9, 0),
                  isoString(1998, 1, 7, 9, 0),
                  isoString(1998, 2, 3, 9, 0),
                  isoString(1998, 3, 3, 9, 0),
                  isoString(1998, 3, 5, 9, 0),
                  isoString(2000, 1, 1, 9, 0),
                  isoString(2017, 1, 1, 9, 0),
                ].reverse(),
              );
            });
          });
        });

        describe('occurs? methods', () => {
          testOccursMethods(
            'with a single rule',
            {
              dateAdapter: DateAdapter,
              rrules: [
                {
                  frequency: 'YEARLY',
                  until: dateAdapter(1998, 3, 5, 9, 0),
                  byMonthOfYear: [1, 3],
                  byDayOfMonth: [5, 7],
                  start: dateAdapter(1997, 9, 2, 9),
                },
              ],
            },
            [
              { occursBefore: dateAdapter(1998, 1, 7, 9, 0), expect: true },
              { occursBefore: dateAdapter(1998, 1, 5, 9, 0), expect: true },
              {
                occursBefore: dateAdapter(1998, 1, 5, 9, 0),
                excludeStart: true,
                expect: false,
              },
              { occursAfter: dateAdapter(1998, 1, 7, 9, 0), expect: true },
              { occursAfter: dateAdapter(1998, 3, 5, 9, 0), expect: true },
              {
                occursAfter: dateAdapter(1998, 3, 5, 9, 0),
                excludeStart: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1998, 1, 6, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1997, 12, 2, 9),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(1998, 3, 5, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(1998, 3, 5, 9, 0),
                ],
                excludeEnds: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 8, 9, 0),
                  dateAdapter(1998, 3, 4, 9, 0),
                ],
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 5, 9, 0) },
                expect: true,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 6, 9, 0) },
                expect: false,
              },
              { occursOn: { weekday: 'SU' }, expect: false },
              { occursOn: { weekday: 'MO' }, expect: true },
              { occursOn: { weekday: 'TU' }, expect: false },
              { occursOn: { weekday: 'WE' }, expect: true },
              { occursOn: { weekday: 'TH' }, expect: true },
              { occursOn: { weekday: 'FR' }, expect: false },
              { occursOn: { weekday: 'SA' }, expect: false },
            ],
          );

          testOccursMethods(
            'with multiple rules',
            {
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
            },
            [
              { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: true },
              { occursBefore: dateAdapter(1997, 9, 2, 9, 0), expect: true },
              {
                occursBefore: dateAdapter(1997, 9, 2, 9, 0),
                excludeStart: true,
                expect: false,
              },
              { occursAfter: dateAdapter(1998, 1, 7, 9, 0), expect: true },
              { occursAfter: dateAdapter(1998, 3, 5, 9, 0), expect: true },
              {
                occursAfter: dateAdapter(1998, 3, 5, 9, 0),
                excludeStart: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1998, 1, 6, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 3, 9),
                  dateAdapter(1997, 12, 2, 9),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 3, 3, 9, 0),
                  dateAdapter(1998, 3, 5, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 3, 3, 9, 0),
                  dateAdapter(1998, 3, 5, 9, 0),
                ],
                excludeEnds: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 3, 6, 9, 0),
                  dateAdapter(1999, 3, 6, 9, 0),
                ],
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 5, 9, 0) },
                expect: true,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 4, 9, 0) },
                expect: false,
              },
            ],
          );

          testOccursMethods(
            'with RDates & duplicate',
            {
              dateAdapter: DateAdapter,
              rdates: [
                dateAdapter(1998, 1, 1, 9, 0).date,
                dateAdapter(1998, 1, 1, 9, 0).date,
                dateAdapter(2000, 1, 1, 9, 0).date,
                dateAdapter(2017, 1, 1, 9, 0).date,
              ],
            },
            [
              { occursBefore: dateAdapter(1999, 12, 1, 9, 0), expect: true },
              { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: true },
              {
                occursBefore: dateAdapter(1998, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              { occursAfter: dateAdapter(2000, 1, 2, 9, 0), expect: true },
              { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: true },
              {
                occursAfter: dateAdapter(2017, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1998, 1, 6, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1997, 12, 2, 9),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                excludeEnds: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(2000, 1, 2, 9, 0),
                  dateAdapter(2010, 1, 1, 9, 0),
                ],
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(2017, 1, 1, 9, 0) },
                expect: true,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 6, 9, 0) },
                expect: false,
              },
            ],
          );

          testOccursMethods(
            'with EXDates',
            {
              dateAdapter: DateAdapter,
              exdates: [
                dateAdapter(1998, 1, 20, 9, 0).date,
                dateAdapter(1998, 1, 1, 9, 0).date,
              ],
            },
            [
              { occursBefore: dateAdapter(1999, 12, 1, 9, 0), expect: false },
              { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: false },
              {
                occursBefore: dateAdapter(1998, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              { occursAfter: dateAdapter(2000, 1, 2, 9, 0), expect: false },
              { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: false },
              {
                occursAfter: dateAdapter(2017, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1998, 1, 6, 9, 0),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1997, 12, 2, 9),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                excludeEnds: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(2000, 1, 2, 9, 0),
                  dateAdapter(2010, 1, 1, 9, 0),
                ],
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(2017, 1, 1, 9, 0) },
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 6, 9, 0) },
                expect: false,
              },
            ],
          );

          testOccursMethods(
            'with RDates & EXDates',
            {
              dateAdapter: DateAdapter,
              rdates: [
                dateAdapter(1998, 1, 1, 9, 0).date,
                dateAdapter(2000, 1, 1, 9, 0).date,
                dateAdapter(2017, 1, 1, 9, 0).date,
              ],
              exdates: [
                dateAdapter(1998, 1, 20, 9, 0).date,
                dateAdapter(1998, 1, 1, 9, 0).date,
              ],
            },
            [
              { occursBefore: dateAdapter(2015, 12, 1, 9, 0), expect: true },
              { occursBefore: dateAdapter(2000, 1, 1, 9, 0), expect: true },
              {
                occursBefore: dateAdapter(2000, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              { occursAfter: dateAdapter(2005, 1, 2, 9, 0), expect: true },
              { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: true },
              {
                occursAfter: dateAdapter(2017, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(2005, 1, 6, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(2000, 9, 2, 9),
                  dateAdapter(2015, 12, 2, 9),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 1, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                excludeEnds: true,
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(2017, 1, 1, 9, 0) },
                expect: true,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 6, 9, 0) },
                expect: false,
              },
            ],
          );

          testOccursMethods(
            'with RDates & EXDates cancelling out',
            {
              dateAdapter: DateAdapter,
              rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
              exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
            },
            [
              { occursBefore: dateAdapter(1999, 12, 1, 9, 0), expect: false },
              { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: false },
              {
                occursBefore: dateAdapter(1998, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              { occursAfter: dateAdapter(2000, 1, 2, 9, 0), expect: false },
              { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: false },
              {
                occursAfter: dateAdapter(2017, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1998, 1, 6, 9, 0),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(1997, 12, 2, 9),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 1, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(1998, 1, 1, 9, 0) },
                expect: false,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 6, 9, 0) },
                expect: false,
              },
            ],
          );

          testOccursMethods(
            'with multiple rules & RDates & EXDates',
            {
              dateAdapter: DateAdapter,
              rrules: [
                // YearlyByMonthAndMonthDay
                {
                  frequency: 'YEARLY',
                  until: dateAdapter(2001, 9, 2, 9),
                  byMonthOfYear: [1, 3],
                  byDayOfMonth: [5, 7],
                  start: dateAdapter(1997, 9, 2, 9),
                },
                // WeeklyIntervalLarge
                {
                  frequency: 'WEEKLY',
                  until: dateAdapter(2001, 9, 2, 9),
                  interval: 20,
                  start: dateAdapter(1997, 9, 2, 9),
                },
                // DailyByMonthDayAndWeekDay
                {
                  frequency: 'DAILY',
                  until: dateAdapter(1999, 9, 2, 9),
                  byDayOfMonth: [1, 3],
                  byDayOfWeek: ['TU', 'TH'],
                  start: dateAdapter(1997, 9, 2, 9),
                },
              ],
              rdates: [
                dateAdapter(1998, 1, 1, 9, 0).date,
                dateAdapter(2000, 1, 1, 9, 0).date,
                dateAdapter(2017, 1, 1, 9, 0).date,
              ],
              exdates: [
                dateAdapter(1998, 1, 20, 9, 0).date,
                dateAdapter(1998, 1, 1, 9, 0).date,
              ],
            },
            [
              { occursBefore: dateAdapter(1998, 1, 5, 9, 0), expect: true },
              { occursBefore: dateAdapter(1997, 9, 2, 9, 0), expect: true },
              {
                occursBefore: dateAdapter(1997, 9, 2, 9, 0),
                excludeStart: true,
                expect: false,
              },
              { occursAfter: dateAdapter(2005, 1, 2, 9, 0), expect: true },
              { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: true },
              {
                occursAfter: dateAdapter(2017, 1, 1, 9, 0),
                excludeStart: true,
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1997, 9, 2, 9),
                  dateAdapter(2005, 1, 6, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(2001, 9, 2, 9),
                  dateAdapter(2015, 12, 2, 9),
                ],
                expect: false,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 5, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                expect: true,
              },
              {
                occursBetween: [
                  dateAdapter(1998, 5, 7, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                ],
                excludeEnds: true,
                expect: true,
              },
              {
                occursOn: { date: dateAdapter(2017, 1, 1, 9, 0) },
                expect: true,
              },
              {
                occursOn: { date: dateAdapter(1998, 3, 6, 9, 0) },
                expect: false,
              },
            ],
          );
        });
      });
    });
  });
});

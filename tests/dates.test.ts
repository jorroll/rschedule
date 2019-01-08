import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import {
  MomentDateAdapter,
  MomentTZDateAdapter,
} from '@rschedule/moment-date-adapter';
import {
  DateAdapter,
  DateAdapterConstructor,
  DateProp,
  IDateAdapter,
  IDateAdapterConstructor,
  OccurrencesArgs,
  Options,
  RDates,
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
    dates?: Array<DateProp<T>>;
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
    let schedule: RDates<T, any>;

    beforeEach(() => {
      schedule = new RDates(options);
    });

    tests.forEach(obj => {
      if (obj.occursBefore) {
        describe('#occursBefore()', () => {
          it(`"${obj.occursBefore.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(
              schedule.occursBefore(obj.occursBefore, {
                excludeStart: obj.excludeStart,
              }),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursAfter) {
        describe('#occursAfter()', () => {
          it(`"${obj.occursAfter.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(
              schedule.occursAfter(obj.occursAfter, {
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
                obj.occursBetween[0],
                obj.occursBetween[1],
                { excludeEnds: obj.excludeEnds },
              ),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursOn) {
        if (obj.occursOn.date) {
          describe('#occursOn()', () => {
            it(`"${obj.occursOn.date.toISOString()}"`, () => {
              expect(schedule.occursOn(obj.occursOn)).toBe(obj.expect);
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

    const zones = !DateAdapter.hasTimezoneSupport ? [undefined] : TIMEZONES;

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
        schedule: RDates<T, any>,
        args?: OccurrencesArgs<T>,
      ) {
        return schedule
          .occurrences(args)
          .toArray()!
          .map(occ => occ.toISOString());
      }

      describe('RDatesClass', () => {
        it('is instantiable', () =>
          expect(new RDates({ dateAdapter: DateAdapter })).toBeInstanceOf(
            RDates,
          ));
      });

      describe(`${zone}`, () => {
        describe('#occurrences()', () => {
          describe('NO args', () => {
            it('with RDates & duplicate', () => {
              const dates = new RDates({
                dateAdapter: DateAdapter,
                dates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(dates)).toEqual([
                isoString(1998, 1, 1, 9, 0),
                isoString(2000, 1, 1, 9, 0),
                isoString(2017, 1, 1, 9, 0),
              ]);
            });

            it('with RDates & EXDates', () => {
              const dates = new RDates({
                dateAdapter: DateAdapter,
                dates: [
                  dateAdapter(1998, 1, 1, 9, 0).date,
                  dateAdapter(2000, 1, 1, 9, 0).date,
                  dateAdapter(2017, 1, 1, 9, 0).date,
                ],
              });

              expect(toISOStrings(dates)).toEqual([
                isoString(1998, 1, 1, 9, 0),
                isoString(2000, 1, 1, 9, 0),
                isoString(2017, 1, 1, 9, 0),
              ]);
            });
          });

          describe('args: END', () => {
            it('with RDates', () => {
              const schedule = new RDates({
                dateAdapter: DateAdapter,
                dates: [
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
          });

          describe('args: TAKE', () => {
            it('with RDates', () => {
              const schedule = new RDates({
                dateAdapter: DateAdapter,
                dates: [
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
          });

          describe('args: REVERSE', () => {
            it('with RDates & duplicate', () => {
              const schedule = new RDates({
                dateAdapter: DateAdapter,
                dates: [
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
          });
        });

        describe('occurs? methods', () => {
          testOccursMethods(
            'with RDates & duplicate',
            {
              dateAdapter: DateAdapter,
              dates: [
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
        });
      });
    });
  });
});

import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  DateAdapter as DateAdapterConstructor,
  DateInput,
  Dates,
  IOccurrencesArgs,
} from '@rschedule/rschedule';
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
  timezoneIsoStringFn,
  TIMEZONES,
  toISOStrings,
} from './utilities';

function testOccursMethods<T extends typeof DateAdapterConstructor>(
  name: string,
  dates: Dates<T>,
  tests: any[],
  // Array<
  //   { occursBefore: IDateAdapter<T>, excludeStart?: boolean, expect: boolean } |
  //   { occursAfter: IDateAdapter<T>, excludeStart?: boolean, expect: boolean } |
  //   { occursBetween: [IDateAdapter<T>, IDateAdapter<T>], excludeEnds?: boolean, expect: boolean } |
  //   { occursOn: IDateAdapter<T>, expect: boolean }
  // >
) {
  describe(name, () => {
    tests.forEach(obj => {
      if (obj.occursBefore) {
        describe('#occursBefore()', () => {
          it(`"${obj.occursBefore.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(
              dates.occursBefore(obj.occursBefore, {
                excludeStart: obj.excludeStart,
              }),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursAfter) {
        describe('#occursAfter()', () => {
          it(`"${obj.occursAfter.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(
              dates.occursAfter(obj.occursAfter, {
                excludeStart: obj.excludeStart,
              }),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursBetween) {
        describe('#occursBetween()', () => {
          it(`"${obj.occursBetween[0].toISOString()}" & "${obj.occursBetween[1].toISOString()}" excludeEnds: ${!!obj.excludeEnds}`, () => {
            expect(
              dates.occursBetween(obj.occursBetween[0], obj.occursBetween[1], {
                excludeEnds: obj.excludeEnds,
              }),
            ).toBe(obj.expect);
          });
        });
      } else if (obj.occursOn) {
        if (obj.occursOn.date) {
          describe('#occursOn()', () => {
            it(`"${obj.occursOn.date.toISOString()}"`, () => {
              expect(dates.occursOn(obj.occursOn)).toBe(obj.expect);
            });
          });
        } else if (obj.occursOn.weekday) {
          describe('#occursOn()', () => {
            it(`"${obj.occursOn.weekday}"`, () => {
              expect(dates.occursOn(obj.occursOn)).toBe(obj.expect);
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

function testOccurrences(
  name: string,
  dates: Dates<typeof DateAdapterConstructor>,
  expectation: DateAdapterConstructor[],
) {
  describe(name, () => {
    const index = expectation.length < 4 ? 1 : Math.ceil(expectation.length / 2);

    it('no args', () => {
      expect(toISOStrings(dates)).toEqual(toISOStrings(expectation));
    });

    if (expectation.length > 1) {
      it('start', () => {
        expect(toISOStrings(dates, { start: expectation[index] })).toEqual(
          toISOStrings(expectation.slice(index)),
        );
      });

      it('end', () => {
        expect(toISOStrings(dates, { end: expectation[index] })).toEqual(
          toISOStrings(expectation.slice(0, index + 1)),
        );
      });
    }

    it('take', () => {
      expect(toISOStrings(dates, { take: 3 })).toEqual(toISOStrings(expectation.slice(0, 3)));
    });

    it('reverse', () => {
      expect(toISOStrings(dates, { reverse: true })).toEqual(toISOStrings(expectation.reverse()));
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

DATE_ADAPTERS.forEach(dateAdapterSet => {
  environment(dateAdapterSet, dateAdapterSet => {
    const [DateAdapter, datetime] = dateAdapterSet as [
      typeof DateAdapterConstructor,
      DatetimeFn<any>
    ];

    // const zones = !DateAdapter.hasTimezoneSupport ? ['UTC'] : [null];
    const zones = !DateAdapter.hasTimezoneSupport ? ([null, 'UTC'] as const) : TIMEZONES;

    zones.forEach(zone => {
      // function to create new dateAdapter instances
      const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, zone);
      const isoString = timezoneIsoStringFn(dateAdapter);

      context(zone, timezone => {
        describe('RDatesClass', () => {
          it('is instantiable', () =>
            expect(new Dates({ dateAdapter: DateAdapter, timezone })).toBeInstanceOf(Dates));
        });

        describe('set()', () => {
          it('timezone UTC', () => {
            const dates = new Dates({
              dates: [
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(2000, 1, 1, 9, 0),
                dateAdapter(2017, 1, 1, 9, 0),
              ],
              timezone,
              dateAdapter: DateAdapter,
            }).set('timezone', 'UTC');

            expect(dates.timezone).toBe('UTC');
          });
        });

        describe('occurrences', () => {
          testOccurrences(
            'with Dates & duplicate',
            new Dates({
              dateAdapter: DateAdapter,
              dates: [
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(2000, 1, 1, 9, 0),
                dateAdapter(2017, 1, 1, 9, 0),
              ],
              timezone,
            }),
            [
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(1998, 1, 1, 9, 0),
              dateAdapter(2000, 1, 1, 9, 0),
              dateAdapter(2017, 1, 1, 9, 0),
            ],
          );
        });

        describe('occurs? methods', () => {
          testOccursMethods(
            'with Dates & duplicate',
            new Dates({
              dateAdapter: DateAdapter,
              timezone,
              dates: [
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(1998, 1, 1, 9, 0),
                dateAdapter(2000, 1, 1, 9, 0),
                dateAdapter(2017, 1, 1, 9, 0),
              ],
            }),
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
                occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1998, 1, 6, 9, 0)],
                expect: true,
              },
              {
                occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1997, 12, 2, 9)],
                expect: false,
              },
              {
                occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
                expect: true,
              },
              {
                occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
                excludeEnds: true,
                expect: false,
              },
              {
                occursBetween: [dateAdapter(2000, 1, 2, 9, 0), dateAdapter(2010, 1, 1, 9, 0)],
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

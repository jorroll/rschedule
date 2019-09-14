import { context, dateAdapterFn, TIMEZONES, toISOStrings } from '../../../../tests/utilities';

import { DateAdapter, DateAdapterBase } from '@rschedule/core';

import { Dates } from '@rschedule/core/generators';

export default function datesTests() {
  function testOccursMethods(
    name: string,
    dates: Dates,
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

  function testOccurrences(name: string, dates: Dates, expectation: DateAdapter[]) {
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

        it('reverse start', () => {
          expect(toISOStrings(dates, { reverse: true, start: expectation[index] })).toEqual(
            toISOStrings(expectation.slice(index).reverse()),
          );
        });

        it('reverse end', () => {
          expect(toISOStrings(dates, { reverse: true, end: expectation[index] })).toEqual(
            toISOStrings(expectation.slice(0, index + 1).reverse()),
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

  describe('Dates', () => {
    context(DateAdapterBase.adapter.name, () => {
      // const zones = !DateAdapterBase.adapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];
      const zones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

      zones.forEach(zone => {
        // function to create new dateAdapter instances
        const dateAdapter = dateAdapterFn(zone);

        context(zone, timezone => {
          describe('DatesClass', () => {
            it('is instantiable', () => expect(new Dates({ timezone })).toBeInstanceOf(Dates));
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
              }).set('timezone', 'UTC');

              expect(dates.timezone).toBe('UTC');
            });

            it('duration', () => {
              const dates = new Dates({
                dates: [
                  dateAdapter(1998, 1, 1, 9, 0),
                  dateAdapter(1998, 1, 1, 9, 0),
                  dateAdapter(2000, 1, 1, 9, 0),
                  dateAdapter(2017, 1, 1, 9, 0),
                ],
                timezone,
              }).set('duration', 30);

              expect(dates.adapters.every(date => date.duration === 30)).toBe(true);
              expect(dates.hasDuration).toBe(true);
            });
          });

          describe('occurrences', () => {
            testOccurrences(
              'with Dates & duplicate',
              new Dates({
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
            describe('with duration', () => {
              let dates: Dates<any>;

              beforeEach(() => {
                dates = new Dates({
                  timezone,
                  dates: [
                    dateAdapter(1998, 1, 1, 9, 0),
                    dateAdapter(1998, 1, 1, 9, 0),
                    dateAdapter(2000, 1, 1, 9, 0),
                    dateAdapter(2017, 1, 1, 9, 0),
                  ],
                  duration: DateAdapter.MILLISECONDS_IN_HOUR * 3,
                });
              });

              it('occursOn', () => {
                expect(dates.occursOn(dateAdapter(1998, 1, 1, 8, 59, 59, 999))).toBe(false);
                expect(dates.occursOn(dateAdapter(1998, 1, 1, 9, 0))).toBe(true);
                expect(dates.occursOn(dateAdapter(1998, 1, 1, 12, 0))).toBe(true);
                expect(dates.occursOn(dateAdapter(1998, 1, 1, 12, 0, 0, 1))).toBe(false);
              });

              describe('occursAfter', () => {
                it('', () => {
                  expect(dates.occursAfter(dateAdapter(2017, 1, 1, 8, 59, 59, 999))).toBe(true);
                  expect(dates.occursAfter(dateAdapter(2017, 1, 1, 9, 0))).toBe(true);
                  expect(dates.occursAfter(dateAdapter(2017, 1, 1, 12, 0))).toBe(true);
                  expect(dates.occursAfter(dateAdapter(2017, 1, 1, 12, 0, 0, 1))).toBe(false);
                });

                it('excludeStart', () => {
                  expect(
                    dates.occursAfter(dateAdapter(2017, 1, 1, 8, 59, 59, 999), {
                      excludeStart: true,
                    }),
                  ).toBe(true);
                  expect(
                    dates.occursAfter(dateAdapter(2017, 1, 1, 9, 0), { excludeStart: true }),
                  ).toBe(false);
                  expect(
                    dates.occursAfter(dateAdapter(2017, 1, 1, 12, 0), { excludeStart: true }),
                  ).toBe(false);
                  expect(
                    dates.occursAfter(dateAdapter(2017, 1, 1, 12, 0, 0, 1), { excludeStart: true }),
                  ).toBe(false);
                });
              });

              describe('occursBefore', () => {
                it('', () => {
                  expect(dates.occursBefore(dateAdapter(1998, 1, 1, 8, 59, 59, 999))).toBe(false);
                  expect(dates.occursBefore(dateAdapter(1998, 1, 1, 9, 0))).toBe(true);
                  expect(dates.occursBefore(dateAdapter(1998, 1, 1, 12, 0))).toBe(true);
                  expect(dates.occursBefore(dateAdapter(1998, 1, 1, 12, 0, 0, 1))).toBe(true);
                });

                it('excludeStart', () => {
                  expect(
                    dates.occursBefore(dateAdapter(1998, 1, 1, 8, 59, 59, 999), {
                      excludeStart: true,
                    }),
                  ).toBe(false);
                  expect(
                    dates.occursBefore(dateAdapter(1998, 1, 1, 9, 0), { excludeStart: true }),
                  ).toBe(false);
                  expect(
                    dates.occursBefore(dateAdapter(1998, 1, 1, 12, 0), { excludeStart: true }),
                  ).toBe(false);
                  expect(
                    dates.occursBefore(dateAdapter(1998, 1, 1, 12, 0, 0, 1), {
                      excludeStart: true,
                    }),
                  ).toBe(true);
                });
              });

              describe('occursBetween', () => {
                it('', () => {
                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 8, 59, 59, 999),
                      dateAdapter(1998, 1, 1, 12, 0, 0, 1),
                    ),
                  ).toBe(true);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 9, 0),
                      dateAdapter(1998, 1, 1, 12, 0),
                    ),
                  ).toBe(true);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 8, 59, 59, 999),
                      dateAdapter(1998, 1, 1, 12, 0),
                    ),
                  ).toBe(true);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 9, 0),
                      dateAdapter(1998, 1, 1, 12, 0, 0, 1),
                    ),
                  ).toBe(true);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1995, 1, 1, 9, 0),
                      dateAdapter(1995, 1, 1, 12, 0, 0, 1),
                    ),
                  ).toBe(false);
                });

                it('excludeEnds', () => {
                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 8, 59, 59, 999),
                      dateAdapter(1998, 1, 1, 12, 0, 0, 1),
                      { excludeEnds: true },
                    ),
                  ).toBe(true);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 9, 0),
                      dateAdapter(1998, 1, 1, 12, 0),
                      { excludeEnds: true },
                    ),
                  ).toBe(false);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 8, 59, 59, 999),
                      dateAdapter(1998, 1, 1, 12, 0),
                      { excludeEnds: false },
                    ),
                  ).toBe(true);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1998, 1, 1, 9, 0),
                      dateAdapter(1998, 1, 1, 12, 0, 0, 1),
                      { excludeEnds: false },
                    ),
                  ).toBe(true);

                  expect(
                    dates.occursBetween(
                      dateAdapter(1995, 1, 1, 9, 0),
                      dateAdapter(1995, 1, 1, 12, 0, 0, 1),
                      { excludeEnds: true },
                    ),
                  ).toBe(false);
                });
              });
            });

            testOccursMethods(
              'with Dates & duplicate',
              new Dates({
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
}

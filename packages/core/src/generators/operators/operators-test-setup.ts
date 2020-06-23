import { DateAdapterBase, DateTime } from '@rschedule/core';

import {
  add,
  Dates,
  intersection,
  mergeDuration,
  Schedule,
  splitDuration,
  subtract,
  unique,
} from '@rschedule/core/generators';

import {
  context,
  dateAdapterFn,
  dateTimeFn,
  dateTimeToAdapterFn,
  isoStringFn,
  occurrencesToIsoStrings,
  TIMEZONES,
  toISOStrings,
} from '../../../../../tests/utilities';

export default function operatorsTests() {
  describe('Operators', () => {
    context(DateAdapterBase.adapter.name, () => {
      // const timezones: (string | null)[] = !DateAdapterBase.adapter.hasTimezoneSupport
      //   ? [null]
      //   : [null];

      const timezones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = dateAdapterFn(timezone);
          const dateTime = dateTimeFn(dateAdapter);
          const isoString = isoStringFn(timezone);
          const toAdapter = dateTimeToAdapterFn(timezone);

          const datesA = new Dates({
            dates: [
              dateAdapter(2017, 9, 9, 9, 9, 9, 9),
              dateAdapter(2018, 11, 11, 11, 11, 11, 11),
              dateAdapter(2019, 1, 1, 1, 1, 1, 1),
              dateAdapter(2019, 1, 1, 1, 1, 1, 1),
              dateAdapter(2020, 3, 3, 3, 3, 3, 3),
            ],
            timezone,
          });

          const datesB = new Dates({
            dates: [
              dateAdapter(2017, 10, 10, 10, 10, 10, 10),
              dateAdapter(2018, 12, 12, 12, 12, 12, 12),
              dateAdapter(2019, 1, 1, 1, 1, 1, 1),
              dateAdapter(2019, 2, 2, 2, 2, 2, 2),
              dateAdapter(2020, 3, 3, 3, 3, 3, 3),
              dateAdapter(2020, 4, 4, 4, 4, 4, 4),
            ],
            timezone,
          });

          const MILLISECONDS_IN_HOUR = 1000 * 60 * 60;

          const durDatesA = new Dates({
            dates: [
              dateAdapter(2010, 10, 10, 13, 9, 9, 9, { duration: MILLISECONDS_IN_HOUR * 1 }),
              dateAdapter(2010, 10, 11, 13, 11, 11, 11, { duration: MILLISECONDS_IN_HOUR * 2 }),
              dateAdapter(2010, 10, 11, 14, 11, 11, 11, { duration: MILLISECONDS_IN_HOUR * 2 }),
              dateAdapter(2010, 10, 12, 13, 1, 1, 1, { duration: MILLISECONDS_IN_HOUR * 1 }),
            ],
            timezone,
          });

          const durDatesB = new Dates({
            dates: [
              dateAdapter(2010, 10, 10, 13, 9, 9, 9, { duration: MILLISECONDS_IN_HOUR * 2 }),
              dateAdapter(2010, 10, 11, 14, 11, 11, 11, {
                duration: MILLISECONDS_IN_HOUR * 0.5,
              }),
              dateAdapter(2010, 10, 12, 14, 1, 1, 1, { duration: MILLISECONDS_IN_HOUR * 20 }),
              dateAdapter(2010, 10, 13, 6, 1, 1, 1, { duration: MILLISECONDS_IN_HOUR * 10 }),
              dateAdapter(2010, 10, 13, 13, 1, 1, 1, { duration: MILLISECONDS_IN_HOUR * 1 }),
              dateAdapter(2010, 10, 14, 13, 1, 1, 1, { duration: 1000 }),
            ],
            timezone,
          });

          describe('testOneDates', () => {
            describe('AddOperator', () => {
              it('add()', () => {
                const iterable = add(datesA)({
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);

                  results.push(adapter.toISOString());

                  expect(adapter.generators.length).toBe(1);
                  expect(adapter.generators[0]).toBe(datesA);
                }

                expect(results).toEqual(occurrencesToIsoStrings(datesA));
              });

              it('_run `skipToDate` must be in the future', () => {
                const first = dateAdapter(1997, 9, 2, 9).toDateTime();
                const second = dateAdapter(1998, 9, 2, 9).toDateTime();
                const third = dateAdapter(1999, 9, 2, 9).toDateTime();

                const dates = new Dates({
                  dates: [first, second, third],
                  timezone,
                });

                const iterator1 = add(dates)({
                  timezone,
                })._run();

                expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
                expect(() => iterator1.next({ skipToDate: first })).toThrowError();

                const iterator2 = add(dates)({
                  timezone,
                })._run();

                expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
                expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(
                  third.valueOf(),
                );
                expect(() => iterator2.next({ skipToDate: first })).toThrowError();
              });

              describe('args', () => {
                const offset = new Date().getTimezoneOffset();

                // The CI runners have local as UTC so need to work around this
                const doTest =
                  offset === 0 ? ![null, 'UTC'].includes(timezone) : timezone !== 'UTC';

                if (doTest) {
                  it('timezone', () => {
                    const iterableUTC = add(datesA)({
                      timezone: 'UTC',
                    })._run();

                    const iterableOriginal = add(datesA)({
                      timezone,
                    })._run();

                    const jsonUTC: any[] = [];
                    const jsonOriginal: any[] = [];

                    const stringUTC: string[] = [];
                    const stringOriginal: string[] = [];

                    for (const date of iterableUTC) {
                      const adapter = toAdapter(date, { keepZone: true });

                      expect(adapter.generators.length).toBe(1);

                      expect(date.timezone).toEqual('UTC');
                      const json = adapter.toJSON();
                      delete json.timezone;
                      jsonUTC.push(json);
                      stringUTC.push(adapter.toISOString());
                    }

                    for (const date of iterableOriginal) {
                      const adapter = toAdapter(date, { keepZone: true });

                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesA);

                      expect(date.timezone).not.toEqual('UTC');
                      const json = adapter.toJSON();
                      delete json.timezone;
                      jsonOriginal.push(json);
                      stringOriginal.push(adapter.toISOString());
                    }

                    expect(jsonUTC).not.toEqual(jsonOriginal);
                    expect(stringUTC).toEqual(stringOriginal);
                  });
                }
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = add(datesA)({
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual([
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                  ]);
                });

                it('end', () => {
                  const iterable = add(datesA)({
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                  ]);
                });

                it('reverse', () => {
                  const iterable = add(datesA)({
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2017, 9, 9, 9, 9, 9, 9),
                      isoString(2018, 11, 11, 11, 11, 11, 11),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                    ].reverse(),
                  );
                });

                it('reverse start', () => {
                  const iterable = add(datesA)({
                    timezone,
                  })._run({ reverse: true, start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                    ].reverse(),
                  );
                });

                it('reverse end', () => {
                  const iterable = add(datesA)({
                    timezone,
                  })._run({ reverse: true, end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2017, 9, 9, 9, 9, 9, 9),
                      isoString(2018, 11, 11, 11, 11, 11, 11),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                    ].reverse(),
                  );
                });
              });
            });

            describe('SubtractOperator', () => {
              it('subtract()', () => {
                const iterable = subtract(datesA)({
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push(adapter.toISOString());
                  expect(adapter.generators.length).toBe(1);
                  expect(adapter.generators[0]).toBe(datesA);
                }

                expect(results.length).toBe(0);
              });

              it('_run `skipToDate` must be in the future', () => {
                const first = dateAdapter(1997, 9, 2, 9).toDateTime();
                const second = dateAdapter(1998, 9, 2, 9).toDateTime();
                const third = dateAdapter(1999, 9, 2, 9).toDateTime();

                const dates = new Dates({
                  dates: [first, second, third],
                  timezone,
                });

                const noop = new Dates({ timezone });

                const iterator1 = subtract(noop)({
                  base: add(dates)({
                    timezone,
                  }),
                  timezone,
                })._run();

                expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
                expect(() => iterator1.next({ skipToDate: first })).toThrowError();

                const iterator2 = subtract(noop)({
                  base: add(dates)({
                    timezone,
                  }),
                  timezone,
                })._run();

                expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
                expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(
                  third.valueOf(),
                );
                expect(() => iterator2.next({ skipToDate: first })).toThrowError();
              });
            });

            describe('IntersectionOperator', () => {
              it('intersection()', () => {
                const iterable = intersection({
                  maxFailedIterations: 50,
                  streams: [datesA],
                })({
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push(adapter.toISOString());
                  expect(adapter.generators.length).toBe(1);
                  expect(adapter.generators[0]).toBe(datesA);
                }

                expect(results).toEqual([
                  isoString(2017, 9, 9, 9, 9, 9, 9),
                  isoString(2018, 11, 11, 11, 11, 11, 11),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2020, 3, 3, 3, 3, 3, 3),
                ]);
              });

              it('_run `skipToDate` must be in the future', () => {
                const first = dateAdapter(1997, 9, 2, 9).toDateTime();
                const second = dateAdapter(1998, 9, 2, 9).toDateTime();
                const third = dateAdapter(1999, 9, 2, 9).toDateTime();

                const dates = new Dates({
                  dates: [first, second, third],
                  timezone,
                });

                const iterator1 = intersection({
                  maxFailedIterations: 50,
                  streams: [dates],
                })({
                  timezone,
                })._run();

                expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
                expect(() => iterator1.next({ skipToDate: first })).toThrowError();

                const iterator2 = intersection({
                  maxFailedIterations: 50,
                  streams: [dates],
                })({
                  timezone,
                })._run();

                expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
                expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(
                  third.valueOf(),
                );
                expect(() => iterator2.next({ skipToDate: first })).toThrowError();
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA],
                  })({
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual([
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                  ]);
                });

                it('end', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA],
                  })({
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                  ]);
                });

                it('reverse', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA],
                  })({
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2017, 9, 9, 9, 9, 9, 9),
                      isoString(2018, 11, 11, 11, 11, 11, 11),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                    ].reverse(),
                  );
                });

                it('reverse start', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA],
                  })({
                    timezone,
                  })._run({ reverse: true, start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                    ].reverse(),
                  );
                });

                it('reverse end', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA],
                  })({
                    timezone,
                  })._run({ reverse: true, end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2017, 9, 9, 9, 9, 9, 9),
                      isoString(2018, 11, 11, 11, 11, 11, 11),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                    ].reverse(),
                  );
                });
              });
            });

            describe('UniqueOperator', () => {
              it('unique()', () => {
                const iterable = unique()({
                  base: datesA,
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push(adapter.toISOString());
                  expect(adapter.generators.length).toBe(1);
                  expect(adapter.generators[0]).toBe(datesA);
                }

                expect(results).toEqual([
                  isoString(2017, 9, 9, 9, 9, 9, 9),
                  isoString(2018, 11, 11, 11, 11, 11, 11),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2020, 3, 3, 3, 3, 3, 3),
                ]);
              });

              it('_run `skipToDate` must be in the future', () => {
                const first = dateAdapter(1997, 9, 2, 9).toDateTime();
                const second = dateAdapter(1998, 9, 2, 9).toDateTime();
                const third = dateAdapter(1999, 9, 2, 9).toDateTime();

                const dates = new Dates({
                  dates: [first, second, third],
                  timezone,
                });

                const iterator1 = unique()({
                  base: dates,
                  timezone,
                })._run();

                expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
                expect(() => iterator1.next({ skipToDate: first })).toThrowError();

                const iterator2 = unique()({
                  base: dates,
                  timezone,
                })._run();

                expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
                expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(
                  third.valueOf(),
                );
                expect(() => iterator2.next({ skipToDate: first })).toThrowError();
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = unique()({
                    base: datesA,
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual([
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                  ]);
                });

                it('end', () => {
                  const iterable = unique()({
                    base: datesA,
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                  ]);
                });

                it('reverse', () => {
                  const iterable = unique()({
                    base: datesA,
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2017, 9, 9, 9, 9, 9, 9),
                      isoString(2018, 11, 11, 11, 11, 11, 11),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                    ].reverse(),
                  );
                });

                it('reverse start', () => {
                  const iterable = unique()({
                    base: datesA,
                    timezone,
                  })._run({ reverse: true, start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                    ].reverse(),
                  );
                });

                it('reverse end', () => {
                  const iterable = unique()({
                    base: datesA,
                    timezone,
                  })._run({ reverse: true, end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2017, 9, 9, 9, 9, 9, 9),
                      isoString(2018, 11, 11, 11, 11, 11, 11),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                    ].reverse(),
                  );
                });
              });
            });

            describe('MergeDurationOperator', () => {
              it('mergeDuration()', () => {
                const iterable = mergeDuration({
                  maxDuration: MILLISECONDS_IN_HOUR * 3,
                })({
                  base: durDatesA,
                  timezone,
                })._run();

                const results: [string, number][] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push([adapter.toISOString(), date.duration!]);
                  expect(adapter.generators.length).toBe(1);
                  expect(adapter.generators[0]).toBe(durDatesA);
                }

                expect(results).toEqual([
                  [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                  [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                ]);
              });

              it('_run `skipToDate` must be in the future', () => {
                const first = dateAdapter(1997, 9, 2, 9, {
                  duration: MILLISECONDS_IN_HOUR * 1,
                }).toDateTime();

                const second = dateAdapter(1998, 9, 2, 9, {
                  duration: MILLISECONDS_IN_HOUR * 1,
                }).toDateTime();

                const third = dateAdapter(1999, 9, 2, 9, {
                  duration: MILLISECONDS_IN_HOUR * 1,
                }).toDateTime();

                const dates = new Dates({
                  dates: [first, second, third],
                  timezone,
                });

                const iterator1 = mergeDuration({
                  maxDuration: MILLISECONDS_IN_HOUR * 3,
                })({
                  base: dates,
                  timezone,
                })._run();

                expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
                expect(() => iterator1.next({ skipToDate: first })).toThrowError();

                const iterator2 = mergeDuration({
                  maxDuration: MILLISECONDS_IN_HOUR * 3,
                })({
                  base: dates,
                  timezone,
                })._run();

                expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
                expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(
                  third.valueOf(),
                );
                expect(() => iterator2.next({ skipToDate: first })).toThrowError();
              });

              describe('args', () => {
                const offset = new Date().getTimezoneOffset();

                // The CI runners have local as UTC so need to work around this
                const doTest =
                  offset === 0 ? ![null, 'UTC'].includes(timezone) : timezone !== 'UTC';

                if (doTest) {
                  it('timezone', () => {
                    const iterableUTC = mergeDuration({
                      maxDuration: MILLISECONDS_IN_HOUR * 3,
                    })({
                      base: durDatesA,
                      timezone: 'UTC',
                    })._run();

                    const iterableOriginal = mergeDuration({
                      maxDuration: MILLISECONDS_IN_HOUR * 3,
                    })({
                      base: durDatesA,
                      timezone,
                    })._run();

                    const jsonUTC: any[] = [];
                    const jsonOriginal: any[] = [];

                    const stringUTC: string[] = [];
                    const stringOriginal: string[] = [];

                    for (const date of iterableUTC) {
                      const adapter = toAdapter(date, { keepZone: true });

                      expect(adapter.generators.length).toBe(1);

                      expect(date.timezone).toEqual('UTC');
                      const json = adapter.toJSON();
                      delete json.timezone;
                      jsonUTC.push(json);
                      stringUTC.push(adapter.toISOString());
                    }

                    for (const date of iterableOriginal) {
                      const adapter = toAdapter(date, { keepZone: true });

                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(durDatesA);

                      expect(date.timezone).not.toEqual('UTC');
                      const json = adapter.toJSON();
                      delete json.timezone;
                      jsonOriginal.push(json);
                      stringOriginal.push(adapter.toISOString());
                    }

                    expect(jsonUTC).not.toEqual(jsonOriginal);
                    expect(stringUTC).toEqual(stringOriginal);
                  });
                }

                it('maxDuration', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 3 - 1,
                  })({
                    base: durDatesA,
                    timezone,
                  })._run();

                  const results: [string, number][] = [];

                  expect(() => {
                    for (const date of iterable) {
                      results.push([toAdapter(date).toISOString(), date.duration!]);
                    }
                  }).toThrowError();
                });
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 3,
                  })({
                    base: durDatesA,
                    timezone,
                  })._run({ start: dateTime(2010, 10, 11, 16, 11, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(durDatesA);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                    [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                  ]);
                });

                it('end', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 3,
                  })({
                    base: durDatesA,
                    timezone,
                  })._run({ end: dateTime(2010, 10, 11, 16, 11, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(durDatesA);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                  ]);
                });

                it('reverse', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 3,
                  })({
                    base: durDatesA,
                    timezone,
                  })._run({ reverse: true });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(durDatesA);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                    ].reverse(),
                  );
                });
              });
            });

            describe('SplitDurationOperator', () => {
              const splitFn = (date: DateTime) => {
                if (date.add(1, 'hour').isBefore(date.end!)) {
                  const diff = date.duration! / 2;

                  return [
                    date.set('duration', diff),
                    date.add(diff, 'millisecond').set('duration', diff),
                  ];
                }

                return [date];
              };

              const maxDuration = MILLISECONDS_IN_HOUR * 3;

              it('splitDuration()', () => {
                const base = durDatesA.add(
                  dateAdapter(2010, 10, 11, 14, 15, 11, 11, {
                    duration: MILLISECONDS_IN_HOUR * 0.5,
                  }),
                );

                const iterable = splitDuration({ maxDuration, splitFn })({
                  base,
                  timezone,
                })._run();

                const results: [string, number][] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push([adapter.toISOString(), date.duration!]);
                  expect(adapter.generators.length).toBe(1);
                  expect(adapter.generators[0]).toBe(base);
                }

                expect(results).toEqual([
                  [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 14, 15, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                  [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                ]);
              });

              it('_run `skipToDate` must be in the future', () => {
                const first = dateAdapter(1997, 9, 2, 9, {
                  duration: MILLISECONDS_IN_HOUR * 1,
                }).toDateTime();

                const second = dateAdapter(1998, 9, 2, 9, {
                  duration: MILLISECONDS_IN_HOUR * 1,
                }).toDateTime();

                const third = dateAdapter(1999, 9, 2, 9, {
                  duration: MILLISECONDS_IN_HOUR * 1,
                }).toDateTime();

                const dates = new Dates({
                  dates: [first, second, third],
                  timezone,
                });

                const iterator1 = splitDuration({
                  maxDuration: MILLISECONDS_IN_HOUR * 3,
                  splitFn: dt => [dt],
                })({
                  base: dates,
                  timezone,
                })._run();

                expect(iterator1.next().value!.valueOf()).toEqual(first.valueOf());
                expect(() => iterator1.next({ skipToDate: first })).toThrowError();

                const iterator2 = splitDuration({
                  maxDuration: MILLISECONDS_IN_HOUR * 3,
                  splitFn: dt => [dt],
                })({
                  base: dates,
                  timezone,
                })._run();

                expect(iterator2.next().value!.valueOf()).toEqual(first.valueOf());
                expect(iterator2.next({ skipToDate: third }).value!.valueOf()).toEqual(
                  third.valueOf(),
                );
                expect(() => iterator2.next({ skipToDate: first })).toThrowError();
              });

              describe('args', () => {
                const offset = new Date().getTimezoneOffset();

                // The CI runners have local as UTC so need to work around this
                const doTest =
                  offset === 0 ? ![null, 'UTC'].includes(timezone) : timezone !== 'UTC';

                if (doTest) {
                  it('timezone', () => {
                    const iterableUTC = splitDuration({ maxDuration, splitFn })({
                      base: durDatesA,
                      timezone: 'UTC',
                    })._run();

                    const iterableOriginal = splitDuration({ maxDuration, splitFn })({
                      base: durDatesA,
                      timezone,
                    })._run();

                    const jsonUTC: any[] = [];
                    const jsonOriginal: any[] = [];

                    const stringUTC: string[] = [];
                    const stringOriginal: string[] = [];

                    for (const date of iterableUTC) {
                      const adapter = toAdapter(date, { keepZone: true });

                      expect(adapter.generators.length).toBe(1);

                      expect(date.timezone).toEqual('UTC');
                      const json = adapter.toJSON();
                      delete json.timezone;
                      jsonUTC.push(json);
                      stringUTC.push(adapter.toISOString());
                    }

                    for (const date of iterableOriginal) {
                      const adapter = toAdapter(date, { keepZone: true });

                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(durDatesA);

                      expect(date.timezone).not.toEqual('UTC');
                      const json = adapter.toJSON();
                      delete json.timezone;
                      jsonOriginal.push(json);
                      stringOriginal.push(adapter.toISOString());
                    }

                    expect(jsonUTC).not.toEqual(jsonOriginal);
                    expect(stringUTC).toEqual(stringOriginal);
                  });
                }

                it('maxDuration', () => {
                  const iterable = splitDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 1 - 1,
                    splitFn,
                  })({
                    base: durDatesA,
                    timezone,
                  })._run();

                  const results: [string, number][] = [];

                  expect(() => {
                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push([adapter.toISOString(), date.duration!]);
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(durDatesA);
                    }
                  }).toThrowError();
                });
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base: durDatesA,
                    timezone,
                  })._run({ start: dateTime(2010, 10, 11, 14, 11, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(durDatesA);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                  ]);
                });

                it('end', () => {
                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base: durDatesA,
                    timezone,
                  })._run({ end: dateTime(2010, 10, 11, 14, 11, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(durDatesA);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  ]);
                });

                it('reverse', () => {
                  const base = durDatesA.add(
                    dateAdapter(2010, 10, 11, 14, 15, 11, 11, {
                      duration: MILLISECONDS_IN_HOUR * 0.5,
                    }),
                  );

                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base,
                    timezone,
                  })._run({ reverse: true });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(base);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 15, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                      [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                    ].reverse(),
                  );
                });

                it('reverse start', () => {
                  const base = durDatesA.add(
                    dateAdapter(2010, 10, 11, 14, 15, 11, 11, {
                      duration: MILLISECONDS_IN_HOUR * 0.5,
                    }),
                  );

                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base,
                    timezone,
                  })._run({ reverse: true, start: dateTime(2010, 10, 11, 14, 12, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(base);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 15, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                      [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                    ].reverse(),
                  );
                });

                it('reverse end', () => {
                  const base = durDatesA.add(
                    dateAdapter(2010, 10, 11, 14, 15, 11, 11, {
                      duration: MILLISECONDS_IN_HOUR * 0.5,
                    }),
                  );

                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base,
                    timezone,
                  })._run({ reverse: true, end: dateTime(2010, 10, 11, 14, 12, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(base);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    ].reverse(),
                  );
                });
              });
            });
          });

          describe('testTwoDates', () => {
            describe('AddOperator', () => {
              it('add()', () => {
                const iterable = add(datesA, datesB)({
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push(adapter.toISOString());
                  expect(adapter.generators.length).toBe(1);
                  expect([datesA, datesB]).toContain(adapter.generators[0]);
                }

                expect(results).toEqual(occurrencesToIsoStrings(datesA, datesB));
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = add(datesA, datesB)({
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect([datesA, datesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 2, 2, 2, 2, 2, 2),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                    isoString(2020, 4, 4, 4, 4, 4, 4),
                  ]);
                });

                it('end', () => {
                  const iterable = add(datesA, datesB)({
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect([datesA, datesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2017, 10, 10, 10, 10, 10, 10),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                    isoString(2018, 12, 12, 12, 12, 12, 12),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                  ]);
                });

                it('reverse', () => {
                  const iterable = add(datesA, datesB)({
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect([datesA, datesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(occurrencesToIsoStrings(datesA, datesB).reverse());
                });
              });
            });

            describe('SubtractOperator', () => {
              describe('A from B', () => {
                it('subtract()', () => {
                  const iterable = subtract(datesA)({
                    base: datesB,
                    timezone,
                  })._run();

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesB);
                  }

                  expect(results).toEqual([
                    isoString(2017, 10, 10, 10, 10, 10, 10),
                    isoString(2018, 12, 12, 12, 12, 12, 12),
                    isoString(2019, 2, 2, 2, 2, 2, 2),
                    isoString(2020, 4, 4, 4, 4, 4, 4),
                  ]);
                });

                describe('runArgs', () => {
                  it('start', () => {
                    const iterable = subtract(datesA)({
                      base: datesB,
                      timezone,
                    })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesB);
                    }

                    expect(results).toEqual([
                      isoString(2019, 2, 2, 2, 2, 2, 2),
                      isoString(2020, 4, 4, 4, 4, 4, 4),
                    ]);
                  });

                  it('end', () => {
                    const iterable = subtract(datesA)({
                      base: datesB,
                      timezone,
                    })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesB);
                    }

                    expect(results).toEqual([
                      isoString(2017, 10, 10, 10, 10, 10, 10),
                      isoString(2018, 12, 12, 12, 12, 12, 12),
                    ]);
                  });

                  it('reverse', () => {
                    const iterable = subtract(datesA)({
                      base: datesB,
                      timezone,
                    })._run({ reverse: true });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesB);
                    }

                    expect(results).toEqual(
                      [
                        isoString(2017, 10, 10, 10, 10, 10, 10),
                        isoString(2018, 12, 12, 12, 12, 12, 12),
                        isoString(2019, 2, 2, 2, 2, 2, 2),
                        isoString(2020, 4, 4, 4, 4, 4, 4),
                      ].reverse(),
                    );
                  });

                  it('reverse start', () => {
                    const iterable = subtract(datesA)({
                      base: datesB,
                      timezone,
                    })._run({ reverse: true, start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesB);
                    }

                    expect(results).toEqual(
                      [
                        isoString(2019, 2, 2, 2, 2, 2, 2),
                        isoString(2020, 4, 4, 4, 4, 4, 4),
                      ].reverse(),
                    );
                  });

                  it('reverse end', () => {
                    const iterable = subtract(datesA)({
                      base: datesB,
                      timezone,
                    })._run({ reverse: true, end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesB);
                    }

                    expect(results).toEqual(
                      [
                        isoString(2017, 10, 10, 10, 10, 10, 10),
                        isoString(2018, 12, 12, 12, 12, 12, 12),
                      ].reverse(),
                    );
                  });
                });
              });

              describe('B from A', () => {
                it('subtract()', () => {
                  const iterable = subtract(datesB)({
                    base: datesA,
                    timezone,
                  })._run();

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect(adapter.generators[0]).toBe(datesA);
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                  ]);
                });

                describe('runArgs', () => {
                  it('start', () => {
                    const iterable = subtract(datesB)({
                      base: datesA,
                      timezone,
                    })._run({ start: dateTime(2017, 10, 10, 10, 10, 10, 10) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesA);
                    }

                    expect(results).toEqual([isoString(2018, 11, 11, 11, 11, 11, 11)]);
                  });

                  it('end', () => {
                    const iterable = subtract(datesB)({
                      base: datesA,
                      timezone,
                    })._run({ end: dateTime(2017, 10, 10, 10, 10, 10, 10) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesA);
                    }

                    expect(results).toEqual([isoString(2017, 9, 9, 9, 9, 9, 9)]);
                  });

                  it('reverse', () => {
                    const iterable = subtract(datesB)({
                      base: datesA,
                      timezone,
                    })._run({ reverse: true });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect(adapter.generators[0]).toBe(datesA);
                    }

                    expect(results).toEqual(
                      [
                        isoString(2017, 9, 9, 9, 9, 9, 9),
                        isoString(2018, 11, 11, 11, 11, 11, 11),
                      ].reverse(),
                    );
                  });
                });
              });
            });

            describe('IntersectionOperator', () => {
              it('intersection()', () => {
                const iterable = intersection({
                  maxFailedIterations: 50,
                  streams: [datesA, datesB],
                })({
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push(adapter.toISOString());
                  expect(adapter.generators.length).toBe(1);
                  expect([datesA, datesB]).toContain(adapter.generators[0]);
                }

                expect(results).toEqual([
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2020, 3, 3, 3, 3, 3, 3),
                  isoString(2020, 3, 3, 3, 3, 3, 3),
                ]);
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA, datesB],
                  })({
                    timezone,
                  })._run({ start: dateTime(2020, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect([datesA, datesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                  ]);
                });

                it('end', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA, datesB],
                  })({
                    timezone,
                  })._run({ end: dateTime(2020, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect([datesA, datesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                  ]);
                });

                it('reverse', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA, datesB],
                  })({
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect([datesA, datesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(
                    [
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                    ].reverse(),
                  );
                });
              });

              it('works with Schedule objects (issue #41)', () => {
                const scheduleA = new Schedule({
                  rrules: [
                    {
                      start: dateAdapter(2020, 6, 1, 0, 0, 0, 0),
                      frequency: 'DAILY',
                      interval: 1,
                    },
                  ],
                  timezone,
                });

                expect(toISOStrings(scheduleA.occurrences({ take: 5 }).toArray())).toEqual([
                  isoString(2020, 6, 1, 0, 0, 0, 0),
                  isoString(2020, 6, 2, 0, 0, 0, 0),
                  isoString(2020, 6, 3, 0, 0, 0, 0),
                  isoString(2020, 6, 4, 0, 0, 0, 0),
                  isoString(2020, 6, 5, 0, 0, 0, 0),
                ]);

                const scheduleB = new Schedule({
                  rrules: [
                    {
                      start: dateAdapter(2020, 6, 1, 0, 0, 0, 0),
                      frequency: 'DAILY',
                      interval: 2,
                    },
                  ],
                  timezone,
                });

                expect(toISOStrings(scheduleB.occurrences({ take: 5 }).toArray())).toEqual([
                  isoString(2020, 6, 1, 0, 0, 0, 0),
                  isoString(2020, 6, 3, 0, 0, 0, 0),
                  isoString(2020, 6, 5, 0, 0, 0, 0),
                  isoString(2020, 6, 7, 0, 0, 0, 0),
                  isoString(2020, 6, 9, 0, 0, 0, 0),
                ]);

                const iterable = intersection({
                  maxFailedIterations: 50,
                  streams: [scheduleA, scheduleB],
                })({
                  timezone,
                })._run();

                const results: string[] = [];
                let i = 0;

                for (const date of iterable) {
                  i++;
                  const adapter = toAdapter(date);
                  results.push(adapter.toISOString());
                  expect(adapter.generators.length).toBe(2);
                  expect([scheduleA, scheduleB]).toContain(adapter.generators[0]);

                  if (i > 9) break;
                }

                expect(results).toEqual([
                  isoString(2020, 6, 1, 0, 0, 0, 0),
                  isoString(2020, 6, 1, 0, 0, 0, 0),
                  isoString(2020, 6, 3, 0, 0, 0, 0),
                  isoString(2020, 6, 3, 0, 0, 0, 0),
                  isoString(2020, 6, 5, 0, 0, 0, 0),
                  isoString(2020, 6, 5, 0, 0, 0, 0),
                  isoString(2020, 6, 7, 0, 0, 0, 0),
                  isoString(2020, 6, 7, 0, 0, 0, 0),
                  isoString(2020, 6, 9, 0, 0, 0, 0),
                  isoString(2020, 6, 9, 0, 0, 0, 0),
                ]);
              });
            });

            describe('UniqueOperator', () => {
              describe('using add()', () => {
                it('unique()', () => {
                  const iterable = unique()({
                    base: add(datesA, datesB)({
                      timezone,
                    }),
                    timezone,
                  })._run();

                  const results: string[] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push(adapter.toISOString());
                    expect(adapter.generators.length).toBe(1);
                    expect([datesA, datesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2017, 10, 10, 10, 10, 10, 10),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                    isoString(2018, 12, 12, 12, 12, 12, 12),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 2, 2, 2, 2, 2, 2),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                    isoString(2020, 4, 4, 4, 4, 4, 4),
                  ]);
                });

                describe('runArgs', () => {
                  it('start', () => {
                    const iterable = unique()({
                      base: add(datesA, datesB)({
                        timezone,
                      }),
                      timezone,
                    })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect([datesA, datesB]).toContain(adapter.generators[0]);
                    }

                    expect(results).toEqual([
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                      isoString(2019, 2, 2, 2, 2, 2, 2),
                      isoString(2020, 3, 3, 3, 3, 3, 3),
                      isoString(2020, 4, 4, 4, 4, 4, 4),
                    ]);
                  });

                  it('end', () => {
                    const iterable = unique()({
                      base: add(datesA, datesB)({
                        timezone,
                      }),
                      timezone,
                    })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect([datesA, datesB]).toContain(adapter.generators[0]);
                    }

                    expect(results).toEqual([
                      isoString(2017, 9, 9, 9, 9, 9, 9),
                      isoString(2017, 10, 10, 10, 10, 10, 10),
                      isoString(2018, 11, 11, 11, 11, 11, 11),
                      isoString(2018, 12, 12, 12, 12, 12, 12),
                      isoString(2019, 1, 1, 1, 1, 1, 1),
                    ]);
                  });

                  it('reverse', () => {
                    const iterable = unique()({
                      base: add(datesA, datesB)({
                        timezone,
                      }),
                      timezone,
                    })._run({ reverse: true });

                    const results: string[] = [];

                    for (const date of iterable) {
                      const adapter = toAdapter(date);
                      results.push(adapter.toISOString());
                      expect(adapter.generators.length).toBe(1);
                      expect([datesA, datesB]).toContain(adapter.generators[0]);
                    }

                    expect(results).toEqual(
                      [
                        isoString(2017, 9, 9, 9, 9, 9, 9),
                        isoString(2017, 10, 10, 10, 10, 10, 10),
                        isoString(2018, 11, 11, 11, 11, 11, 11),
                        isoString(2018, 12, 12, 12, 12, 12, 12),
                        isoString(2019, 1, 1, 1, 1, 1, 1),
                        isoString(2019, 2, 2, 2, 2, 2, 2),
                        isoString(2020, 3, 3, 3, 3, 3, 3),
                        isoString(2020, 4, 4, 4, 4, 4, 4),
                      ].reverse(),
                    );
                  });
                });
              });
            });

            describe('MergeDurationOperator', () => {
              it('mergeDuration()', () => {
                const iterable = mergeDuration({
                  maxDuration: MILLISECONDS_IN_HOUR * 27,
                })({
                  base: add(durDatesA, durDatesB)({
                    timezone,
                  }),
                  timezone,
                })._run();

                const results: [string, number][] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push([adapter.toISOString(), date.duration!]);
                  expect(adapter.generators.length).toBe(1);
                  expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                }

                expect(results).toEqual([
                  [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 2],
                  [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                  [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 27],
                  [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                ]);
              });

              describe('args', () => {
                it('maxDuration', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 27 - 1,
                  })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run();

                  const results: [string, number][] = [];

                  expect(() => {
                    for (const date of iterable) {
                      results.push([toAdapter(date).toISOString(), date.duration!]);
                    }
                  }).toThrowError();
                });
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 27,
                  })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ start: dateTime(2010, 10, 13, 16, 1, 1, 1) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 27],
                    [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                  ]);
                });

                it('end', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 27,
                  })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ end: dateTime(2010, 10, 12, 13, 1, 1, 1) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 2],
                    [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                    [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 27],
                  ]);
                });

                it('reverse', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 27,
                  })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ reverse: true });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 2],
                      [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 27],
                      [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                    ].reverse(),
                  );
                });

                it('reverse start', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 27,
                  })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ reverse: true, start: dateTime(2010, 10, 12, 13, 1, 1, 1) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 27],
                      [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                    ].reverse(),
                  );
                });

                it('reverse end', () => {
                  const iterable = mergeDuration({
                    maxDuration: MILLISECONDS_IN_HOUR * 27,
                  })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ reverse: true, end: dateTime(2010, 10, 13, 16, 1, 1, 1) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 2],
                      [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 3],
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 27],
                    ].reverse(),
                  );
                });
              });
            });

            describe('SplitDurationOperator', () => {
              const splitFn = (date: DateTime) => {
                if (date.add(1, 'hour').isBefore(date.end!)) {
                  const diff = date.duration! / 2;

                  return [
                    date.set('duration', diff),
                    date.add(diff, 'millisecond').set('duration', diff),
                  ];
                }

                return [date];
              };

              const maxDuration = MILLISECONDS_IN_HOUR * 10;

              it('splitDuration()', () => {
                const iterable = splitDuration({ maxDuration, splitFn })({
                  base: add(durDatesA, durDatesB)({
                    timezone,
                  }),
                  timezone,
                })._run();

                const results: [string, number][] = [];

                for (const date of iterable) {
                  const adapter = toAdapter(date);
                  results.push([adapter.toISOString(), date.duration!]);
                  expect(adapter.generators.length).toBe(1);
                  expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                }

                expect(results).toEqual([
                  [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 10, 14, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                  [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 12, 14, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                  [isoString(2010, 10, 13, 0, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                  [isoString(2010, 10, 13, 6, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                  [isoString(2010, 10, 13, 11, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                  [isoString(2010, 10, 13, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                  [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                ]);
              });

              describe('args', () => {
                it('maxDuration', () => {
                  const iterable = splitDuration({ maxDuration: maxDuration - 1, splitFn })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run();

                  const results: [string, number][] = [];

                  expect(() => {
                    for (const date of iterable) {
                      results.push([toAdapter(date).toISOString(), date.duration!]);
                    }
                  }).toThrowError();
                });
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ start: dateTime(2010, 10, 11, 14, 11, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 12, 14, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                    [isoString(2010, 10, 13, 0, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                    [isoString(2010, 10, 13, 6, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                    [isoString(2010, 10, 13, 11, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                    [isoString(2010, 10, 13, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                  ]);
                });

                it('end', () => {
                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ end: dateTime(2010, 10, 11, 14, 11, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual([
                    [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 10, 14, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                  ]);
                });

                it('reverse', () => {
                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ reverse: true });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 10, 14, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 12, 14, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                      [isoString(2010, 10, 13, 0, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                      [isoString(2010, 10, 13, 6, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                      [isoString(2010, 10, 13, 11, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                      [isoString(2010, 10, 13, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                    ].reverse(),
                  );
                });

                it('reverse start', () => {
                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ reverse: true, start: dateTime(2010, 10, 11, 14, 12, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 15, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 12, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 12, 14, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                      [isoString(2010, 10, 13, 0, 1, 1, 1), MILLISECONDS_IN_HOUR * 10],
                      [isoString(2010, 10, 13, 6, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                      [isoString(2010, 10, 13, 11, 1, 1, 1), MILLISECONDS_IN_HOUR * 5],
                      [isoString(2010, 10, 13, 13, 1, 1, 1), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 14, 13, 1, 1, 1), 1000],
                    ].reverse(),
                  );
                });

                it('reverse end', () => {
                  const iterable = splitDuration({ maxDuration, splitFn })({
                    base: add(durDatesA, durDatesB)({
                      timezone,
                    }),
                    timezone,
                  })._run({ reverse: true, end: dateTime(2010, 10, 11, 14, 12, 11, 11) });

                  const results: [string, number][] = [];

                  for (const date of iterable) {
                    const adapter = toAdapter(date);
                    results.push([adapter.toISOString(), date.duration!]);
                    expect(adapter.generators.length).toBe(1);
                    expect([durDatesA, durDatesB]).toContain(adapter.generators[0]);
                  }

                  expect(results).toEqual(
                    [
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 10, 13, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 10, 14, 9, 9, 9), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 13, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 0.5],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                      [isoString(2010, 10, 11, 14, 11, 11, 11), MILLISECONDS_IN_HOUR * 1],
                    ].reverse(),
                  );
                });
              });
            });
          });
        });
      });
    });
  });
}

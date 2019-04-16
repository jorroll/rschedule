import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  add,
  DateAdapter as DateAdapterConstructor,
  DateInput,
  Dates,
  DateTime,
  intersection,
  IOccurrencesArgs,
  IRunnable,
  OccurrenceGenerator,
  subtract,
  unique,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime as LuxonDateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import {
  context,
  dateTimeFn,
  DatetimeFn,
  dateTimeToAdapterFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  occurrencesToIsoStrings,
  standardDatetimeFn,
  timezoneDateAdapterFn,
  timezoneIsoStringFn,
  TIMEZONES,
} from './utilities';

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

describe('Operators', () => {
  DATE_ADAPTERS.forEach(dateAdapterSet => {
    environment(dateAdapterSet, dateAdapterSet => {
      const [DateAdapter, datetime] = dateAdapterSet as [
        typeof DateAdapterConstructor,
        DatetimeFn<any>
      ];

      // const timezones: (string | null)[] = !DateAdapter.hasTimezoneSupport
      //   ? [null]
      //   : ['UTC'];

      const timezones = !DateAdapter.hasTimezoneSupport ? ([null, 'UTC'] as const) : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, timezone);
          const dateTime = dateTimeFn(dateAdapter);
          const isoString = timezoneIsoStringFn(dateAdapter);
          const toAdapter = dateTimeToAdapterFn(DateAdapter, timezone);

          const datesA = new Dates({
            dates: [
              dateAdapter(2017, 9, 9, 9, 9, 9, 9),
              dateAdapter(2018, 11, 11, 11, 11, 11, 11),
              dateAdapter(2019, 1, 1, 1, 1, 1, 1),
              dateAdapter(2019, 1, 1, 1, 1, 1, 1),
              dateAdapter(2020, 3, 3, 3, 3, 3, 3),
            ],
            dateAdapter: DateAdapter,
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
            dateAdapter: DateAdapter,
            timezone,
          });

          describe('testOneDates', () => {
            describe('AddOperator', () => {
              it('add()', () => {
                const iterable = add(datesA)({
                  dateAdapter: DateAdapter,
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  results.push(toAdapter(date).toISOString());
                }

                expect(results).toEqual(occurrencesToIsoStrings(datesA));
              });

              describe('args', () => {
                const offset = new Date().getTimezoneOffset();

                // The CI runners have local as UTC so need to work around this
                const doTest =
                  offset === 0 ? ![null, 'UTC'].includes(timezone) : timezone !== 'UTC';

                if (doTest) {
                  it('timezone', () => {
                    const iterableUTC = add(datesA)({
                      dateAdapter: DateAdapter,
                      timezone: 'UTC',
                    })._run();

                    const iterableOriginal = add(datesA)({
                      dateAdapter: DateAdapter,
                      timezone,
                    })._run();

                    const jsonUTC: any[] = [];
                    const jsonOriginal: any[] = [];

                    const stringUTC: string[] = [];
                    const stringOriginal: string[] = [];

                    for (const date of iterableUTC) {
                      expect(date.timezone).toEqual('UTC');
                      const json = toAdapter(date, { keepZone: true }).toJSON();
                      delete json.timezone;
                      jsonUTC.push(json);
                      stringUTC.push(toAdapter(date, { keepZone: true }).toISOString());
                    }

                    for (const date of iterableOriginal) {
                      expect(date.timezone).not.toEqual('UTC');
                      const json = toAdapter(date, { keepZone: true }).toJSON();
                      delete json.timezone;
                      jsonOriginal.push(json);
                      stringOriginal.push(toAdapter(date, { keepZone: true }).toISOString());
                    }

                    expect(jsonUTC).not.toEqual(jsonOriginal);
                    expect(stringUTC).toEqual(stringOriginal);
                  });
                }
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = add(datesA)({
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
                  }

                  expect(results).toEqual([
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                  ]);
                });

                it('end', () => {
                  const iterable = add(datesA)({
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
              });
            });

            describe('SubtractOperator', () => {
              it('subtract()', () => {
                const iterable = subtract(datesA)({
                  dateAdapter: DateAdapter,
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  results.push(toAdapter(date).toISOString());
                }

                expect(results.length).toBe(0);
              });
            });

            describe('IntersectionOperator', () => {
              it('intersection()', () => {
                const iterable = intersection({
                  maxFailedIterations: 50,
                  streams: [datesA],
                })({
                  dateAdapter: DateAdapter,
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  results.push(toAdapter(date).toISOString());
                }

                expect(results).toEqual([
                  isoString(2017, 9, 9, 9, 9, 9, 9),
                  isoString(2018, 11, 11, 11, 11, 11, 11),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2020, 3, 3, 3, 3, 3, 3),
                ]);
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = intersection({
                    maxFailedIterations: 50,
                    streams: [datesA],
                  })({
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
              });
            });

            describe('UniqueOperator', () => {
              it('unique()', () => {
                const iterable = unique()({
                  dateAdapter: DateAdapter,
                  base: datesA,
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  results.push(toAdapter(date).toISOString());
                }

                expect(results).toEqual([
                  isoString(2017, 9, 9, 9, 9, 9, 9),
                  isoString(2018, 11, 11, 11, 11, 11, 11),
                  isoString(2019, 1, 1, 1, 1, 1, 1),
                  isoString(2020, 3, 3, 3, 3, 3, 3),
                ]);
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = unique()({
                    dateAdapter: DateAdapter,
                    base: datesA,
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
                  }

                  expect(results).toEqual([
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                    isoString(2020, 3, 3, 3, 3, 3, 3),
                  ]);
                });

                it('end', () => {
                  const iterable = unique()({
                    dateAdapter: DateAdapter,
                    base: datesA,
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                    isoString(2019, 1, 1, 1, 1, 1, 1),
                  ]);
                });

                it('reverse', () => {
                  const iterable = unique()({
                    dateAdapter: DateAdapter,
                    base: datesA,
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
              });
            });
          });

          describe('testTwoDates', () => {
            describe('AddOperator', () => {
              it('add()', () => {
                const iterable = add(datesA, datesB)({
                  dateAdapter: DateAdapter,
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  results.push(toAdapter(date).toISOString());
                }

                expect(results).toEqual(occurrencesToIsoStrings(datesA, datesB));
              });

              describe('runArgs', () => {
                it('start', () => {
                  const iterable = add(datesA, datesB)({
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
                  }

                  expect(results).toEqual(occurrencesToIsoStrings(datesA, datesB).reverse());
                });
              });
            });

            describe('SubtractOperator', () => {
              describe('A from B', () => {
                it('subtract()', () => {
                  const iterable = subtract(datesA)({
                    dateAdapter: DateAdapter,
                    base: datesB,
                    timezone,
                  })._run();

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                      dateAdapter: DateAdapter,
                      base: datesB,
                      timezone,
                    })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
                    }

                    expect(results).toEqual([
                      isoString(2019, 2, 2, 2, 2, 2, 2),
                      isoString(2020, 4, 4, 4, 4, 4, 4),
                    ]);
                  });

                  it('end', () => {
                    const iterable = subtract(datesA)({
                      dateAdapter: DateAdapter,
                      base: datesB,
                      timezone,
                    })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
                    }

                    expect(results).toEqual([
                      isoString(2017, 10, 10, 10, 10, 10, 10),
                      isoString(2018, 12, 12, 12, 12, 12, 12),
                    ]);
                  });

                  it('reverse', () => {
                    const iterable = subtract(datesA)({
                      dateAdapter: DateAdapter,
                      base: datesB,
                      timezone,
                    })._run({ reverse: true });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
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
                });
              });

              describe('B from A', () => {
                it('subtract()', () => {
                  const iterable = subtract(datesB)({
                    dateAdapter: DateAdapter,
                    base: datesA,
                    timezone,
                  })._run();

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
                  }

                  expect(results).toEqual([
                    isoString(2017, 9, 9, 9, 9, 9, 9),
                    isoString(2018, 11, 11, 11, 11, 11, 11),
                  ]);
                });

                describe('runArgs', () => {
                  it('start', () => {
                    const iterable = subtract(datesB)({
                      dateAdapter: DateAdapter,
                      base: datesA,
                      timezone,
                    })._run({ start: dateTime(2017, 10, 10, 10, 10, 10, 10) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
                    }

                    expect(results).toEqual([isoString(2018, 11, 11, 11, 11, 11, 11)]);
                  });

                  it('end', () => {
                    const iterable = subtract(datesB)({
                      dateAdapter: DateAdapter,
                      base: datesA,
                      timezone,
                    })._run({ end: dateTime(2017, 10, 10, 10, 10, 10, 10) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
                    }

                    expect(results).toEqual([isoString(2017, 9, 9, 9, 9, 9, 9)]);
                  });

                  it('reverse', () => {
                    const iterable = subtract(datesB)({
                      dateAdapter: DateAdapter,
                      base: datesA,
                      timezone,
                    })._run({ reverse: true });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
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
                  dateAdapter: DateAdapter,
                  timezone,
                })._run();

                const results: string[] = [];

                for (const date of iterable) {
                  results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ start: dateTime(2020, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ end: dateTime(2020, 1, 1, 1, 1, 1, 1) });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                    dateAdapter: DateAdapter,
                    timezone,
                  })._run({ reverse: true });

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
            });

            describe('UniqueOperator', () => {
              describe('using add()', () => {
                it('unique()', () => {
                  const iterable = unique()({
                    dateAdapter: DateAdapter,
                    base: add(datesA, datesB)({
                      dateAdapter: DateAdapter,
                      timezone,
                    }),
                    timezone,
                  })._run();

                  const results: string[] = [];

                  for (const date of iterable) {
                    results.push(toAdapter(date).toISOString());
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
                      dateAdapter: DateAdapter,
                      base: add(datesA, datesB)({
                        dateAdapter: DateAdapter,
                        timezone,
                      }),
                      timezone,
                    })._run({ start: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
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
                      dateAdapter: DateAdapter,
                      base: add(datesA, datesB)({
                        dateAdapter: DateAdapter,
                        timezone,
                      }),
                      timezone,
                    })._run({ end: dateTime(2019, 1, 1, 1, 1, 1, 1) });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
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
                      dateAdapter: DateAdapter,
                      base: add(datesA, datesB)({
                        dateAdapter: DateAdapter,
                        timezone,
                      }),
                      timezone,
                    })._run({ reverse: true });

                    const results: string[] = [];

                    for (const date of iterable) {
                      results.push(toAdapter(date).toISOString());
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
          });
        });
      });
    });
  });
});

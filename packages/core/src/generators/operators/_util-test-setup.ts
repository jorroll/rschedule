import { DateAdapterBase, DateTime } from '@rschedule/core';
import {
  IterableWrapper,
  streamsComparer,
  streamsReverseComparer,
  selectNextIterable,
  selectLastIterable,
} from './_util';

import { Dates } from '@rschedule/core/generators';

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
import { IRunArgs } from '../occurrence-generator';

export default function operatorsUtilTests() {
  describe('Operators _util', () => {
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

          const aFirst = dateAdapter(2017, 9, 9, 9, 9, 9, 9).toDateTime();
          const aSecond = dateAdapter(2018, 11, 11, 11, 11, 11, 11).toDateTime();
          const aThird = dateAdapter(2019, 1, 1, 1, 1, 1, 1).toDateTime();
          const aFourth = dateAdapter(2019, 1, 1, 1, 1, 1, 1).toDateTime();
          const aFifth = dateAdapter(2020, 3, 3, 3, 3, 3, 3).toDateTime();

          const datesA = new Dates({
            dates: [aFirst, aSecond, aThird, aFourth, aFifth],
            timezone,
          });

          const bFirst = dateAdapter(2017, 5, 5, 5, 5, 5, 5).toDateTime();
          const bSecond = dateAdapter(2019, 11, 11, 11, 11, 11, 11).toDateTime();
          const bThird = dateAdapter(2021, 1, 1, 1, 1, 1, 1).toDateTime();

          const datesB = new Dates({
            dates: [bFirst, bSecond, bThird],
            timezone,
          });

          const cFirst = dateAdapter(2013, 11, 11, 11, 11, 11, 11).toDateTime();
          const cSecond = dateAdapter(2014, 1, 1, 1, 1, 1, 1).toDateTime();
          const cThird = dateAdapter(2015, 9, 9, 9, 9, 9, 9).toDateTime();
          const cFourth = dateAdapter(2018, 1, 1, 1, 1, 1, 1).toDateTime();

          const datesC = new Dates({
            dates: [cThird, cFirst, cSecond, cFourth],
            timezone,
          });

          describe('IterableWrapperClass', () => {
            it('is instantiable', () => {
              const stream = new IterableWrapper(datesA, {});

              expect(stream).toBeInstanceOf(IterableWrapper);
              expect(stream.value!.toISOString()).toEqual(aFirst.toISOString());
              expect(stream.done).toEqual(false);
            });
          });

          describe('IterableWrapper', () => {
            describe('next()', () => {
              it('', () => {
                const stream = new IterableWrapper(datesA, {});

                expect(stream.value!.toISOString()).toEqual(aFirst.toISOString());
                expect(stream.done).toEqual(false);

                stream.next();
                expect(stream.value!.toISOString()).toEqual(aSecond.toISOString());
                expect(stream.done).toEqual(false);

                stream.next();
                expect(stream.value!.toISOString()).toEqual(aThird.toISOString());
                expect(stream.done).toEqual(false);

                stream.next();
                expect(stream.value!.toISOString()).toEqual(aFourth.toISOString());
                expect(stream.done).toEqual(false);

                stream.next();
                expect(stream.value!.toISOString()).toEqual(aFifth.toISOString());
                expect(stream.done).toEqual(false);

                stream.next();
                expect(stream.value).toEqual(undefined);
                expect(stream.done).toEqual(true);
              });

              describe('args', () => {
                it('skipToDate', () => {
                  const stream = new IterableWrapper(datesA, {});

                  expect(stream.value!.toISOString()).toEqual(aFirst.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next({ skipToDate: aThird.subtract(1, 'millisecond') });
                  expect(stream.value!.toISOString()).toEqual(aThird.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next({ skipToDate: aThird.add(1, 'millisecond') });
                  expect(stream.value!.toISOString()).toEqual(aFifth.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next();
                  expect(stream.value).toEqual(undefined);
                  expect(stream.done).toEqual(true);
                });

                it('reverse', () => {
                  const stream = new IterableWrapper(datesA, { reverse: true });

                  expect(stream.value!.toISOString()).toEqual(aFifth.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next();
                  expect(stream.value!.toISOString()).toEqual(aFourth.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next();
                  expect(stream.value!.toISOString()).toEqual(aThird.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next();
                  expect(stream.value!.toISOString()).toEqual(aSecond.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next();
                  expect(stream.value!.toISOString()).toEqual(aFirst.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next();
                  expect(stream.value).toEqual(undefined);
                  expect(stream.done).toEqual(true);
                });

                it('reverse skipToDate', () => {
                  const stream = new IterableWrapper(datesA, { reverse: true });

                  expect(stream.value!.toISOString()).toEqual(aFifth.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next({ skipToDate: aThird.add(1, 'millisecond') });
                  expect(stream.value!.toISOString()).toEqual(aThird.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next({ skipToDate: aThird.subtract(1, 'millisecond') });
                  expect(stream.value!.toISOString()).toEqual(aSecond.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next({ skipToDate: aFirst });
                  expect(stream.value!.toISOString()).toEqual(aFirst.toISOString());
                  expect(stream.done).toEqual(false);

                  stream.next();
                  expect(stream.value).toEqual(undefined);
                  expect(stream.done).toEqual(true);
                });
              });
            });
          });

          describe('streamsComparer', () => {
            it('', () => {
              const aStream = new IterableWrapper(datesA, {});
              const bStream = new IterableWrapper(datesB, {});
              const cStream = new IterableWrapper(datesC, {});
              // here we fake a stream that is done
              const doneStream = new IterableWrapper(datesA, {});
              doneStream.done = true;
              doneStream.value = undefined;

              let streams = [aStream, bStream, doneStream, cStream];
              streams.sort(streamsComparer);

              expect(streams).toEqual([cStream, bStream, aStream, doneStream]);

              streams = [cStream, bStream, aStream, doneStream];
              streams.sort(streamsComparer);

              expect(streams).toEqual([cStream, bStream, aStream, doneStream]);
            });
          });

          describe('streamsReverseComparer', () => {
            it('', () => {
              const aStream = new IterableWrapper(datesA, {});
              const bStream = new IterableWrapper(datesB, {});
              const cStream = new IterableWrapper(datesC, {});
              // here we fake a stream that is done
              const doneStream = new IterableWrapper(datesA, {});
              doneStream.done = true;
              doneStream.value = undefined;

              let streams = [aStream, doneStream, bStream, cStream];
              streams.sort(streamsReverseComparer);

              expect(streams).toEqual([doneStream, aStream, bStream, cStream]);

              streams = [doneStream, cStream, bStream, aStream];
              streams.sort(streamsReverseComparer);

              expect(streams).toEqual([doneStream, aStream, bStream, cStream]);
            });
          });

          describe('selectNextIterable', () => {
            it('', () => {
              const aStream = new IterableWrapper(datesA, {});
              const bStream = new IterableWrapper(datesB, {});
              const cStream = new IterableWrapper(datesC, {});

              const streams = [cStream, bStream, aStream];

              const resultsStream = [
                cStream, // 2013 c
                cStream, // 2014 c
                cStream, // 2015 c
                bStream, // 2017 b
                aStream, // 2017 a
                cStream, // 2018 c
                aStream, // 2018 a
                aStream, // 2019 a
                aStream, // 2019 a
                bStream, // 2019 b
                aStream, // 2020 a
                bStream, // 2021 b
                undefined,
                undefined,
              ];

              resultsStream.forEach(result => {
                const stream = selectNextIterable(streams);
                expect(stream).toBe(result);

                if (stream) stream.next();
              });
            });

            describe('args', () => {
              it('skipToDate', () => {
                const aStream = new IterableWrapper(datesA, {});
                const bStream = new IterableWrapper(datesB, {});
                const cStream = new IterableWrapper(datesC, {});

                const streams = [cStream, bStream, aStream];

                let stream = selectNextIterable(streams);
                expect(stream).toBe(cStream); // 2013 c

                stream = selectNextIterable(
                  streams,
                  {},
                  {
                    skipToDate: dateAdapter(2018, 11, 11, 11, 11, 11, 11) // 2018 a
                      .toDateTime()
                      .add(1, 'millisecond'),
                  },
                );
                expect(stream).toBe(aStream); // 2019 a

                stream = selectNextIterable(
                  streams,
                  {},
                  {
                    skipToDate: dateAdapter(2030, 11, 11, 11, 11, 11, 11).toDateTime(),
                  },
                );
                expect(stream).toBe(undefined);
              });

              it('reverse', () => {
                const args: IRunArgs = { reverse: true };
                const aStream = new IterableWrapper(datesA, args);
                const bStream = new IterableWrapper(datesB, args);
                const cStream = new IterableWrapper(datesC, args);

                const streams = [cStream, bStream, aStream];

                const resultsStream = [
                  bStream, // 2021 b
                  aStream, // 2020 a
                  bStream, // 2019 b
                  aStream, // 2019 a
                  aStream, // 2019 a
                  aStream, // 2018 a
                  cStream, // 2018 c
                  aStream, // 2017 a
                  bStream, // 2017 b
                  cStream, // 2015 c
                  cStream, // 2014 c
                  cStream, // 2013 c
                  undefined,
                  undefined,
                ];

                resultsStream.forEach(result => {
                  const stream = selectNextIterable(streams, args);
                  expect(stream).toBe(result);

                  if (stream) stream.next();
                });
              });

              it('reverse skipToDate', () => {
                const args: IRunArgs = { reverse: true };
                const aStream = new IterableWrapper(datesA, args);
                const bStream = new IterableWrapper(datesB, args);
                const cStream = new IterableWrapper(datesC, args);

                const streams = [cStream, bStream, aStream];

                let stream = selectNextIterable(streams, args);
                expect(stream).toBe(bStream); // 2021 b

                stream = selectNextIterable(streams, args, {
                  skipToDate: dateAdapter(2018, 11, 11, 11, 11, 11, 11) // 2018 a
                    .toDateTime()
                    .subtract(1, 'millisecond'),
                });

                expect(stream).toBe(cStream); // 2018 c

                stream = selectNextIterable(streams, args, {
                  skipToDate: dateAdapter(2010, 11, 11, 11, 11, 11, 11).toDateTime(),
                });
                expect(stream).toBe(undefined);
              });
            });
          });

          describe('selectLastIterable', () => {
            it('', () => {
              const aStream = new IterableWrapper(datesA, {});
              const bStream = new IterableWrapper(datesB, {});
              const cStream = new IterableWrapper(datesC, {});

              const streams = [cStream, bStream, aStream];

              const resultsStream = [
                aStream, // 2017 a
                aStream, // 2018 a
                aStream, // 2019 a
                aStream, // 2019 a
                aStream, // 2020 a
                bStream, // 2017 b
                bStream, // 2019 b
                bStream, // 2021 b
                cStream, // 2013 c
                cStream, // 2014 c
                cStream, // 2015 c
                cStream, // 2018 c
                undefined,
                undefined,
              ];

              resultsStream.forEach(result => {
                const stream = selectLastIterable(streams);
                expect(stream).toBe(result);

                if (stream) stream.next();
              });
            });

            describe('args', () => {
              it('skipToDate', () => {
                const aStream = new IterableWrapper(datesA, {});
                const bStream = new IterableWrapper(datesB, {});
                const cStream = new IterableWrapper(datesC, {});

                const streams = [cStream, bStream, aStream];

                let stream = selectLastIterable(streams);
                expect(stream).toBe(aStream); // 2017 a

                stream = selectLastIterable(
                  streams,
                  {},
                  {
                    skipToDate: dateAdapter(2018, 11, 11, 11, 11, 11, 11) // 2018 a
                      .toDateTime()
                      .add(1, 'millisecond'),
                  },
                );
                expect(stream).toBe(bStream); // 2019 b

                stream = selectLastIterable(
                  streams,
                  {},
                  {
                    skipToDate: dateAdapter(2030, 11, 11, 11, 11, 11, 11).toDateTime(),
                  },
                );
                expect(stream).toBe(undefined);
              });

              it('reverse', () => {
                const args: IRunArgs = { reverse: true };
                const aStream = new IterableWrapper(datesA, args);
                const bStream = new IterableWrapper(datesB, args);
                const cStream = new IterableWrapper(datesC, args);

                const streams = [cStream, bStream, aStream];

                const resultsStream = [
                  bStream, // 2021 b
                  aStream, // 2020 a
                  bStream, // 2019 b
                  aStream, // 2019 a
                  aStream, // 2019 a
                  aStream, // 2018 a
                  cStream, // 2018 c
                  aStream, // 2017 a
                  bStream, // 2017 b
                  cStream, // 2015 c
                  cStream, // 2014 c
                  cStream, // 2013 c
                  undefined,
                  undefined,
                ];

                resultsStream.forEach(result => {
                  const stream = selectNextIterable(streams, args);
                  expect(stream).toBe(result);

                  if (stream) stream.next();
                });
              });

              it('reverse skipToDate', () => {
                const args: IRunArgs = { reverse: true };
                const aStream = new IterableWrapper(datesA, args);
                const bStream = new IterableWrapper(datesB, args);
                const cStream = new IterableWrapper(datesC, args);

                const streams = [cStream, bStream, aStream];

                let stream = selectNextIterable(streams, args);
                expect(stream).toBe(bStream); // 2021 b

                stream = selectNextIterable(streams, args, {
                  skipToDate: dateAdapter(2018, 11, 11, 11, 11, 11, 11) // 2018 a
                    .toDateTime()
                    .subtract(1, 'millisecond'),
                });

                expect(stream).toBe(cStream); // 2018 c

                stream = selectNextIterable(streams, args, {
                  skipToDate: dateAdapter(2010, 11, 11, 11, 11, 11, 11).toDateTime(),
                });
                expect(stream).toBe(undefined);
              });
            });
          });
        });
      });
    });
  });
}

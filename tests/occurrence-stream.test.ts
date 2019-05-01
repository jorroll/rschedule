import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  add,
  DateAdapter as DateAdapterConstructor,
  Dates,
  intersection,
  OccurrenceStream,
  subtract,
  unique,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import {
  context,
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
  [typeof LuxonDateAdapter, DatetimeFn<DateTime>]
];

DATE_ADAPTERS.forEach(dateAdapterSet => {
  environment(dateAdapterSet, dateAdapterSet => {
    const [DateAdapter, datetime] = dateAdapterSet as [
      typeof DateAdapterConstructor,
      DatetimeFn<any>
    ];

    // const timezones: (string | null)[] = !DateAdapter.hasTimezoneSupport
    //   ? [null]
    //   : ['UTC'];

    const timezones = !DateAdapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

    timezones.forEach(zone => {
      context(zone, timezone => {
        const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, timezone);
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

        function testOneDates() {
          describe('testOneDates', () => {
            it('add()', () => {
              const iterable = new OccurrenceStream({
                operators: [add(datesA)],
                dateAdapter: DateAdapter,
                timezone,
              })._run();

              const results: string[] = [];

              for (const date of iterable) {
                results.push(toAdapter(date).toISOString());
              }

              expect(results).toEqual(occurrencesToIsoStrings(datesA));
            });

            it('subtract()', () => {
              const iterable = new OccurrenceStream({
                operators: [subtract(datesA)],
                dateAdapter: DateAdapter,
                timezone,
              })._run();

              const results: string[] = [];

              for (const date of iterable) {
                results.push(toAdapter(date).toISOString());
              }

              expect(results.length).toBe(0);
            });

            it('intersection()', () => {
              const iterable = new OccurrenceStream({
                operators: [
                  intersection({
                    maxFailedIterations: 50,
                    streams: [datesA],
                  }),
                ],
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

            it('unique()', () => {
              const iterable = new OccurrenceStream({
                operators: [unique()],
                dateAdapter: DateAdapter,
                timezone,
              })._run();

              const results: string[] = [];

              for (const date of iterable) {
                results.push(toAdapter(date).toISOString());
              }

              expect(results.length).toEqual(0);
            });
          });
        }

        function testTwoDates() {
          describe('testTwoDates', () => {
            it('add()', () => {
              const iterable = new OccurrenceStream({
                operators: [add(datesA, datesB)],
                dateAdapter: DateAdapter,
                timezone,
              })._run();

              const results: string[] = [];

              for (const date of iterable) {
                results.push(toAdapter(date).toISOString());
              }

              expect(results).toEqual(occurrencesToIsoStrings(datesA, datesB));
            });

            it('subtract()', () => {
              const iterable = new OccurrenceStream({
                operators: [subtract(datesA, datesB)],
                dateAdapter: DateAdapter,
                timezone,
              })._run();

              const results: string[] = [];

              for (const date of iterable) {
                results.push(toAdapter(date).toISOString());
              }

              expect(results.length).toBe(0);
            });

            it('intersection()', () => {
              const iterable = new OccurrenceStream({
                operators: [
                  intersection({
                    maxFailedIterations: 50,
                    streams: [datesA, datesB],
                  }),
                ],
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
          });
        }

        describe('OccurrenceStreamClass', () => {
          it('isOccurrenceStream()', () => {
            expect(
              OccurrenceStream.isOccurrenceStream(
                new OccurrenceStream({ operators: [], dateAdapter: DateAdapter, timezone }),
              ),
            ).toBe(true);
          });
        });

        describe('OccurrenceStream', () => {
          testOneDates();
          testTwoDates();
        });
      });
    });
  });
});

import {
  IAddOperatorJSON,
  IDatesJSON,
  IIntersectionOperatorJSON,
  IOccurrenceStreamJSON,
  IRuleJSON,
  IScheduleJSON,
  ISubtractOperatorJSON,
  IUniqueOperatorJSON,
  parseJSON,
  RScheduleObjectJSON,
  serializeToJSON,
} from '@rschedule/json-tools';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  add,
  Calendar,
  DateAdapter as DateAdapterConstructor,
  Dates,
  DateTime,
  intersection,
  OccurrenceStream,
  Rule,
  Schedule,
  subtract,
  unique,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime as LuxonDateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import { ICalendarJSON } from 'packages/json-tools/build/packages/json-tools';
import {
  context,
  DatetimeFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  standardDatetimeFn,
  test,
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

DATE_ADAPTERS.forEach(dateAdapterSet => {
  environment(dateAdapterSet, dateAdapterSet => {
    const [DateAdapter, datetime] = dateAdapterSet as [
      typeof DateAdapterConstructor,
      DatetimeFn<any>
    ];

    // const zones = !DateAdapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];
    const zones = !DateAdapter.hasTimezoneSupport ? ([null, 'UTC'] as const) : TIMEZONES;

    zones.forEach(zone => {
      // function to create new dateAdapter instances
      const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, zone);
      const isoString = timezoneIsoStringFn(dateAdapter);

      context(zone, timezone => {
        const nestedRRuleJSON1: IRuleJSON = {
          type: 'Rule',
          options: {
            start: {
              timezone,
              duration: undefined,
              year: 1997,
              month: 9,
              day: 2,
              hour: 9,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            frequency: 'WEEKLY',
            byDayOfWeek: ['TU', 'TH'],
            end: {
              timezone,
              duration: undefined,
              year: 1997,
              month: 10,
              day: 7,
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            weekStart: 'SU',
          },
        };

        const rruleJSON1 = {
          timezone,
          ...nestedRRuleJSON1,
        };

        const nestedRRuleJSON2: IRuleJSON = {
          type: 'Rule',
          options: {
            start: {
              timezone,
              duration: undefined,
              year: 2018,
              month: 10,
              day: 9,
              hour: 10,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            frequency: 'MONTHLY',
            byDayOfWeek: [['TU', 2]],
          },
        };

        const rruleJSON2 = {
          timezone,
          ...nestedRRuleJSON2,
        };

        const nestedRRuleJSON3: IRuleJSON = {
          type: 'Rule',
          options: {
            start: {
              timezone,
              duration: undefined,
              year: 2018,
              month: 10,
              day: 8,
              hour: 10,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            frequency: 'WEEKLY',
            byDayOfWeek: ['MO'],
          },
        };

        const rruleJSON3 = {
          timezone,
          ...nestedRRuleJSON3,
        };

        const nestedRRuleJSON4: IRuleJSON = {
          type: 'Rule',
          options: {
            start: {
              timezone,
              duration: undefined,
              year: 2018,
              month: 10,
              day: 8,
              hour: 9,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            frequency: 'DAILY',
          },
        };

        const rruleJSON4 = {
          timezone,
          ...nestedRRuleJSON4,
        };

        const nestedRDatesJSON: IDatesJSON = {
          type: 'Dates',
          dates: [
            {
              timezone,
              duration: undefined,
              year: 2018,
              month: 10,
              day: 10,
              hour: 11,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            {
              timezone,
              duration: undefined,
              year: 2018,
              month: 10,
              day: 11,
              hour: 12,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            {
              timezone,
              duration: undefined,
              year: 2018,
              month: 10,
              day: 7,
              hour: 9,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
          ],
        };

        const rdatesJSON = {
          timezone,
          ...nestedRDatesJSON,
        };

        const nestedEXDatesJSON: IDatesJSON = {
          type: 'Dates',
          dates: [],
        };

        const exdatesJSON = {
          timezone,
          ...nestedEXDatesJSON,
        };

        const nestedScheduleJSON: IScheduleJSON = {
          type: 'Schedule',
          rrules: [nestedRRuleJSON1, nestedRRuleJSON2, nestedRRuleJSON3, nestedRRuleJSON4],
          exrules: [nestedRRuleJSON2],
          rdates: nestedRDatesJSON,
          exdates: nestedEXDatesJSON,
        };

        const scheduleJSON = {
          timezone,
          ...nestedScheduleJSON,
        };

        const nestedAddOperatorJSON: IAddOperatorJSON = {
          type: 'AddOperator',
          streams: [nestedScheduleJSON],
        };

        const nestedSubtractOperatorJSON: ISubtractOperatorJSON = {
          type: 'SubtractOperator',
          streams: [nestedRRuleJSON2],
        };

        const nestedIntersectionOperatorJSON: IIntersectionOperatorJSON = {
          type: 'IntersectionOperator',
          streams: [nestedRRuleJSON3],
          maxFailedIterations: 50,
        };

        const nestedUniqueOperatorJSON: IUniqueOperatorJSON = {
          type: 'UniqueOperator',
        };

        const nestedOccurrenceStreamJSON: IOccurrenceStreamJSON = {
          type: 'OccurrenceStream',
          operators: [
            nestedAddOperatorJSON,
            nestedSubtractOperatorJSON,
            nestedIntersectionOperatorJSON,
            nestedUniqueOperatorJSON,
          ],
        };

        const occurrenceStreamJSON: IOccurrenceStreamJSON = {
          ...nestedOccurrenceStreamJSON,
          timezone,
        };

        const nestedCalendarJSON: ICalendarJSON = {
          type: 'Calendar',
          schedules: [nestedRRuleJSON1, nestedRDatesJSON, nestedOccurrenceStreamJSON],
        };

        const calendarJSON: ICalendarJSON = {
          ...nestedCalendarJSON,
          timezone,
        };

        describe('serializeToJSON', () => {
          const rrule1 = new Rule(
            {
              start: DateAdapter.fromJSON({
                timezone,
                year: 1997,
                month: 9,
                day: 2,
                hour: 9,
                minute: 0,
                second: 0,
                millisecond: 0,
              }),
              frequency: 'WEEKLY',
              byDayOfWeek: ['TU', 'TH'],
              end: DateAdapter.fromJSON({
                timezone,
                year: 1997,
                month: 10,
                day: 7,
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
              }),
              weekStart: 'SU',
            },
            { dateAdapter: DateAdapter, timezone },
          );

          const rrule2 = new Rule(
            {
              start: DateAdapter.fromJSON({
                timezone,
                year: 2018,
                month: 10,
                day: 9,
                hour: 10,
                minute: 0,
                second: 0,
                millisecond: 0,
              }),
              frequency: 'MONTHLY',
              byDayOfWeek: [['TU', 2]],
            },
            { dateAdapter: DateAdapter, timezone },
          );

          const rrule3 = new Rule(
            {
              start: DateAdapter.fromJSON({
                timezone,
                year: 2018,
                month: 10,
                day: 8,
                hour: 10,
                minute: 0,
                second: 0,
                millisecond: 0,
              }),
              frequency: 'WEEKLY',
              byDayOfWeek: ['MO'],
            },
            { dateAdapter: DateAdapter, timezone },
          );

          const rrule4 = new Rule(
            {
              start: DateAdapter.fromJSON({
                timezone,
                year: 2018,
                month: 10,
                day: 8,
                hour: 9,
                minute: 0,
                second: 0,
                millisecond: 0,
              }),
              frequency: 'DAILY',
            },
            { dateAdapter: DateAdapter, timezone },
          );

          const rdates = new Dates({
            dates: [
              {
                timezone,
                year: 2018,
                month: 10,
                day: 10,
                hour: 11,
                minute: 0,
                second: 0,
                millisecond: 0,
              },
              {
                timezone,
                year: 2018,
                month: 10,
                day: 11,
                hour: 12,
                minute: 0,
                second: 0,
                millisecond: 0,
              },
              {
                timezone,
                year: 2018,
                month: 10,
                day: 7,
                hour: 9,
                minute: 0,
                second: 0,
                millisecond: 0,
              },
            ].map(json => DateAdapter.fromJSON(json)),
            dateAdapter: DateAdapter,
            timezone,
          });

          const exdates = new Dates({
            dateAdapter: DateAdapter,
            timezone,
          });

          const schedule = new Schedule({
            rrules: [rrule1, rrule2, rrule3, rrule4],
            exrules: [rrule2],
            rdates,
            exdates,
            dateAdapter: DateAdapter,
            timezone,
          });

          const occurrenceStream = new OccurrenceStream({
            operators: [
              add(schedule),
              subtract(rrule2),
              intersection({
                streams: [rrule3],
                maxFailedIterations: 50,
              }),
              unique(),
            ],
            dateAdapter: DateAdapter,
            timezone,
          });

          const calendar = new Calendar({
            schedules: [rrule1, rdates, occurrenceStream],
            dateAdapter: DateAdapter,
            timezone,
          });

          test('rruleJSON1', () => {
            expect(serializeToJSON(rrule1)).toEqual(rruleJSON1);
          });

          test('rruleJSON2', () => {
            expect(serializeToJSON(rrule2)).toEqual(rruleJSON2);
          });

          test('rruleJSON3', () => {
            expect(serializeToJSON(rrule3)).toEqual(rruleJSON3);
          });

          test('rruleJSON4', () => {
            expect(serializeToJSON(rrule4)).toEqual(rruleJSON4);
          });

          test('rdatesJSON', () => {
            expect(serializeToJSON(rdates)).toEqual(rdatesJSON);
          });

          test('exdatesJSON', () => {
            expect(serializeToJSON(exdates)).toEqual(exdatesJSON);
          });

          test('scheduleJSON', () => {
            expect(serializeToJSON(schedule)).toEqual(scheduleJSON);
          });

          test('occurrenceStreamJSON', () => {
            expect(serializeToJSON(occurrenceStream)).toEqual(occurrenceStreamJSON);
          });

          test('calendarJSON', () => {
            expect(serializeToJSON(calendar)).toEqual(calendarJSON);
          });
        });

        describe('parseJSON()', () => {
          test('rruleJSON1', () => {
            const rrule = parseJSON(rruleJSON1, { dateAdapter: DateAdapter }) as Rule<
              typeof DateAdapter
            >;

            expect(Rule.isRule(rrule)).toBeTruthy();

            expect(serializeToJSON(rrule)).toEqual(rruleJSON1);
          });

          test('rruleJSON2', () => {
            const rrule = parseJSON(rruleJSON2, { dateAdapter: DateAdapter }) as Rule<
              typeof DateAdapter
            >;

            expect(Rule.isRule(rrule)).toBeTruthy();
            expect(serializeToJSON(rrule)).toEqual(rruleJSON2);
          });

          test('rruleJSON3', () => {
            const rrule = parseJSON(rruleJSON3, { dateAdapter: DateAdapter }) as Rule<
              typeof DateAdapter
            >;

            expect(Rule.isRule(rrule)).toBeTruthy();
            expect(serializeToJSON(rrule)).toEqual(rruleJSON3);
          });

          test('rruleJSON4', () => {
            const rrule = parseJSON(rruleJSON4, { dateAdapter: DateAdapter }) as Rule<
              typeof DateAdapter
            >;

            expect(Rule.isRule(rrule)).toBeTruthy();
            expect(serializeToJSON(rrule)).toEqual(rruleJSON4);
          });

          test('rdatesJSON', () => {
            const rdates = parseJSON(rdatesJSON, { dateAdapter: DateAdapter }) as Dates<
              typeof DateAdapter
            >;

            expect(Dates.isDates(rdates)).toBeTruthy();
            expect(serializeToJSON(rdates)).toEqual(rdatesJSON);
          });

          test('exdatesJSON', () => {
            const exdates = parseJSON(exdatesJSON, { dateAdapter: DateAdapter }) as Dates<
              typeof DateAdapter
            >;

            expect(Dates.isDates(exdates)).toBeTruthy();
            expect(serializeToJSON(exdates)).toEqual(exdatesJSON);
          });

          test('scheduleJSON', () => {
            const schedule = parseJSON(scheduleJSON, { dateAdapter: DateAdapter }) as Schedule<
              typeof DateAdapter
            >;

            expect(Schedule.isSchedule(schedule)).toBeTruthy();
            expect(serializeToJSON(schedule)).toEqual(scheduleJSON);
          });

          test('occurrenceStreamJSON', () => {
            const occurrenceStream = parseJSON(occurrenceStreamJSON, {
              dateAdapter: DateAdapter,
            }) as OccurrenceStream<typeof DateAdapter>;

            expect(OccurrenceStream.isOccurrenceStream(occurrenceStream)).toBeTruthy();
            expect(serializeToJSON(occurrenceStream)).toEqual(occurrenceStreamJSON);
          });

          test('calendarJSON', () => {
            const calendar = parseJSON(calendarJSON, { dateAdapter: DateAdapter }) as Calendar<
              typeof DateAdapter
            >;

            expect(Calendar.isCalendar(calendar)).toBeTruthy();
            expect(serializeToJSON(calendar)).toEqual(calendarJSON);
          });
        });
      });
    });
  });
});

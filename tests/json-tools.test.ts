import {
  IDatesJSON,
  IRuleJSON,
  IScheduleJSON,
  parseJSON,
  RScheduleObjectJSON,
  serializeToJSON,
} from '@rschedule/json-tools';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  DateAdapter as DateAdapterConstructor,
  Dates,
  DateTime,
  RScheduleConfig,
  Rule,
  Schedule,
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

      RScheduleConfig.defaultDateAdapter = DateAdapter;
      RScheduleConfig.defaultTimezone = zone;

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
          exrules: [],
          rdates: nestedRDatesJSON,
          exdates: nestedEXDatesJSON,
        };

        const scheduleJSON = {
          timezone,
          ...nestedScheduleJSON,
        };

        describe('parseJSON()', () => {
          test('rruleJSON1', () => {
            const rrule = parseJSON(rruleJSON1, DateAdapter) as Rule<typeof DateAdapter>;

            expect(Rule.isRule(rrule)).toBeTruthy();
            expect(rrule.options).toEqual(rruleJSON1.options);
          });

          test('rruleJSON2', () => {
            const rrule = parseJSON(rruleJSON2, DateAdapter) as Rule<typeof DateAdapter>;

            expect(Rule.isRule(rrule)).toBeTruthy();
            expect(rrule.options).toEqual(rruleJSON2.options);
          });

          test('rruleJSON3', () => {
            const rrule = parseJSON(rruleJSON3, DateAdapter) as Rule<typeof DateAdapter>;

            expect(Rule.isRule(rrule)).toBeTruthy();
            expect(rrule.options).toEqual(rruleJSON3.options);
          });

          test('rruleJSON4', () => {
            const rrule = parseJSON(rruleJSON4, DateAdapter) as Rule<typeof DateAdapter>;

            expect(Rule.isRule(rrule)).toBeTruthy();
            expect(rrule.options).toEqual(rruleJSON4.options);
          });

          test('rdatesJSON', () => {
            const rdates = parseJSON(rdatesJSON, DateAdapter) as Dates<typeof DateAdapter>;

            expect(Dates.isDates(rdates)).toBeTruthy();
          });

          test('exdatesJSON', () => {
            const exdates = parseJSON(exdatesJSON, DateAdapter) as Dates<typeof DateAdapter>;

            expect(Dates.isDates(exdates)).toBeTruthy();
          });

          test('scheduleJSON', () => {
            const schedule = parseJSON(scheduleJSON, DateAdapter) as Schedule<typeof DateAdapter>;

            expect(Schedule.isSchedule(schedule)).toBeTruthy();
          });
        });

        describe('serializeToJSON', () => {
          test('rruleJSON1', () => {
            const rrule = new Rule(
              {
                start: {
                  timezone,
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
              { dateAdapter: DateAdapter, timezone },
            );

            expect(serializeToJSON(rrule)).toEqual(rruleJSON1);
          });

          test('rruleJSON2', () => {
            const rrule = new Rule(
              {
                start: {
                  timezone,
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
              { dateAdapter: DateAdapter, timezone },
            );

            expect(serializeToJSON(rrule)).toEqual(rruleJSON2);
          });

          test('rruleJSON3', () => {
            const rrule = new Rule(
              {
                start: {
                  timezone,
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
              { dateAdapter: DateAdapter, timezone },
            );

            expect(serializeToJSON(rrule)).toEqual(rruleJSON3);
          });

          test('rruleJSON4', () => {
            const rrule = new Rule(
              {
                start: {
                  timezone,
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
              { dateAdapter: DateAdapter, timezone },
            );

            expect(serializeToJSON(rrule)).toEqual(rruleJSON4);
          });

          test('rdatesJSON', () => {
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

            expect(serializeToJSON(rdates)).toEqual(rdatesJSON);
          });

          test('exdatesJSON', () => {
            const exdates = new Dates({
              dateAdapter: DateAdapter,
              timezone,
            });

            expect(serializeToJSON(exdates)).toEqual(exdatesJSON);
          });

          test('scheduleJSON', () => {
            const schedule = new Schedule({
              rrules: [
                rruleJSON1.options,
                rruleJSON2.options,
                rruleJSON3.options,
                rruleJSON4.options,
              ],
              exrules: [],
              rdates: nestedRDatesJSON.dates.map(json => DateAdapter.fromJSON(json)),
              exdates: nestedEXDatesJSON.dates.map(json => DateAdapter.fromJSON(json)),
              dateAdapter: DateAdapter,
              timezone,
            });

            expect(serializeToJSON(schedule)).toEqual(scheduleJSON);
          });
        });
      });
    });
  });
});

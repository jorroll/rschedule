import { context, test, TIMEZONES } from '../../../tests/utilities';

import { DateAdapterBase } from '@rschedule/core';

import {
  add,
  AddOperator,
  Calendar,
  Dates,
  intersection,
  IntersectionOperator,
  OccurrenceGenerator,
  Rule,
  Schedule,
  subtract,
  SubtractOperator,
  unique,
  UniqueOperator,
} from '@rschedule/core/generators';

import '@rschedule/json-tools/AddOperator';
import '@rschedule/json-tools/Calendar';
import '@rschedule/json-tools/Dates';
import '@rschedule/json-tools/IntersectionOperator';
import '@rschedule/json-tools/MergeDurationOperator';
import '@rschedule/json-tools/Rule';
import '@rschedule/json-tools/Schedule';
import '@rschedule/json-tools/SubtractOperator';
import '@rschedule/json-tools/UniqueOperator';

export default function jsonToolsTests() {
  context(DateAdapterBase.adapter.name, () => {
    // const zones = !DateAdapterBase.adapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];
    const zones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

    zones.forEach(zone => {
      context(zone, timezone => {
        const nestedRRuleJSON1: Rule.JSON = {
          type: 'Rule',
          config: {
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
        };

        const rruleJSON1 = {
          timezone,
          ...nestedRRuleJSON1,
        };

        const nestedRRuleJSON2: Rule.JSON = {
          type: 'Rule',
          config: {
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
        };

        const rruleJSON2 = {
          timezone,
          ...nestedRRuleJSON2,
        };

        const nestedRRuleJSON3: Rule.JSON = {
          type: 'Rule',
          config: {
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
        };

        const rruleJSON3 = {
          timezone,
          ...nestedRRuleJSON3,
        };

        const nestedRRuleJSON4: Rule.JSON = {
          type: 'Rule',
          config: {
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
        };

        const nestedRRuleJSON4Data: Rule.JSON = {
          type: 'Rule',
          config: {
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
          data: {
            one: 'happy',
          },
        };

        const rruleJSON4 = {
          timezone,
          ...nestedRRuleJSON4,
        };

        const rruleJSON4Data = {
          timezone,
          ...nestedRRuleJSON4Data,
        };

        const nestedRDatesJSON: Dates.JSON = {
          type: 'Dates',
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
          ],
        };

        const rdatesJSON = {
          timezone,
          ...nestedRDatesJSON,
        };

        const nestedEXDatesJSON: Dates.JSON = {
          type: 'Dates',
          dates: [],
        };

        const exdatesJSON = {
          timezone,
          ...nestedEXDatesJSON,
        };

        const nestedScheduleJSON: Schedule.JSON = {
          type: 'Schedule',
          rrules: [nestedRRuleJSON1, nestedRRuleJSON2, nestedRRuleJSON3, nestedRRuleJSON4],
          exrules: [nestedRRuleJSON2],
          rdates: nestedRDatesJSON,
          exdates: nestedEXDatesJSON,
        };

        const nestedScheduleJSONData: Schedule.JSON = {
          type: 'Schedule',
          rrules: [nestedRRuleJSON1, nestedRRuleJSON2, nestedRRuleJSON3, nestedRRuleJSON4Data],
          exrules: [nestedRRuleJSON2],
          rdates: nestedRDatesJSON,
          exdates: nestedEXDatesJSON,
        };

        const scheduleJSON = {
          timezone,
          ...nestedScheduleJSON,
        };

        const scheduleJSONData = {
          timezone,
          ...nestedScheduleJSONData,
        };

        const addOperatorJSON: AddOperator.JSON = {
          type: 'AddOperator',
          streams: [nestedScheduleJSON],
          timezone,
        };

        const addOperatorJSONData: AddOperator.JSON = {
          type: 'AddOperator',
          streams: [nestedScheduleJSONData],
          timezone,
        };

        const nestedAddOperatorJSON: AddOperator.JSON = {
          type: 'AddOperator',
          streams: [nestedScheduleJSON],
        };

        const nestedAddOperatorJSONData: AddOperator.JSON = {
          type: 'AddOperator',
          streams: [nestedScheduleJSONData],
        };

        const nestedSubtractOperatorJSON: SubtractOperator.JSON = {
          type: 'SubtractOperator',
          base: nestedAddOperatorJSON,
          streams: [nestedRRuleJSON2],
        };

        const nestedSubtractOperatorJSONData: SubtractOperator.JSON = {
          type: 'SubtractOperator',
          base: nestedAddOperatorJSONData,
          streams: [nestedRRuleJSON2],
        };

        const subtractOperatorJSON: SubtractOperator.JSON = {
          type: 'SubtractOperator',
          base: addOperatorJSON,
          streams: [nestedRRuleJSON2],
        };

        const subtractOperatorJSONData: SubtractOperator.JSON = {
          type: 'SubtractOperator',
          base: addOperatorJSONData,
          streams: [nestedRRuleJSON2],
        };

        const nestedIntersectionOperatorJSON: IntersectionOperator.JSON = {
          type: 'IntersectionOperator',
          base: nestedSubtractOperatorJSON,
          streams: [nestedRRuleJSON3],
          maxFailedIterations: 50,
        };

        const nestedIntersectionOperatorJSONData: IntersectionOperator.JSON = {
          type: 'IntersectionOperator',
          base: nestedSubtractOperatorJSONData,
          streams: [nestedRRuleJSON3],
          maxFailedIterations: 50,
        };

        const intersectionOperatorJSON: IntersectionOperator.JSON = {
          type: 'IntersectionOperator',
          base: subtractOperatorJSON,
          streams: [nestedRRuleJSON3],
          maxFailedIterations: 50,
        };

        const intersectionOperatorJSONData: IntersectionOperator.JSON = {
          type: 'IntersectionOperator',
          base: subtractOperatorJSONData,
          streams: [nestedRRuleJSON3],
          maxFailedIterations: 50,
        };

        const nestedUniqueOperatorJSON: UniqueOperator.JSON = {
          type: 'UniqueOperator',
          base: nestedIntersectionOperatorJSON,
        };

        const nestedUniqueOperatorJSONData: UniqueOperator.JSON = {
          type: 'UniqueOperator',
          base: nestedIntersectionOperatorJSONData,
        };

        const uniqueOperatorJSON: UniqueOperator.JSON = {
          type: 'UniqueOperator',
          base: intersectionOperatorJSON,
        };

        const uniqueOperatorJSONData: UniqueOperator.JSON = {
          type: 'UniqueOperator',
          base: intersectionOperatorJSONData,
        };

        const nestedCalendarJSON: Calendar.JSON = {
          type: 'Calendar',
          schedules: [nestedRRuleJSON1, nestedRDatesJSON, nestedUniqueOperatorJSON],
        };

        const nestedCalendarJSONData: Calendar.JSON = {
          type: 'Calendar',
          schedules: [nestedRRuleJSON1, nestedRDatesJSON, nestedUniqueOperatorJSONData],
        };

        const calendarJSON: Calendar.JSON = {
          ...nestedCalendarJSON,
          timezone,
        };

        const calendarJSONData: Calendar.JSON = {
          ...nestedCalendarJSONData,
          timezone,
        };

        describe('serializeToJSON', () => {
          const rrule1 = new Rule(
            {
              start: DateAdapterBase.adapter.fromJSON({
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
              end: DateAdapterBase.adapter.fromJSON({
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
            { timezone },
          );

          const rrule2 = new Rule(
            {
              start: DateAdapterBase.adapter.fromJSON({
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
            { timezone },
          );

          const rrule3 = new Rule(
            {
              start: DateAdapterBase.adapter.fromJSON({
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
            { timezone },
          );

          const rrule4 = new Rule(
            {
              start: DateAdapterBase.adapter.fromJSON({
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
            {
              timezone,
            },
          );

          const rrule4Data = new Rule(
            {
              start: DateAdapterBase.adapter.fromJSON({
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
            {
              timezone,
              data: {
                one: 'happy',
              },
            },
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
            ].map(json => DateAdapterBase.adapter.fromJSON(json)),
            timezone,
          });

          const exdates = new Dates({
            timezone,
          });

          const schedule = new Schedule({
            rrules: [rrule1, rrule2, rrule3, rrule4],
            exrules: [rrule2],
            rdates,
            exdates,
            timezone,
          });

          const scheduleData = new Schedule({
            rrules: [rrule1, rrule2, rrule3, rrule4Data],
            exrules: [rrule2],
            rdates,
            exdates,
            timezone,
          });

          const uniqueOperator = ([
            add(schedule),
            subtract(rrule2),
            intersection({
              streams: [rrule3],
              maxFailedIterations: 50,
            }),
            unique(),
          ] as const).reduce((prev, curr) => curr({ base: prev, timezone }) as any, undefined as
            | undefined
            | OccurrenceGenerator)!;

          const uniqueOperatorData = ([
            add(scheduleData),
            subtract(rrule2),
            intersection({
              streams: [rrule3],
              maxFailedIterations: 50,
            }),
            unique(),
          ] as const).reduce((prev, curr) => curr({ base: prev, timezone }) as any, undefined as
            | undefined
            | OccurrenceGenerator)!;

          const calendar = new Calendar({
            schedules: [rrule1, rdates, uniqueOperator],
            timezone,
          });

          const calendarData = new Calendar({
            schedules: [rrule1, rdates, uniqueOperatorData],
            timezone,
          });

          test('rruleJSON1', () => {
            expect(rrule1.toJSON()).toEqual(rruleJSON1);
          });

          test('rruleJSON2', () => {
            expect(rrule2.toJSON()).toEqual(rruleJSON2);
          });

          test('rruleJSON3', () => {
            expect(rrule3.toJSON()).toEqual(rruleJSON3);
          });

          test('rruleJSON4', () => {
            expect(rrule4.toJSON()).toEqual(rruleJSON4);
          });

          test('rruleJSON4Data', () => {
            expect(rrule4Data.toJSON()).toEqual(rruleJSON4);
            expect(rrule4Data.toJSON({ data: true })).toEqual(rruleJSON4Data);
            expect(
              rrule4Data.toJSON({
                data: input => {
                  const json = JSON.parse(JSON.stringify(input.data));
                  json.two = 'sad';
                  return json;
                },
              }),
            ).toEqual({
              ...rruleJSON4,
              data: {
                one: 'happy',
                two: 'sad',
              },
            });
          });

          test('rdatesJSON', () => {
            expect(rdates.toJSON()).toEqual(rdatesJSON);
          });

          test('exdatesJSON', () => {
            expect(exdates.toJSON()).toEqual(exdatesJSON);
          });

          test('scheduleJSON', () => {
            expect(schedule.toJSON()).toEqual(scheduleJSON);
          });

          test('scheduleJSONData', () => {
            expect(scheduleData.toJSON()).toEqual(scheduleJSON);
            expect(scheduleData.toJSON({ data: true })).toEqual(scheduleJSONData);
          });

          test('uniqueOperator', () => {
            expect(uniqueOperator.toJSON()).toEqual(uniqueOperatorJSON);
          });

          test('uniqueOperatorData', () => {
            expect(uniqueOperatorData.toJSON()).toEqual(uniqueOperatorJSON);
            expect(uniqueOperatorData.toJSON({ data: true })).toEqual(uniqueOperatorJSONData);
          });

          test('calendarJSON', () => {
            expect(calendar.toJSON()).toEqual(calendarJSON);
          });

          test('calendarJSONData', () => {
            expect(calendarData.toJSON()).toEqual(calendarJSON);
            expect(calendarData.toJSON({ data: true })).toEqual(calendarJSONData);
          });
        });

        describe('parseJSON()', () => {
          test('rruleJSON1', () => {
            const rrule = OccurrenceGenerator.fromJSON(rruleJSON1) as Rule;
            expect(rrule).toBeInstanceOf(Rule);
            expect(rrule.toJSON()).toEqual(rruleJSON1);
          });

          test('rruleJSON2', () => {
            const rrule = OccurrenceGenerator.fromJSON(rruleJSON2) as Rule;
            expect(rrule).toBeInstanceOf(Rule);
            expect(rrule.toJSON()).toEqual(rruleJSON2);
          });

          test('rruleJSON3', () => {
            const rrule = OccurrenceGenerator.fromJSON(rruleJSON3) as Rule;
            expect(rrule).toBeInstanceOf(Rule);
            expect(rrule.toJSON()).toEqual(rruleJSON3);
          });

          test('rruleJSON4', () => {
            const rrule = OccurrenceGenerator.fromJSON(rruleJSON4) as Rule;
            expect(rrule).toBeInstanceOf(Rule);
            expect(rrule.toJSON()).toEqual(rruleJSON4);
          });

          test('rruleJSON4Data', () => {
            const rrule = OccurrenceGenerator.fromJSON(rruleJSON4Data) as Rule;
            expect(rrule).toBeInstanceOf(Rule);
            expect(rrule.data).toBeTruthy();
            expect(rrule.toJSON()).toEqual(rruleJSON4);
            expect(rrule.toJSON({ data: true })).toEqual(rruleJSON4Data);
          });

          test('rdatesJSON', () => {
            const rdates = OccurrenceGenerator.fromJSON(rdatesJSON) as Dates;
            expect(rdates instanceof Dates).toBeTruthy();
            expect(rdates.toJSON()).toEqual(rdatesJSON);
          });

          test('exdatesJSON', () => {
            const exdates = OccurrenceGenerator.fromJSON(exdatesJSON) as Dates;
            expect(exdates instanceof Dates).toBeTruthy();
            expect(exdates.toJSON()).toEqual(exdatesJSON);
          });

          test('scheduleJSON', () => {
            const schedule = OccurrenceGenerator.fromJSON(scheduleJSON) as Schedule;
            expect(schedule instanceof Schedule).toBeTruthy();
            expect(schedule.toJSON()).toEqual(scheduleJSON);
          });

          test('scheduleJSONData', () => {
            const schedule = OccurrenceGenerator.fromJSON(scheduleJSONData) as Schedule;
            expect(schedule instanceof Schedule).toBeTruthy();
            expect(schedule.data).toBeFalsy();
            expect(schedule.toJSON()).toEqual(scheduleJSON);
            expect(schedule.toJSON({ data: true })).toEqual(scheduleJSONData);
          });

          test('uniqueOperatorJSON', () => {
            const object = OccurrenceGenerator.fromJSON(uniqueOperatorJSON) as UniqueOperator;
            expect(object).toBeInstanceOf(UniqueOperator);
            expect(object.toJSON()).toEqual(uniqueOperatorJSON);
          });

          test('uniqueOperatorJSONData', () => {
            const object = OccurrenceGenerator.fromJSON(uniqueOperatorJSONData) as UniqueOperator;
            expect(object).toBeInstanceOf(UniqueOperator);
            expect((object as any).data).toBeFalsy();
            expect(object.toJSON()).toEqual(uniqueOperatorJSON);
            expect(object.toJSON({ data: true })).toEqual(uniqueOperatorJSONData);
          });

          test('calendarJSON', () => {
            const calendar = OccurrenceGenerator.fromJSON(calendarJSON) as Calendar;
            expect(calendar).toBeInstanceOf(Calendar);
            expect(calendar.toJSON()).toEqual(calendarJSON);
          });

          test('calendarJSONData', () => {
            const calendar = OccurrenceGenerator.fromJSON(calendarJSONData) as Calendar;
            expect(calendar).toBeInstanceOf(Calendar);
            expect(calendar.data).toBeFalsy();
            expect(calendar.toJSON()).toEqual(calendarJSON);
            expect(calendar.toJSON({ data: true })).toEqual(calendarJSONData);
          });
        });
      });
    });
  });
}

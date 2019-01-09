import { parseJSON } from '@rschedule/json-tools';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-date-adapter';
import {
  DateAdapterConstructor,
  EXDates,
  EXRule,
  IDateAdapterConstructor,
  RDates,
  RRule,
  Schedule,
} from '@rschedule/rschedule';
import { DateTime } from 'luxon';
import {
  IEXRuleJSON,
  IRRuleJSON,
  RScheduleObjectJSON,
  serializeToJSON,
} from '../packages/json-tools/src/lib/serializer';
import { environment, test } from './utilities';

const rruleJSON1 = {
  type: 'RRule',
  options: {
    start: {
      zone: 'Europe/London',
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
    until: {
      zone: 'Europe/London',
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

const rruleJSON2 = {
  type: 'RRule',
  options: {
    start: {
      zone: 'Europe/London',
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

const rruleJSON3 = {
  type: 'RRule',
  options: {
    start: {
      zone: undefined,
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

const rruleJSON4 = {
  type: 'RRule',
  options: {
    start: {
      zone: 'UTC',
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

const rdatesJSON = {
  type: 'RDates',
  dates: [
    {
      zone: 'Europe/London',
      year: 2018,
      month: 10,
      day: 10,
      hour: 11,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    {
      zone: 'UTC',
      year: 2018,
      month: 10,
      day: 11,
      hour: 12,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    {
      zone: 'UTC',
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

const exdatesJSON = {
  type: 'EXDates',
  dates: [],
};

const scheduleJSON = {
  type: 'Schedule',
  rrules: [rruleJSON1, rruleJSON2, rruleJSON3, rruleJSON4],
  exrules: [],
  rdates: rdatesJSON,
  exdates: exdatesJSON,
};

describe('parseJSON()', () => {
  describe('LuxonDateAdapter()', () => {
    test('rruleJSON1', () => {
      const rrule = parseJSON(
        rruleJSON1 as RScheduleObjectJSON,
        LuxonDateAdapter,
      ) as RRule<typeof LuxonDateAdapter>;

      expect(RRule.isRRule(rrule)).toBeTruthy();
      expect(rrule.options).toEqual(rruleJSON1.options);
      expect(
        (rrule as any).processedOptions.start.isEqual(
          new LuxonDateAdapter(DateTime.fromObject(rruleJSON1.options.start)),
        ),
      ).toBeTruthy();
      expect(
        (rrule as any).processedOptions.until!.isEqual(
          new LuxonDateAdapter(DateTime.fromObject(rruleJSON1.options.until)),
        ),
      ).toBeTruthy();
    });

    test('rruleJSON2', () => {
      const rrule = parseJSON(
        rruleJSON2 as RScheduleObjectJSON,
        LuxonDateAdapter,
      ) as RRule<typeof LuxonDateAdapter>;

      expect(RRule.isRRule(rrule)).toBeTruthy();
      expect(rrule.options).toEqual(rruleJSON2.options);
      expect(
        (rrule as any).processedOptions.start.isEqual(
          new LuxonDateAdapter(DateTime.fromObject(rruleJSON2.options.start)),
        ),
      ).toBeTruthy();
    });

    test('rruleJSON3', () => {
      const rrule = parseJSON(
        rruleJSON3 as RScheduleObjectJSON,
        LuxonDateAdapter,
      ) as RRule<typeof LuxonDateAdapter>;

      expect(RRule.isRRule(rrule)).toBeTruthy();
      expect(rrule.options).toEqual(rruleJSON3.options);
      expect(
        (rrule as any).processedOptions.start.isEqual(
          new LuxonDateAdapter(DateTime.fromObject(rruleJSON3.options.start)),
        ),
      ).toBeTruthy();
    });

    test('rruleJSON4', () => {
      const rrule = parseJSON(
        rruleJSON4 as RScheduleObjectJSON,
        LuxonDateAdapter,
      ) as RRule<typeof LuxonDateAdapter>;

      expect(RRule.isRRule(rrule)).toBeTruthy();
      expect(rrule.options).toEqual(rruleJSON4.options);
      expect(
        (rrule as any).processedOptions.start.isEqual(
          new LuxonDateAdapter(DateTime.fromObject(rruleJSON4.options.start)),
        ),
      ).toBeTruthy();
    });

    test('rdatesJSON', () => {
      const rdates = parseJSON(
        rdatesJSON as RScheduleObjectJSON,
        LuxonDateAdapter,
      ) as RDates<typeof LuxonDateAdapter>;

      expect(RDates.isRDates(rdates)).toBeTruthy();

      rdates.adapters.forEach((adapter, index) => {
        expect(
          adapter.isEqual(LuxonDateAdapter.fromJSON(rdatesJSON.dates[index])),
        ).toBeTruthy();

        expect(adapter.get('timezone')).toBe(rdatesJSON.dates[index].zone);
      });
    });

    test('exdatesJSON', () => {
      const exdates = parseJSON(
        exdatesJSON as RScheduleObjectJSON,
        LuxonDateAdapter,
      ) as EXDates<typeof LuxonDateAdapter>;

      expect(EXDates.isEXDates(exdates)).toBeTruthy();

      exdates.adapters.forEach((adapter, index) => {
        expect(
          adapter.isEqual(LuxonDateAdapter.fromJSON(exdatesJSON.dates[index])),
        ).toBeTruthy();

        expect(adapter.get('timezone')).toBe(
          (exdatesJSON.dates[index] as any).zone,
        );
      });
    });

    test('scheduleJSON', () => {
      const schedule = parseJSON(
        scheduleJSON as RScheduleObjectJSON,
        LuxonDateAdapter,
      ) as Schedule<typeof LuxonDateAdapter>;

      expect(Schedule.isSchedule(schedule)).toBeTruthy();

      schedule.rrules.forEach((rule, index) => {
        const json = scheduleJSON.rrules[index] as IRRuleJSON;

        expect(RRule.isRRule(rule)).toBeTruthy();
        expect(rule.options).toEqual(json.options);
        expect(
          (rule as any).processedOptions.start.isEqual(
            new LuxonDateAdapter(DateTime.fromObject(json.options.start)),
          ),
        ).toBeTruthy();
      });

      schedule.exrules.forEach((rule, index) => {
        const json = scheduleJSON.exrules[index] as IEXRuleJSON;

        expect(EXRule.isEXRule(rule)).toBeTruthy();
        expect(rule.options).toEqual(json.options);
        expect(
          (rule as any).processedOptions.start.isEqual(
            new LuxonDateAdapter(DateTime.fromObject(json.options.start)),
          ),
        ).toBeTruthy();
      });

      schedule.rdates.adapters.forEach((adapter, index) => {
        expect(
          adapter.isEqual(LuxonDateAdapter.fromJSON(rdatesJSON.dates[index])),
        ).toBeTruthy();

        expect(adapter.get('timezone')).toBe(
          (rdatesJSON.dates[index] as any).zone,
        );
      });

      schedule.exdates.adapters.forEach((adapter, index) => {
        expect(
          adapter.isEqual(LuxonDateAdapter.fromJSON(exdatesJSON.dates[index])),
        ).toBeTruthy();

        expect(adapter.get('timezone')).toBe(
          (exdatesJSON.dates[index] as any).zone,
        );
      });
    });
  });
});

describe('serializeToJSON', () => {
  const TZ_DATE_ADAPTERS = [MomentTZDateAdapter, LuxonDateAdapter] as [
    typeof MomentTZDateAdapter,
    typeof LuxonDateAdapter
  ];

  TZ_DATE_ADAPTERS.forEach(dateAdapterConstructor => {
    environment(dateAdapterConstructor, dateAdapter => {
      const DateAdapter = dateAdapter as IDateAdapterConstructor<
        DateAdapterConstructor
      >;

      test('rruleJSON1', () => {
        const rrule = new RRule(
          {
            start: {
              zone: 'Europe/London',
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
            until: {
              zone: 'Europe/London',
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
          { dateAdapter: DateAdapter },
        );

        expect(serializeToJSON(rrule)).toEqual(rruleJSON1);
      });

      test('rruleJSON2', () => {
        const rrule = new RRule(
          {
            start: {
              zone: 'Europe/London',
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
          { dateAdapter: DateAdapter },
        );

        expect(serializeToJSON(rrule)).toEqual(rruleJSON2);
      });

      test('rruleJSON3', () => {
        const rrule = new RRule(
          {
            start: {
              zone: undefined,
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
          { dateAdapter: DateAdapter },
        );

        expect(serializeToJSON(rrule)).toEqual(rruleJSON3);
      });

      test('rruleJSON4', () => {
        const rrule = new RRule(
          {
            start: {
              zone: 'UTC',
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
          { dateAdapter: DateAdapter },
        );

        expect(serializeToJSON(rrule)).toEqual(rruleJSON4);
      });

      test('rdatesJSON', () => {
        const rdates = new RDates({
          dates: [
            {
              zone: 'Europe/London',
              year: 2018,
              month: 10,
              day: 10,
              hour: 11,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            {
              zone: 'UTC',
              year: 2018,
              month: 10,
              day: 11,
              hour: 12,
              minute: 0,
              second: 0,
              millisecond: 0,
            },
            {
              zone: 'UTC',
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
        });

        expect(serializeToJSON(rdates)).toEqual(rdatesJSON);
      });

      test('exdatesJSON', () => {
        const exdates = new EXDates({
          dateAdapter: DateAdapter,
        });

        expect(serializeToJSON(exdates)).toEqual(exdatesJSON);
      });

      test('scheduleJSON', () => {
        const schedule = new Schedule({
          rrules: [
            rruleJSON1.options as any,
            rruleJSON2.options as any,
            rruleJSON3.options as any,
            rruleJSON4.options as any,
          ],
          exrules: [],
          rdates: rdatesJSON.dates.map(json => DateAdapter.fromJSON(json)),
          exdates: exdatesJSON.dates.map(json => DateAdapter.fromJSON(json)),
          dateAdapter: DateAdapter,
        });

        expect(serializeToJSON(schedule)).toEqual(scheduleJSON);
      });
    });
  });
});

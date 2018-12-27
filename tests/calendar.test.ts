import {
  Calendar,
  CollectionsArgs,
  CollectionsGranularity,
  OccurrencesArgs,
  RRule,
  Schedule,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { context, dateAdapter, isoString } from './utilities';

RRule.defaultDateAdapter = StandardDateAdapter;
Schedule.defaultDateAdapter = StandardDateAdapter;
Calendar.defaultDateAdapter = StandardDateAdapter;

function toISOStringsOCC(
  calendar: Calendar<typeof StandardDateAdapter, any>,
  args?: OccurrencesArgs<typeof StandardDateAdapter>,
) {
  return calendar
    .occurrences(args)
    .toArray()!
    .map(occ => occ.toISOString());
}

function toISOStringsCOL(
  calendar: Calendar<typeof StandardDateAdapter, any>,
  args?: CollectionsArgs<typeof StandardDateAdapter>,
) {
  return calendar
    .collections(args)
    .toArray()!
    .map(col =>
      // {start: col.periodStart.toISOString(), end: col.periodEnd.toISOString()},
      col.dates.map(date => date.toISOString()),
    );
}

describe('CalendarClass', () => {
  it('is instantiable', () => expect(new Calendar()).toBeInstanceOf(Calendar));
});

describe('Calendar', () => {
  describe('#occurrences()', () => {
    describe('NO args', () => {
      it('with a single schedule', () => {
        // YearlyByMonthAndMonthDay
        const schedule = new Schedule({
          rrules: [
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({ schedules: schedule });

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ]);

        let iterator = calendar.occurrences();

        let date = iterator.next().value;
        expect(date.toISOString()).toBe(isoString(1998, 1, 5, 9, 0));

        date = iterator.next({ skipToDate: dateAdapter(1998, 3, 5, 9, 0) })
          .value;
        expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0));

        iterator = calendar.occurrences({ reverse: true });

        date = iterator.next().value;
        expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0));

        date = iterator.next({ skipToDate: dateAdapter(1998, 1, 5, 9, 0) })
          .value;
        expect(date.toISOString()).toBe(isoString(1998, 1, 5, 9, 0));
      });

      it('with multiple schedules', () => {
        const scheduleOne = new Schedule({
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 1, 20, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ]);

        let iterator = calendar.occurrences();

        let date = iterator.next().value;
        expect(date.toISOString()).toBe(isoString(1997, 9, 2, 9, 0));

        date = iterator.next({ skipToDate: dateAdapter(1998, 1, 20, 9, 0) })
          .value;
        expect(date.toISOString()).toBe(isoString(1998, 1, 20, 9, 0));

        iterator = calendar.occurrences({ reverse: true });

        date = iterator.next().value;
        expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0));

        date = iterator.next({ skipToDate: dateAdapter(1998, 1, 7, 9, 0) })
          .value;
        expect(date.toISOString()).toBe(isoString(1998, 1, 7, 9, 0));
      });

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ]);
      });

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsOCC(calendar)).toEqual([]);
      });

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ]);
      });

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(toISOStringsOCC(calendar)).toEqual([]);
      });

      it('with multiple rules & RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleThree = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo, scheduleThree],
        });

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 1, 20, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
          isoString(2000, 1, 1, 9, 0),
        ]);
      });
    });

    describe('args: REVERSE', () => {
      it('with a single schedule', () => {
        // YearlyByMonthAndMonthDay
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(
          toISOStringsOCC(calendar, {
            start: dateAdapter(1998, 3, 5, 9, 0).date,
            reverse: true,
          }),
        ).toEqual(
          [
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 3, 5, 9, 0),
          ].reverse(),
        );
      });

      it('with multiple schedules', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(
          toISOStringsOCC(calendar, {
            start: dateAdapter(1998, 3, 5, 9, 0).date,
            reverse: true,
          }),
        ).toEqual(
          [
            isoString(1997, 9, 2, 9, 0),
            isoString(1998, 1, 1, 9, 0),
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 1, 20, 9, 0),
            isoString(1998, 2, 3, 9, 0),
            isoString(1998, 3, 3, 9, 0),
            isoString(1998, 3, 5, 9, 0),
          ].reverse(),
        );
      });

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(
          toISOStringsOCC(calendar, {
            start: dateAdapter(2017, 1, 1, 9, 0).date,
            reverse: true,
          }),
        ).toEqual(
          [
            isoString(1998, 1, 1, 9, 0),
            isoString(1998, 1, 1, 9, 0),
            isoString(2000, 1, 1, 9, 0),
            isoString(2017, 1, 1, 9, 0),
          ].reverse(),
        );
      });

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(
          toISOStringsOCC(calendar, {
            start: dateAdapter(1998, 1, 20, 9, 0).date,
            reverse: true,
          }),
        ).toEqual([]);
      });

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(
          toISOStringsOCC(calendar, {
            start: dateAdapter(2017, 1, 1, 9, 0).date,
            reverse: true,
          }),
        ).toEqual(
          [isoString(2000, 1, 1, 9, 0), isoString(2017, 1, 1, 9, 0)].reverse(),
        );
      });

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(
          toISOStringsOCC(calendar, {
            start: dateAdapter(1998, 1, 1, 9, 0).date,
            reverse: true,
          }),
        ).toEqual([]);
      });

      it('with multiple rules & RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleThree = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo, scheduleThree],
        });

        expect(
          toISOStringsOCC(calendar, {
            start: dateAdapter(2000, 1, 1, 9, 0).date,
            reverse: true,
          }),
        ).toEqual(
          [
            isoString(1997, 9, 2, 9, 0),
            isoString(1998, 1, 1, 9, 0),
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 1, 20, 9, 0),
            isoString(1998, 2, 3, 9, 0),
            isoString(1998, 3, 3, 9, 0),
            isoString(1998, 3, 5, 9, 0),
            isoString(2000, 1, 1, 9, 0),
          ].reverse(),
        );
      });
    });
  });

  describe('#collections()', () => {
    context('INSTANTANIOUSLY', (granularity: CollectionsGranularity) => {
      it('with a single schedule', () => {
        // YearlyByMonthAndMonthDay
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 5, 9, 0)],
          [isoString(1998, 1, 7, 9, 0)],
          [isoString(1998, 3, 5, 9, 0)],
        ]);
      });

      it('with multiple schedules', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1997, 9, 2, 9, 0)],
          [isoString(1998, 1, 1, 9, 0)],
          [isoString(1998, 1, 5, 9, 0)],
          [isoString(1998, 1, 7, 9, 0)],
          [isoString(1998, 1, 20, 9, 0)],
          [isoString(1998, 2, 3, 9, 0)],
          [isoString(1998, 3, 3, 9, 0)],
          [isoString(1998, 3, 5, 9, 0)],
        ]);
      });

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 1, 9, 0), isoString(1998, 1, 1, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ]);
      });

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([]);
      });

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ]);
      });

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([]);
      });

      it('with multiple rules & RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleThree = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo, scheduleThree],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1997, 9, 2, 9, 0)],
          [isoString(1998, 1, 1, 9, 0)],
          [isoString(1998, 1, 5, 9, 0)],
          [isoString(1998, 1, 7, 9, 0)],
          [isoString(1998, 1, 20, 9, 0)],
          [isoString(1998, 2, 3, 9, 0)],
          [isoString(1998, 3, 3, 9, 0)],
          [isoString(1998, 3, 5, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
        ]);
      });
    });

    context('YEARLY', (granularity: CollectionsGranularity) => {
      it('with a single schedule', () => {
        // YearlyByMonthAndMonthDay
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 3, 5, 9, 0),
          ],
        ]);
      });

      it('with multiple schedules', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1997, 9, 2, 9, 0)],
          [
            isoString(1998, 1, 1, 9, 0),
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 1, 20, 9, 0),
            isoString(1998, 2, 3, 9, 0),
            isoString(1998, 3, 3, 9, 0),
            isoString(1998, 3, 5, 9, 0),
          ],
        ]);
      });

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 1, 9, 0), isoString(1998, 1, 1, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ]);
      });

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([]);
      });

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ]);
      });

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([]);
      });

      it('with multiple rules & RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleThree = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo, scheduleThree],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1997, 9, 2, 9, 0)],
          [
            isoString(1998, 1, 1, 9, 0),
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 1, 20, 9, 0),
            isoString(1998, 2, 3, 9, 0),
            isoString(1998, 3, 3, 9, 0),
            isoString(1998, 3, 5, 9, 0),
          ],
          [isoString(2000, 1, 1, 9, 0)],
        ]);
      });
    });

    context('MONTHLY', (granularity: CollectionsGranularity) => {
      it('next month', () => {
        // This tests a specific bug encountered
        const date = new Date(2018, 7, 14);

        const rule = new RRule(
          {
            start: new StandardDateAdapter(date),
            frequency: 'WEEKLY',
            byDayOfWeek: ['TU'],
          },
          {
            dateAdapter: StandardDateAdapter,
          },
        );

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [rule],
          }),
        });

        const collection = calendar
          .collections({
            start: new Date(2018, 8, 1),
            end: new Date(2018, 8, 30),
            granularity,
            weekStart: 'MO',
          })
          .next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([
          new Date(2018, 7, 28).toISOString(),
          new Date(2018, 8, 4).toISOString(),
          new Date(2018, 8, 11).toISOString(),
          new Date(2018, 8, 18).toISOString(),
          new Date(2018, 8, 25).toISOString(),
        ]);
      });

      it('this month linearly', () => {
        // This tests a specific bug encountered
        const date = new Date(2018, 7, 14);

        const rule = new RRule(
          {
            start: date,
            frequency: 'WEEKLY',
            byDayOfWeek: ['TU'],
          },
          {
            dateAdapter: StandardDateAdapter,
          },
        );

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [rule],
          }),
        });

        const iterator = calendar.collections({
          start: new Date(2018, 6, 1),
          end: new Date(2018, 7, 30),
          granularity,
          weekStart: 'MO',
          incrementLinearly: true,
        });

        let collection = iterator.next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([]);

        collection = iterator.next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([
          new Date(2018, 7, 14).toISOString(),
          new Date(2018, 7, 21).toISOString(),
          new Date(2018, 7, 28).toISOString(),
        ]);
      });

      it('this month linearly 2', () => {
        // This tests a specific bug encountered
        const date = new Date(2018, 7, 14);

        const rule = new RRule(
          {
            start: date,
            frequency: 'WEEKLY',
            byDayOfWeek: ['TU'],
            weekStart: 'MO',
          },
          {
            dateAdapter: StandardDateAdapter,
          },
        );

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [rule],
          }),
        });

        const iterator = calendar.collections({
          start: new Date(2018, 10, 10),
          granularity,
          weekStart: 'MO',
          incrementLinearly: true,
        });

        let collection = iterator.next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([
          new Date(2018, 9, 30).toISOString(),
          new Date(2018, 10, 6).toISOString(),
          new Date(2018, 10, 13).toISOString(),
          new Date(2018, 10, 20).toISOString(),
          new Date(2018, 10, 27).toISOString(),
        ]);

        collection = iterator.next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([
          new Date(2018, 10, 27).toISOString(),
          new Date(2018, 11, 4).toISOString(),
          new Date(2018, 11, 11).toISOString(),
          new Date(2018, 11, 18).toISOString(),
          new Date(2018, 11, 25).toISOString(),
          new Date(2019, 0, 1).toISOString(),
        ]);
      });

      it('next month linearly', () => {
        // This tests a specific bug encountered
        const date = new Date(2018, 7, 14);

        const rule = new RRule(
          {
            start: new StandardDateAdapter(date),
            frequency: 'WEEKLY',
            byDayOfWeek: ['TU'],
          },
          {
            dateAdapter: StandardDateAdapter,
          },
        );

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [rule],
          }),
        });

        const iterator = calendar.collections({
          start: new StandardDateAdapter(new Date(2018, 8, 1)).date,
          end: new StandardDateAdapter(new Date(2018, 8, 30)).date,
          granularity,
          weekStart: 'MO',
          incrementLinearly: true,
        });

        const collection = iterator.next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([
          new Date(2018, 7, 28).toISOString(),
          new Date(2018, 8, 4).toISOString(),
          new Date(2018, 8, 11).toISOString(),
          new Date(2018, 8, 18).toISOString(),
          new Date(2018, 8, 25).toISOString(),
        ]);
      });

      it('this next & next month linearly', () => {
        // This tests a specific bug encountered
        const date = new Date(2018, 7, 14);

        const rule = new RRule(
          {
            start: new StandardDateAdapter(date),
            frequency: 'WEEKLY',
            byDayOfWeek: ['TU'],
          },
          {
            dateAdapter: StandardDateAdapter,
          },
        );

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [rule],
          }),
        });

        const iterator = calendar.collections({
          start: new StandardDateAdapter(new Date(2018, 7, 1)).date,
          end: new StandardDateAdapter(new Date(2018, 8, 30)).date,
          granularity,
          weekStart: 'MO',
          incrementLinearly: true,
        });

        let collection = iterator.next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([
          new Date(2018, 7, 14).toISOString(),
          new Date(2018, 7, 21).toISOString(),
          new Date(2018, 7, 28).toISOString(),
        ]);

        collection = iterator.next().value;

        expect(collection.dates.map(date => date.toISOString())).toEqual([
          new Date(2018, 7, 28).toISOString(),
          new Date(2018, 8, 4).toISOString(),
          new Date(2018, 8, 11).toISOString(),
          new Date(2018, 8, 18).toISOString(),
          new Date(2018, 8, 25).toISOString(),
        ]);
      });

      it('with a single schedule', () => {
        // YearlyByMonthAndMonthDay
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 5, 9, 0), isoString(1998, 1, 7, 9, 0)],
          [isoString(1998, 3, 5, 9, 0)],
        ]);
      });

      it('with multiple schedules', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1997, 9, 2, 9, 0)],
          [
            isoString(1998, 1, 1, 9, 0),
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 1, 20, 9, 0),
          ],
          [isoString(1998, 2, 3, 9, 0)],
          [isoString(1998, 3, 3, 9, 0), isoString(1998, 3, 5, 9, 0)],
        ]);
      });

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 1, 9, 0), isoString(1998, 1, 1, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ]);
      });

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([]);
      });

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ]);
      });

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: schedule,
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([]);
      });

      it('with multiple rules & RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // YearlyByMonthAndMonthDay
            {
              frequency: 'YEARLY',
              count: 3,
              byMonthOfYear: [1, 3],
              byDayOfMonth: [5, 7],
              start: dateAdapter(1997, 9, 2, 9),
            },
            // WeeklyIntervalLarge
            {
              frequency: 'WEEKLY',
              count: 2,
              interval: 20,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleTwo = new Schedule({
          dateAdapter: StandardDateAdapter,
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        });

        const scheduleThree = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [
            dateAdapter(1998, 1, 20, 9, 0).date,
            dateAdapter(1998, 1, 1, 9, 0).date,
          ],
        });

        const calendar = new Calendar({
          dateAdapter: StandardDateAdapter,
          schedules: [scheduleOne, scheduleTwo, scheduleThree],
        });

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1997, 9, 2, 9, 0)],
          [
            isoString(1998, 1, 1, 9, 0),
            isoString(1998, 1, 5, 9, 0),
            isoString(1998, 1, 7, 9, 0),
            isoString(1998, 1, 20, 9, 0),
          ],
          [isoString(1998, 2, 3, 9, 0)],
          [isoString(1998, 3, 3, 9, 0), isoString(1998, 3, 5, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
        ]);
      });

      describe('and `weekStart`, `start`, `end`', () => {
        const weekStart = 'MO';

        it('with a single schedule', () => {
          // YearlyByMonthAndMonthDay
          const schedule = new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: dateAdapter(1997, 9, 2, 9),
              },
            ],
          });

          const calendar = new Calendar({
            dateAdapter: StandardDateAdapter,
            schedules: schedule,
          });

          expect(
            toISOStringsCOL(calendar, {
              granularity,
              weekStart,
              start: dateAdapter(1998, 1, 1, 9, 0).date,
              end: dateAdapter(1998, 1, 5, 9, 0).date,
            }),
          ).toEqual([
            [isoString(1998, 1, 5, 9, 0), isoString(1998, 1, 7, 9, 0)],
          ]);
        });

        it('with multiple schedules', () => {
          const scheduleOne = new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [
              // YearlyByMonthAndMonthDay
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: dateAdapter(1997, 9, 2, 9),
              },
              // WeeklyIntervalLarge
              {
                frequency: 'WEEKLY',
                count: 2,
                interval: 20,
                start: dateAdapter(1997, 9, 2, 9),
              },
            ],
          });

          const scheduleTwo = new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [
              // DailyByMonthDayAndWeekDay
              {
                frequency: 'DAILY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: dateAdapter(1997, 9, 2, 9),
              },
            ],
          });

          const calendar = new Calendar({
            dateAdapter: StandardDateAdapter,
            schedules: [scheduleOne, scheduleTwo],
          });

          expect(
            toISOStringsCOL(calendar, {
              granularity,
              weekStart,
              start: dateAdapter(1998, 1, 1, 9, 0).date,
              end: dateAdapter(1998, 1, 5, 9, 0).date,
            }),
          ).toEqual([
            [
              isoString(1998, 1, 1, 9, 0),
              isoString(1998, 1, 5, 9, 0),
              isoString(1998, 1, 7, 9, 0),
              isoString(1998, 1, 20, 9, 0),
            ],
          ]);
        });

        it('with RDates', () => {
          const scheduleOne = new Schedule({
            dateAdapter: StandardDateAdapter,
            rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          });

          const scheduleTwo = new Schedule({
            dateAdapter: StandardDateAdapter,
            rdates: [
              dateAdapter(1998, 1, 1, 9, 0).date,
              dateAdapter(2000, 1, 1, 9, 0).date,
              dateAdapter(2017, 1, 1, 9, 0).date,
            ],
          });

          const calendar = new Calendar({
            dateAdapter: StandardDateAdapter,
            schedules: [scheduleOne, scheduleTwo],
          });

          expect(
            toISOStringsCOL(calendar, {
              granularity,
              weekStart,
              start: dateAdapter(1998, 1, 1, 9, 0).date,
              end: dateAdapter(1998, 1, 5, 9, 0).date,
            }),
          ).toEqual([
            [isoString(1998, 1, 1, 9, 0), isoString(1998, 1, 1, 9, 0)],
          ]);
        });

        it('with EXDates', () => {
          const scheduleOne = new Schedule({
            dateAdapter: StandardDateAdapter,
            exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
          });

          const scheduleTwo = new Schedule({
            dateAdapter: StandardDateAdapter,
            exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          });

          const calendar = new Calendar({
            dateAdapter: StandardDateAdapter,
            schedules: [scheduleOne, scheduleTwo],
          });

          expect(
            toISOStringsCOL(calendar, {
              granularity,
              weekStart,
              start: dateAdapter(1998, 1, 1, 9, 0).date,
              end: dateAdapter(1998, 1, 5, 9, 0).date,
            }),
          ).toEqual([]);
        });

        it('with RDates & EXDates', () => {
          const scheduleOne = new Schedule({
            dateAdapter: StandardDateAdapter,
            rdates: [
              dateAdapter(1998, 1, 1, 9, 0).date,
              dateAdapter(2000, 1, 1, 9, 0).date,
            ],
            exdates: [
              dateAdapter(1998, 1, 20, 9, 0).date,
              dateAdapter(1998, 1, 1, 9, 0).date,
            ],
          });

          const scheduleTwo = new Schedule({
            dateAdapter: StandardDateAdapter,
            rdates: [
              dateAdapter(1998, 1, 1, 9, 0).date,
              dateAdapter(2017, 1, 1, 9, 0).date,
            ],
            exdates: [
              dateAdapter(2000, 1, 1, 9, 0).date,
              dateAdapter(1998, 1, 1, 9, 0).date,
            ],
          });

          const calendar = new Calendar({
            dateAdapter: StandardDateAdapter,
            schedules: [scheduleOne, scheduleTwo],
          });

          expect(
            toISOStringsCOL(calendar, {
              granularity,
              weekStart,
              start: dateAdapter(1998, 1, 1, 9, 0).date,
              end: dateAdapter(1998, 1, 5, 9, 0).date,
            }),
          ).toEqual([]);
        });

        it('with RDates & EXDates cancelling out', () => {
          const schedule = new Schedule({
            dateAdapter: StandardDateAdapter,
            rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
            exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          });

          const calendar = new Calendar({
            dateAdapter: StandardDateAdapter,
            schedules: schedule,
          });

          expect(
            toISOStringsCOL(calendar, {
              granularity,
              weekStart,
              start: dateAdapter(1998, 1, 1, 9, 0).date,
              end: dateAdapter(1998, 1, 5, 9, 0).date,
            }),
          ).toEqual([]);
        });

        it('with multiple rules & RDates & EXDates', () => {
          const scheduleOne = new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [
              // YearlyByMonthAndMonthDay
              {
                frequency: 'YEARLY',
                count: 3,
                byMonthOfYear: [1, 3],
                byDayOfMonth: [5, 7],
                start: dateAdapter(1997, 9, 2, 9),
              },
              // WeeklyIntervalLarge
              {
                frequency: 'WEEKLY',
                count: 2,
                interval: 20,
                start: dateAdapter(1997, 9, 2, 9),
              },
            ],
          });

          const scheduleTwo = new Schedule({
            dateAdapter: StandardDateAdapter,
            rrules: [
              // DailyByMonthDayAndWeekDay
              {
                frequency: 'DAILY',
                count: 3,
                byDayOfMonth: [1, 3],
                byDayOfWeek: ['TU', 'TH'],
                start: dateAdapter(1997, 9, 2, 9),
              },
            ],
          });

          const scheduleThree = new Schedule({
            dateAdapter: StandardDateAdapter,
            rdates: [
              dateAdapter(1998, 1, 1, 9, 0).date,
              dateAdapter(2000, 1, 1, 9, 0).date,
            ],
            exdates: [
              dateAdapter(1998, 1, 20, 9, 0).date,
              dateAdapter(1998, 1, 1, 9, 0).date,
            ],
          });

          const calendar = new Calendar({
            dateAdapter: StandardDateAdapter,
            schedules: [scheduleOne, scheduleTwo, scheduleThree],
          });

          expect(
            toISOStringsCOL(calendar, {
              granularity,
              weekStart,
              start: dateAdapter(1998, 1, 1, 9, 0).date,
              end: dateAdapter(1998, 2, 5, 9, 0).date,
            }),
          ).toEqual([
            [
              isoString(1998, 1, 1, 9, 0),
              isoString(1998, 1, 5, 9, 0),
              isoString(1998, 1, 7, 9, 0),
              isoString(1998, 1, 20, 9, 0),
            ],
            [isoString(1998, 2, 3, 9, 0)],
          ]);
        });
      });
    });
  });
});

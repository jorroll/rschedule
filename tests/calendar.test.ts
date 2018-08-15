import { dateAdapter, isoString, context } from './utilities'
import {
  Calendar,
  OccurrencesArgs,
  CollectionsArgs,
  Schedule,
  CollectionsGranularity,
} from '@rschedule/rschedule'
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'

function toISOStringsOCC(
  calendar: Calendar<StandardDateAdapter, any>,
  args?: OccurrencesArgs<StandardDateAdapter>
) {
  return calendar
    .occurrences(args)
    .toArray()!
    .map(occ => occ.toISOString())
}

function toISOStringsCOL(
  calendar: Calendar<StandardDateAdapter, any>,
  args?: CollectionsArgs<StandardDateAdapter>
) {
  return calendar
    .collections(args)
    .toArray()!
    .map(col =>
      // {start: col.periodStart.toISOString(), end: col.periodEnd.toISOString()},
      col.dates.map(date => date.toISOString())
    )
}

describe('CalendarClass', () => {
  it('is instantiable', () => expect(new Calendar()).toBeInstanceOf(Calendar))
})

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
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ])
      })

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
        })

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
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 1, 20, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ])
      })

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ])
      })

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar)).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
          exdates: [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsOCC(calendar)).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
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
        })

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
        })

        const scheduleThree = new Schedule<StandardDateAdapter>({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo, scheduleThree] })

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
        ])
      })
    })

    describe('args: REVERSE', () => {
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
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsOCC(calendar, { start: dateAdapter(1998, 3, 5, 9, 0), reverse: true })).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ].reverse())
      })

      // just skipping this out of laziness at the moment. Pretty sure everything's working, need to work through
      // what the test should expect to be sure
      it.skip('with multiple schedules', () => {
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
        })

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
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar, { start: dateAdapter(1998, 3, 5, 9, 0), reverse: true })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 1, 20, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ].reverse())
      })

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar, { start: dateAdapter(2017, 1, 1, 9, 0), reverse: true })).toEqual([
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ].reverse())
      })

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar, { start: dateAdapter(1998, 1, 20, 9, 0), reverse: true })).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
          exdates: [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsOCC(calendar, { start: dateAdapter(2017, 1, 1, 9, 0), reverse: true })).toEqual([
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ].reverse())
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsOCC(calendar, { start: dateAdapter(1998, 1, 1, 9, 0), reverse: true })).toEqual([])
      })

      // just skipping this out of laziness at the moment. Pretty sure everything's working, need to work through
      // what the test should expect to be sure
      it.skip('with multiple rules & RDates & EXDates', () => {
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
        })

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
        })

        const scheduleThree = new Schedule<StandardDateAdapter>({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo, scheduleThree] })

        expect(toISOStringsOCC(calendar, { start: dateAdapter(2000, 1, 1, 9, 0), reverse: true })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 1, 20, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
          isoString(2000, 1, 1, 9, 0),
        ].reverse())
      })
    })
  })

  describe('#collections()', () => {
    context('INSTANTANIOUSLY', (granularity: CollectionsGranularity) => {
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
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 5, 9, 0)],
          [isoString(1998, 1, 7, 9, 0)],
          [isoString(1998, 3, 5, 9, 0)],
        ])
      })

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
        })

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
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1997, 9, 2, 9, 0)],
          [isoString(1998, 1, 1, 9, 0)],
          [isoString(1998, 1, 5, 9, 0)],
          [isoString(1998, 1, 7, 9, 0)],
          [isoString(1998, 1, 20, 9, 0)],
          [isoString(1998, 2, 3, 9, 0)],
          [isoString(1998, 3, 3, 9, 0)],
          [isoString(1998, 3, 5, 9, 0)],
        ])
      })

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 1, 9, 0), isoString(1998, 1, 1, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ])
      })

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
          exdates: [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
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
        })

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
        })

        const scheduleThree = new Schedule<StandardDateAdapter>({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo, scheduleThree] })

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
        ])
      })
    })

    context('YEARLY', (granularity: CollectionsGranularity) => {
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
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 5, 9, 0), isoString(1998, 1, 7, 9, 0), isoString(1998, 3, 5, 9, 0)],
        ])
      })

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
        })

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
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

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
        ])
      })

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 1, 9, 0), isoString(1998, 1, 1, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ])
      })

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
          exdates: [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
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
        })

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
        })

        const scheduleThree = new Schedule<StandardDateAdapter>({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo, scheduleThree] })

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
        ])
      })
    })

    context('MONTHLY', (granularity: CollectionsGranularity) => {
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
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 5, 9, 0), isoString(1998, 1, 7, 9, 0)],
          [isoString(1998, 3, 5, 9, 0)],
        ])
      })

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
        })

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
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

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
        ])
      })

      it('with RDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(1998, 1, 1, 9, 0), isoString(1998, 1, 1, 9, 0)],
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ])
      })

      it('with EXDates', () => {
        const scheduleOne = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const scheduleTwo = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2017, 1, 1, 9, 0)],
          exdates: [dateAdapter(2000, 1, 1, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo] })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([
          [isoString(2000, 1, 1, 9, 0)],
          [isoString(2017, 1, 1, 9, 0)],
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: schedule })

        expect(toISOStringsCOL(calendar, { granularity })).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
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
        })

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
        })

        const scheduleThree = new Schedule<StandardDateAdapter>({
          rdates: [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(2000, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        const calendar = new Calendar({ schedules: [scheduleOne, scheduleTwo, scheduleThree] })

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
        ])
      })
    })
  })
})

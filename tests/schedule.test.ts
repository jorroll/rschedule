// @ts-ignore
import { Schedule, OccurrencesArgs } from '@rschedule/rschedule'
import { dateAdapter, isoString } from './utilities'
// @ts-ignore
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'

function toISOStrings(
  schedule: Schedule<StandardDateAdapter, any>,
  args?: OccurrencesArgs<StandardDateAdapter>
) {
  return schedule
    .occurrences(args)
    .toArray()
    .map(occ => occ.toISOString())
}

describe('ScheduleClass', () => {
  it('is instantiable', () => expect(new Schedule()).toBeInstanceOf(Schedule))
})

describe('Schedule', () => {
  describe('#occurrences()', () => {
    describe('NO args', () => {
      it('with a single rule', () => {
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

        expect(toISOStrings(schedule)).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ])
      })

      it('with multiple rules', () => {
        const schedule = new Schedule({
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

        expect(toISOStrings(schedule)).toEqual([
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

      it('with RDates & duplicate', () => {
        const schedule = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        expect(toISOStrings(schedule)).toEqual([
          isoString(1998, 1, 1, 9, 0),
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ])
      })

      it('with EXDates', () => {
        const schedule = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule)).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const schedule = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule)).toEqual([
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule)).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
        const schedule = new Schedule({
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
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule)).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ])
      })
    })

    describe('args: END', () => {
      it('with a single rule', () => {
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

        expect(toISOStrings(schedule, { end: dateAdapter(1998, 1, 7, 9, 0) })).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
        ])
      })

      it('with multiple rules', () => {
        const schedule = new Schedule({
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

        expect(toISOStrings(schedule, { end: dateAdapter(1998, 2, 3, 9, 0) })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 1, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 1, 20, 9, 0),
          isoString(1998, 2, 3, 9, 0),
        ])
      })

      it('with RDates', () => {
        const schedule = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        expect(toISOStrings(schedule, { end: dateAdapter(2000, 1, 1, 9, 0) })).toEqual([
          isoString(1998, 1, 1, 9, 0),
          isoString(2000, 1, 1, 9, 0),
        ])
      })

      it('with EXDates', () => {
        const schedule = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { end: dateAdapter(1998, 1, 7, 9, 0) })).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const schedule = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { end: dateAdapter(2000, 1, 1, 9, 0) })).toEqual([
          isoString(2000, 1, 1, 9, 0),
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { end: dateAdapter(1998, 1, 7, 9, 0) })).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
        const schedule = new Schedule({
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
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { end: dateAdapter(1998, 3, 5, 9, 0) })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ])
      })
    })

    describe('args: TAKE', () => {
      it('with a single rule', () => {
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

        expect(toISOStrings(schedule, { take: 2 })).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
        ])
      })

      it('with multiple rules', () => {
        const schedule = new Schedule({
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

        expect(toISOStrings(schedule, { take: 2 })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 1, 9, 0),
        ])
      })

      it('with RDates', () => {
        const schedule = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })

        expect(toISOStrings(schedule, { take: 2 })).toEqual([
          isoString(1998, 1, 1, 9, 0),
          isoString(2000, 1, 1, 9, 0),
        ])
      })

      it('with EXDates', () => {
        const schedule = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { take: 2 })).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const schedule = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { take: 3 })).toEqual([
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { take: 3 })).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
        const schedule = new Schedule({
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
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })

        expect(toISOStrings(schedule, { take: 5 })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
        ])
      })
    })
  })
})

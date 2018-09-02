import { dateAdapter, isoString } from './utilities'
import {
  OccurrencesArgs,
  Schedule,
  buildIterator,
  intersection,
  OperatorObject,
  Calendar,
} from '@rschedule/rschedule'
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'

function toISOStringsOCC(
  calendar: Calendar<typeof StandardDateAdapter, any>,
  args?: OccurrencesArgs<typeof StandardDateAdapter>
) {
  return calendar
    .occurrences(args)
    .toArray()!
    .map(occ => occ.toISOString())
}

describe('Intersection Calendar', () => {
  describe('#occurrences()', () => {
    describe('NO args', () => {
      it('with a single schedule', () => {
        // YearlyByMonthAndMonthDay
        const schedule = new Schedule({ dateAdapter: StandardDateAdapter, 
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

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, schedule))})

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ])

        let iterator = calendar.occurrences()

        let date = iterator.next().value
        expect(date.toISOString()).toBe(isoString(1998, 1, 5, 9, 0))

        date = iterator.next({skipToDate: dateAdapter(1998, 3, 5, 9, 0)}).value
        expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0))

        iterator = calendar.occurrences({reverse: true})

        date = iterator.next().value
        expect(date.toISOString()).toBe(isoString(1998, 3, 5, 9, 0))
        
        date = iterator.next({skipToDate: dateAdapter(1998, 1, 5, 9, 0)}).value
        expect(date.toISOString()).toBe(isoString(1998, 1, 5, 9, 0))
      })

      it('with multiple schedules', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
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

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
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
          rdates: [
            dateAdapter(1997, 9, 2, 9).date,
          ]
        })

        

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1997, 9, 2, 9, 0),
        ])
      })

      it('with multiple schedules two', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
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
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1997, 9, 4, 9, 0),
          isoString(1997, 9, 9, 9, 0),
        ])

        let iterator = calendar.occurrences()

        let date = iterator.next().value
        expect(date.toISOString()).toBe(isoString(1997, 9, 2, 9, 0))

        date = iterator.next({skipToDate: dateAdapter(1997, 9, 9, 9, 0)}).value
        expect(date.toISOString()).toBe(isoString(1997, 9, 9, 9, 0))

        iterator = calendar.occurrences({reverse: true})

        date = iterator.next().value
        expect(date.toISOString()).toBe(isoString(1997, 9, 9, 9, 0))
        
        date = iterator.next({skipToDate: dateAdapter(1997, 9, 2, 9, 0)}).value
        expect(date.toISOString()).toBe(isoString(1997, 9, 2, 9, 0))
      })

      it('with RDates', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1998, 1, 1, 9, 0),
        ])
      })

      it('with EXDates', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar)).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date, dateAdapter(2000, 1, 1, 9, 0).date, dateAdapter(2017, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date, dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date, dateAdapter(2000, 1, 1, 9, 0).date, dateAdapter(2017, 1, 1, 9, 0).date],
          exdates: [dateAdapter(2000, 1, 1, 9, 0).date, dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(2017, 1, 1, 9, 0),
        ])
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, schedule))})

        expect(toISOStringsOCC(calendar)).toEqual([])
      })

      it('with multiple rules & RDates & EXDates', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
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
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfMonth: [1, 3],
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
            {
              frequency: 'WEEKLY',
              count: 2,
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        })

        const scheduleThree = new Schedule({
          dateAdapter: StandardDateAdapter,
          rdates: [
            dateAdapter(1997, 9, 2, 9, 0).date,
            dateAdapter(1997, 9, 9, 9, 0).date,  
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
          ],
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date, dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo, scheduleThree))})

        expect(toISOStringsOCC(calendar)).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1997, 9, 9, 9, 0),
        ])
      })
    })

    describe('args: REVERSE', () => {
      it('with a single schedule', () => {
        // YearlyByMonthAndMonthDay
        const schedule = new Schedule({ dateAdapter: StandardDateAdapter, 
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

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, schedule))})

        expect(toISOStringsOCC(calendar, { start: dateAdapter(1998, 3, 5, 9, 0).date, reverse: true })).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ].reverse())
      })

      it('with multiple schedules', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
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
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },    
          ],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          rrules: [
            // DailyByMonthDayAndWeekDay
            {
              frequency: 'DAILY',
              count: 3,
              byDayOfWeek: ['TU', 'TH'],
              start: dateAdapter(1997, 9, 2, 9),
            },
          ],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar, { reverse: true })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1997, 9, 4, 9, 0),
          isoString(1997, 9, 9, 9, 0),
        ].reverse())
      })

      it('with RDates', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0).date,
            dateAdapter(2000, 1, 1, 9, 0).date,
            dateAdapter(2017, 1, 1, 9, 0).date,
          ],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar, { reverse: true })).toEqual([
          isoString(1998, 1, 1, 9, 0),
        ].reverse())
      })

      it('with EXDates', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar, { start: dateAdapter(1998, 1, 20, 9, 0).date, reverse: true })).toEqual([])
      })

      it('with RDates & EXDates', () => {
        const scheduleOne = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date, dateAdapter(2000, 1, 1, 9, 0).date, dateAdapter(2017, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 20, 9, 0).date, dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const scheduleTwo = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date, dateAdapter(2000, 1, 1, 9, 0).date, dateAdapter(2017, 1, 1, 9, 0).date],
          exdates: [dateAdapter(2000, 1, 1, 9, 0).date, dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, scheduleOne, scheduleTwo))})

        expect(toISOStringsOCC(calendar, { start: dateAdapter(2017, 1, 1, 9, 0).date, reverse: true })).toEqual([
          isoString(2017, 1, 1, 9, 0),
        ].reverse())
      })

      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({ dateAdapter: StandardDateAdapter, 
          rdates: [dateAdapter(1998, 1, 1, 9, 0).date],
          exdates: [dateAdapter(1998, 1, 1, 9, 0).date],
        })

        const calendar = new Calendar({ dateAdapter: StandardDateAdapter, schedules: buildIterator(intersection({ maxFailedIterations: 50 }, schedule))})

        expect(toISOStringsOCC(calendar, { start: dateAdapter(1998, 1, 1, 9, 0).date, reverse: true })).toEqual([])
      })

    })
  })
})

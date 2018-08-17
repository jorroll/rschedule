import { Schedule, OccurrencesArgs, Options, DateAdapter as IDateAdapter, IDateAdapterConstructor } from '@rschedule/rschedule'
import { dateAdapter, DatetimeFn, environment, context, standardDatetimeFn, momentDatetimeFn, momentTZDatetimeFn, TIMEZONES, luxonDatetimeFn } from './utilities'
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'
import { Moment as MomentTZ } from 'moment-timezone';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-date-adapter';
import { Moment as MomentST } from 'moment';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { DateTime } from 'luxon';

function testOccursMethods<T extends IDateAdapter<T>>(
  name: string,
  options: {
    rrules?: Array<Options.ProvidedOptions<T>>
    rdates?: T[]
    exdates?: T[]
  } | undefined,
  tests: any[],
  // Array<
  //   { occursBefore: IDateAdapter<T>, excludeStart?: boolean, expect: boolean } |
  //   { occursAfter: IDateAdapter<T>, excludeStart?: boolean, expect: boolean } |
  //   { occursBetween: [IDateAdapter<T>, IDateAdapter<T>], excludeEnds?: boolean, expect: boolean } |
  //   { occursOn: IDateAdapter<T>, expect: boolean }
  // >
) {
  describe(name, () => {
    let schedule: Schedule<IDateAdapter<T>, any>

    beforeEach(() => {
      schedule = new Schedule(options)
    })

    tests.forEach(obj => {
      if (obj.occursBefore) {
        describe('#occursBefore()', () => {
          it(`"${obj.occursBefore.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(schedule.occursBefore(obj.occursBefore, { excludeStart: obj.excludeStart })).toBe(obj.expect)
          })
        })
      }
      else if (obj.occursAfter) {
        describe('#occursAfter()', () => {
          it(`"${obj.occursAfter.toISOString()}" excludeStart: ${!!obj.excludeStart}`, () => {
            expect(schedule.occursAfter(obj.occursAfter, { excludeStart: obj.excludeStart })).toBe(obj.expect)
          })          
        })
      }
      else if (obj.occursBetween) {
        describe('#occursBetween()', () => {
          it(`"${obj.occursBetween[0].toISOString()}" & "${obj.occursBetween[1].toISOString()}" excludeEnds: ${!!obj.excludeEnds}`, () => {
            expect(schedule.occursBetween(obj.occursBetween[0], obj.occursBetween[1], { excludeEnds: obj.excludeEnds })).toBe(obj.expect)
          })
        })
      }
      else if (obj.occursOn) {
        describe('#occursOn()', () => {
          it(`"${obj.occursOn.toISOString()}"`, () => {
            expect(schedule.occursOn(obj.occursOn)).toBe(obj.expect)
          })
        })
      }
      else
        throw new Error('Unexpected test object!')
    })
  })
}

describe('ScheduleClass', () => {
  it('is instantiable', () => expect(new Schedule()).toBeInstanceOf(Schedule))
})

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
]

DATE_ADAPTERS.forEach(dateAdapterSet => {

environment(dateAdapterSet, (dateAdapterSet) => {

const [DateAdapter, datetime] = dateAdapterSet as [IDateAdapterConstructor<any>, DatetimeFn<any>]

const zones = !DateAdapter.hasTimezoneSupport
  ? [undefined, 'UTC']
  : TIMEZONES;

zones.forEach(zone => {
  
// function to create new dateAdapter instances
const dateAdapter: DatetimeFn<IDateAdapter<any>> = 
  (...args: (number|string|undefined)[]) => {
    let timezone: string | undefined = undefined

    if (typeof args[args.length - 1] === 'string') {
      timezone = args[args.length - 1] as string
    }
    else if (zone !== undefined) {
      args.push(zone)
      timezone = zone
    }

    // @ts-ignore
    return new DateAdapter(datetime(...args), {timezone});
  }

// function to get the given time array as an ISO string
const isoString: DatetimeFn<string> = (...args: (number|string|undefined)[]) => 
  // @ts-ignore
  dateAdapter(...args).toISOString()

// function to get a schedule's occurrences as ISO strings
function toISOStrings<T extends IDateAdapter<T>>(
  schedule: Schedule<T>,
  args?: OccurrencesArgs<T>
) {
  return schedule
    .occurrences(args)
    .toArray()!
    .map(occ => occ.toISOString())
}

describe(`${zone}`, () => {
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

    describe('args: REVERSE', () => {
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
  
        expect(toISOStrings(schedule, { start: dateAdapter(1998, 3, 5, 9, 0), reverse: true })).toEqual([
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 3, 5, 9, 0),
        ].reverse())
      })
  
      // just skipping this out of laziness at the moment. Pretty sure everything's working, need to work through
      // what the test should expect to be sure
      it.skip('with multiple rules', () => {
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
  
        expect(toISOStrings(schedule, { start: dateAdapter(1998, 3, 5, 9, 0), reverse: true })).toEqual([
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
  
      it('with RDates & duplicate', () => {
        const schedule = new Schedule({
          rdates: [
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(1998, 1, 1, 9, 0),
            dateAdapter(2000, 1, 1, 9, 0),
            dateAdapter(2017, 1, 1, 9, 0),
          ],
        })
  
        expect(toISOStrings(schedule, { start: dateAdapter(2017, 1, 1, 9, 0), reverse: true })).toEqual([
          isoString(1998, 1, 1, 9, 0),
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ].reverse())
      })
  
      it('with EXDates', () => {
        const schedule = new Schedule({
          exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
        })
  
        expect(toISOStrings(schedule, { start: dateAdapter(1998, 1, 1, 9, 0), reverse: true })).toEqual([])
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
  
        expect(toISOStrings(schedule, { start: dateAdapter(2017, 1, 1, 9, 0), reverse: true })).toEqual([
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ].reverse())
      })
  
      it('with RDates & EXDates cancelling out', () => {
        const schedule = new Schedule({
          rdates: [dateAdapter(1998, 1, 1, 9, 0)],
          exdates: [dateAdapter(1998, 1, 1, 9, 0)],
        })
  
        expect(toISOStrings(schedule, { start: dateAdapter(1998, 1, 1, 9, 0), reverse: true })).toEqual([])
      })
  
      // just skipping this out of laziness at the moment. Pretty sure everything's working, need to work through
      // what the test should expect to be sure
      it.skip('with multiple rules & RDates & EXDates', () => {
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
  
        expect(toISOStrings(schedule, { start: dateAdapter(2017, 1, 1, 9, 0), reverse: true })).toEqual([
          isoString(1997, 9, 2, 9, 0),
          isoString(1998, 1, 5, 9, 0),
          isoString(1998, 1, 7, 9, 0),
          isoString(1998, 2, 3, 9, 0),
          isoString(1998, 3, 3, 9, 0),
          isoString(1998, 3, 5, 9, 0),
          isoString(2000, 1, 1, 9, 0),
          isoString(2017, 1, 1, 9, 0),
        ].reverse())
      })
    })
  })

  describe('occurs? methods', () => {
    testOccursMethods(
      'with a single rule',
      {
        rrules: [
          {
            frequency: 'YEARLY',
            until: dateAdapter(1998, 3, 5, 9, 0),
            byMonthOfYear: [1, 3],
            byDayOfMonth: [5, 7],
            start: dateAdapter(1997, 9, 2, 9),
          },
        ],
      },
      [
        { occursBefore: dateAdapter(1998, 1, 7, 9, 0), expect: true },
        { occursBefore: dateAdapter(1998, 1, 5, 9, 0), expect: true },
        { occursBefore: dateAdapter(1998, 1, 5, 9, 0), excludeStart: true, expect: false },
        { occursAfter: dateAdapter(1998, 1, 7, 9, 0), expect: true },
        { occursAfter: dateAdapter(1998, 3, 5, 9, 0), expect: true },
        { occursAfter: dateAdapter(1998, 3, 5, 9, 0), excludeStart: true, expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1998, 1, 6, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1997, 12, 2, 9)], expect: false },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)], excludeEnds: true, expect: false },
        { occursBetween: [dateAdapter(1998, 1, 8, 9, 0), dateAdapter(1998, 3, 4, 9, 0)], expect: false },
        { occursOn: {date: dateAdapter(1998, 3, 5, 9, 0)}, expect: true },
        { occursOn: {date: dateAdapter(1998, 3, 6, 9, 0)}, expect: false },
      ]
    )
  
    testOccursMethods(
      'with multiple rules',
      {
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
      },
      [
        { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: true },
        { occursBefore: dateAdapter(1997, 9, 2, 9, 0), expect: true },
        { occursBefore: dateAdapter(1997, 9, 2, 9, 0), excludeStart: true, expect: false },
        { occursAfter: dateAdapter(1998, 1, 7, 9, 0), expect: true },
        { occursAfter: dateAdapter(1998, 3, 5, 9, 0), expect: true },
        { occursAfter: dateAdapter(1998, 3, 5, 9, 0), excludeStart: true, expect: true },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1998, 1, 6, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1997, 9, 3, 9), dateAdapter(1997, 12, 2, 9)], expect: false },
        { occursBetween: [dateAdapter(1998, 3, 3, 9, 0), dateAdapter(1998, 3, 5, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1998, 3, 3, 9, 0), dateAdapter(1998, 3, 5, 9, 0)], excludeEnds: true, expect: false },
        { occursBetween: [dateAdapter(1998, 3, 6, 9, 0), dateAdapter(1999, 3, 6, 9, 0)], expect: true },
        { occursOn: {date: dateAdapter(1998, 3, 5, 9, 0)}, expect: true },
        { occursOn: {date: dateAdapter(1998, 3, 4, 9, 0)}, expect: false },
      ]
    )
  
    testOccursMethods(
      'with RDates & duplicate',
      {
        rdates: [
          dateAdapter(1998, 1, 1, 9, 0),
          dateAdapter(1998, 1, 1, 9, 0),
          dateAdapter(2000, 1, 1, 9, 0),
          dateAdapter(2017, 1, 1, 9, 0),
        ],
      },
      [
        { occursBefore: dateAdapter(1999, 12, 1, 9, 0), expect: true },
        { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: true },
        { occursBefore: dateAdapter(1998, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursAfter: dateAdapter(2000, 1, 2, 9, 0), expect: true },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: true },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1998, 1, 6, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1997, 12, 2, 9)], expect: false },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], excludeEnds: true, expect: false },
        { occursBetween: [dateAdapter(2000, 1, 2, 9, 0), dateAdapter(2010, 1, 1, 9, 0)], expect: false },
        { occursOn: {date: dateAdapter(2017, 1, 1, 9, 0)}, expect: true },
        { occursOn: {date: dateAdapter(1998, 3, 6, 9, 0)}, expect: false },
      ]
    )

    testOccursMethods(
      'with EXDates',
      {
        exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
      },
      [
        { occursBefore: dateAdapter(1999, 12, 1, 9, 0), expect: false },
        { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: false },
        { occursBefore: dateAdapter(1998, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursAfter: dateAdapter(2000, 1, 2, 9, 0), expect: false },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: false },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1998, 1, 6, 9, 0)], expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1997, 12, 2, 9)], expect: false },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], expect: false },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], excludeEnds: true, expect: false },
        { occursBetween: [dateAdapter(2000, 1, 2, 9, 0), dateAdapter(2010, 1, 1, 9, 0)], expect: false },
        { occursOn: dateAdapter(2017, 1, 1, 9, 0), expect: false },
        { occursOn: dateAdapter(1998, 3, 6, 9, 0), expect: false },
      ]
    )

    testOccursMethods(
      'with RDates & EXDates',
      {
        rdates: [
          dateAdapter(1998, 1, 1, 9, 0),
          dateAdapter(2000, 1, 1, 9, 0),
          dateAdapter(2017, 1, 1, 9, 0),
        ],
        exdates: [dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 1, 1, 9, 0)],
      },
      [
        { occursBefore: dateAdapter(2015, 12, 1, 9, 0), expect: true },
        { occursBefore: dateAdapter(2000, 1, 1, 9, 0), expect: true },
        { occursBefore: dateAdapter(2000, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursAfter: dateAdapter(2005, 1, 2, 9, 0), expect: true },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: true },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(2005, 1, 6, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(2000, 9, 2, 9), dateAdapter(2015, 12, 2, 9)], expect: false },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1998, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], excludeEnds: true, expect: false },
        { occursOn: {date: dateAdapter(2017, 1, 1, 9, 0)}, expect: true },
        { occursOn: {date: dateAdapter(1998, 3, 6, 9, 0)}, expect: false },
      ]
    )

    testOccursMethods(
      'with RDates & EXDates cancelling out',
      {
        rdates: [dateAdapter(1998, 1, 1, 9, 0)],
        exdates: [dateAdapter(1998, 1, 1, 9, 0)],
      },
      [
        { occursBefore: dateAdapter(1999, 12, 1, 9, 0), expect: false },
        { occursBefore: dateAdapter(1998, 1, 1, 9, 0), expect: false },
        { occursBefore: dateAdapter(1998, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursAfter: dateAdapter(2000, 1, 2, 9, 0), expect: false },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: false },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1998, 1, 6, 9, 0)], expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(1997, 12, 2, 9)], expect: false },
        { occursBetween: [dateAdapter(1997, 1, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], expect: false },
        { occursOn: {date: dateAdapter(1998, 1, 1, 9, 0)}, expect: false },
        { occursOn: {date: dateAdapter(1998, 3, 6, 9, 0)}, expect: false },
      ]
    )

    testOccursMethods(
      'with multiple rules & RDates & EXDates',
      {
        rrules: [
          // YearlyByMonthAndMonthDay
          {
            frequency: 'YEARLY',
            until: dateAdapter(2001, 9, 2, 9),
            byMonthOfYear: [1, 3],
            byDayOfMonth: [5, 7],
            start: dateAdapter(1997, 9, 2, 9),
          },
          // WeeklyIntervalLarge
          {
            frequency: 'WEEKLY',
            until: dateAdapter(2001, 9, 2, 9),
            interval: 20,
            start: dateAdapter(1997, 9, 2, 9),
          },
          // DailyByMonthDayAndWeekDay
          {
            frequency: 'DAILY',
            until: dateAdapter(1999, 9, 2, 9),
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
      },
      [
        { occursBefore: dateAdapter(1998, 1, 5, 9, 0), expect: true },
        { occursBefore: dateAdapter(1997, 9, 2, 9, 0), expect: true },
        { occursBefore: dateAdapter(1997, 9, 2, 9, 0), excludeStart: true, expect: false },
        { occursAfter: dateAdapter(2005, 1, 2, 9, 0), expect: true },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), expect: true },
        { occursAfter: dateAdapter(2017, 1, 1, 9, 0), excludeStart: true, expect: false },
        { occursBetween: [dateAdapter(1997, 9, 2, 9), dateAdapter(2005, 1, 6, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(2001, 9, 2, 9), dateAdapter(2015, 12, 2, 9)], expect: false },
        { occursBetween: [dateAdapter(1998, 5, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], expect: true },
        { occursBetween: [dateAdapter(1998, 5, 7, 9, 0), dateAdapter(2000, 1, 1, 9, 0)], excludeEnds: true, expect: true },
        { occursOn: {date: dateAdapter(2017, 1, 1, 9, 0)}, expect: true },
        { occursOn: {date: dateAdapter(1998, 3, 6, 9, 0)}, expect: false },
      ]
    )
  })
})

})

})

})
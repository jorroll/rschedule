/**
 * Credit:
 * The vast majority of these tests were taken from [rrulejs](https://github.com/jakubroztocil/rrule),
 * which itself credits the python library `dateutil.rrule` for first creating the tests.
 */

import { RRule, Utils } from '@rschedule/rschedule'
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'
import { dateAdapter } from './utilities'

const parse = function(str: string) {
  const parts = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  let [_, y, m, d, h, i, s]: any = parts // eslint-disable-line
  m = Number(m[0] === '0' ? m[1] : m) - 1
  d = d[0] === '0' ? d[1] : d
  h = h[0] === '0' ? h[1] : h
  i = i[0] === '0' ? i[1] : i
  s = s[0] === '0' ? s[1] : s
  return new StandardDateAdapter(new Date(y, m, d, h, i, s))
}

function testRecurring(
  testName: string,
  rule: RRule<StandardDateAdapter>,
  expectedDates: StandardDateAdapter[]
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      const expected = expectedDates.map(date => date.toISOString())
      const actual = rule
        .occurrences()
        .toArray()!
        .map(date => date.toISOString())

      expect(actual).toEqual(expected)
    })

    /**
     * Problem with start & count: because occurrence
     * counting begins when start is, count also begins
     * when the start is. The effect of this is that when a rule
     * has a count of 3, say, you'll always take three occurrences,
     * no matter where you start from. Intuitively, you'd probably
     * only want to take the first 3 occurrences from the dtstart
     */

    describe('w/args', () => {
      it('END', () => {
        let newExpectedDates: StandardDateAdapter[]
        let end: StandardDateAdapter | undefined

        if (expectedDates.length > 2) {
          end = expectedDates[1]
          newExpectedDates = expectedDates.slice(0, 2)
        } else if (expectedDates.length > 1) {
          end = expectedDates[0]
          newExpectedDates = [expectedDates[0]]
        } else {
          newExpectedDates = expectedDates.slice()
        }

        const expected = newExpectedDates.map(date => date.toISOString())
        const actual = rule
          .occurrences({ end })
          .toArray()!
          .map(date => date.toISOString())

        expect(actual).toEqual(expected)
      })
    })
  })
}

function testRecurringBetween(
  testName: string,
  rule: RRule<StandardDateAdapter>,
  start: StandardDateAdapter,
  end: StandardDateAdapter,
  inclusive: boolean,
  expectedDates: StandardDateAdapter[]
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrences = rule.occurrences({ start, end }).toArray()!

      if (!inclusive) {
        occurrences = occurrences.filter(date => !(date.isEqual(start) || date.isEqual(end)))
      }

      expect(occurrences.map(d => d.toISOString())).toEqual(expectedDates.map(d => d.toISOString()))
    })
  })
}

function testPreviousOccurrence(
  testName: string,
  rule: RRule<StandardDateAdapter>,
  start: StandardDateAdapter,
  inclusive: boolean,
  expectedDate: StandardDateAdapter
) {
  // not implemented
}

function testNextOccurrence(
  testName: string,
  rule: RRule<StandardDateAdapter>,
  start: StandardDateAdapter,
  inclusive: boolean,
  expectedDate: StandardDateAdapter
) {
  describe(testName, () => {
    it('matches expected dates', () => {
      let occurrence: StandardDateAdapter

      for (const day of rule.occurrences({ start })) {
        if (!inclusive && day.isEqual(start)) {
          continue
        }
        occurrence = day
        break
      }

      expect(occurrence!.toISOString()).toEqual(expectedDate.toISOString())
    })
  })
}

testPreviousOccurrence(
  'testBefore',
  new RRule({
    frequency: 'DAILY',
    start: parse('19970902T090000'),
  }),
  parse('19970905T090000'),
  false,
  dateAdapter(1997, 9, 4, 9, 0)
)

testPreviousOccurrence(
  'testBeforeInc',
  new RRule({
    frequency: 'DAILY',
    start: parse('19970902T090000'),
  }),
  parse('19970905T090000'),
  true,
  dateAdapter(1997, 9, 5, 9, 0)
)

testNextOccurrence(
  'testAfter',
  new RRule({
    frequency: 'DAILY',
    start: parse('19970902T090000'),
  }),
  parse('19970904T090000'),
  false,
  dateAdapter(1997, 9, 5, 9, 0)
)

testNextOccurrence(
  'testAfterInc',
  new RRule({
    frequency: 'DAILY',
    start: parse('19970902T090000'),
  }),
  parse('19970904T090000'),
  true,
  dateAdapter(1997, 9, 4, 9, 0)
)

testRecurringBetween(
  'testBetween',
  new RRule({
    frequency: 'DAILY',
    start: parse('19970902T090000'),
  }),
  parse('19970902T090000'),
  parse('19970906T090000'),
  false,
  [dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 5, 9, 0)]
)

testRecurringBetween(
  'testBetweenInc',
  new RRule({
    frequency: 'DAILY',
    start: parse('19970902T090000'),
  }),
  parse('19970902T090000'),
  parse('19970906T090000'),
  true,
  [
    dateAdapter(1997, 9, 2, 9, 0),
    dateAdapter(1997, 9, 3, 9, 0),
    dateAdapter(1997, 9, 4, 9, 0),
    dateAdapter(1997, 9, 5, 9, 0),
    dateAdapter(1997, 9, 6, 9, 0),
  ]
)

describe('YEARLY', () => {
  testRecurring(
    'testYearly',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1998, 9, 2, 9, 0), dateAdapter(1999, 9, 2, 9, 0)]
  )

  testRecurring(
    'testYearlyInterval',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      interval: 2,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1999, 9, 2, 9, 0), dateAdapter(2001, 9, 2, 9, 0)]
  )

  testRecurring(
    'testYearlyIntervalLarge',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      interval: 100,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(2097, 9, 2, 9, 0), dateAdapter(2197, 9, 2, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonth',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 2, 9, 0), dateAdapter(1998, 3, 2, 9, 0), dateAdapter(1999, 1, 2, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonthDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byDayOfMonth: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 10, 1, 9, 0), dateAdapter(1997, 10, 3, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonthAndMonthDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [5, 7],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)]
  )

  testRecurring(
    'testYearlyByWeekDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 9, 9, 0)]
  )

  testRecurring(
    'testYearlyByNWeekDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byDayOfWeek: [['TU', 1], ['TH', -1]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 12, 25, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 12, 31, 9, 0)]
  )

  testRecurring(
    'testYearlyByNWeekDayLarge',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byDayOfWeek: [['TU', 3], ['TH', -3]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 12, 11, 9, 0), dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 12, 17, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonthAndWeekDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonthAndNWeekDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: [['TU', 1], ['TH', -1]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 29, 9, 0), dateAdapter(1998, 3, 3, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonthAndNWeekDayLarge',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: [['TU', 3], ['TH', -3]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 15, 9, 0), dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 3, 12, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonthDayAndWeekDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 2, 3, 9, 0), dateAdapter(1998, 3, 3, 9, 0)]
  )

  testRecurring(
    'testYearlyByMonthAndMonthDayAndWeekDay',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 3, 3, 9, 0), dateAdapter(2001, 3, 1, 9, 0)]
  )

  testRecurring(
    'testYearlyByHour',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byHourOfDay: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0), dateAdapter(1998, 9, 2, 6, 0), dateAdapter(1998, 9, 2, 18, 0)]
  )

  testRecurring(
    'testYearlyByMinute',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6), dateAdapter(1997, 9, 2, 9, 18), dateAdapter(1998, 9, 2, 9, 6)]
  )

  testRecurring(
    'testYearlyBySecond',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1998, 9, 2, 9, 0, 6)]
  )

  testRecurring(
    'testYearlyByHourAndMinute',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 6), dateAdapter(1997, 9, 2, 18, 18), dateAdapter(1998, 9, 2, 6, 6)]
  )

  testRecurring(
    'testYearlyByHourAndSecond',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byHourOfDay: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0, 6), dateAdapter(1997, 9, 2, 18, 0, 18), dateAdapter(1998, 9, 2, 6, 0, 6)]
  )

  testRecurring(
    'testYearlyByMinuteAndSecond',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 6), dateAdapter(1997, 9, 2, 9, 6, 18), dateAdapter(1997, 9, 2, 9, 18, 6)]
  )

  testRecurring(
    'testYearlyByHourAndMinuteAndSecond',
    new RRule({
      frequency: 'YEARLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 6, 6),
      dateAdapter(1997, 9, 2, 18, 6, 18),
      dateAdapter(1997, 9, 2, 18, 18, 6),
    ]
  )

  testRecurringBetween(
    'testYearlyBetweenInc',
    new RRule({
      frequency: 'YEARLY',
      start: parse('20150101T000000'),
    }),
    parse('20160101T000000'),
    parse('20160101T000000'),
    true,
    [dateAdapter(2016, 1, 1)]
  )

  testRecurringBetween(
    'testYearlyBetweenIncLargeSpan',
    new RRule({
      frequency: 'YEARLY',
      start: parse('19200101T000000'),
    }),
    parse('20160101T000000'),
    parse('20160101T000000'),
    true,
    [dateAdapter(2016, 1, 1)]
  )

  testRecurringBetween(
    'testYearlyBetweenIncLargeSpan2',
    new RRule({
      frequency: 'YEARLY',
      start: parse('19200101T000000'),
    }),
    parse('20160101T000000'),
    parse('20170101T000000'),
    true,
    [dateAdapter(2016, 1, 1), dateAdapter(2017, 1, 1)]
  )
})

describe('MONTHLY', () => {
  testRecurring(
    'testMonthly',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 10, 2, 9, 0), dateAdapter(1997, 11, 2, 9, 0)]
  )

  testRecurring(
    'testMonthlyInterval',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      interval: 2,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 11, 2, 9, 0), dateAdapter(1998, 1, 2, 9, 0)]
  )

  testRecurring(
    'testMonthlyIntervalLarge',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      interval: 18,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1999, 3, 2, 9, 0), dateAdapter(2000, 9, 2, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonth',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 2, 9, 0), dateAdapter(1998, 3, 2, 9, 0), dateAdapter(1999, 1, 2, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonthDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byDayOfMonth: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 10, 1, 9, 0), dateAdapter(1997, 10, 3, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonthAndMonthDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [5, 7],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)]
  )

  testRecurring(
    'testMonthlyByWeekDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 9, 9, 0)]
  )

  testRecurring(
    'testMonthlyByNWeekDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byDayOfWeek: [['TU', 1], ['TH', -1]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 25, 9, 0), dateAdapter(1997, 10, 7, 9, 0)]
  )

  testRecurring(
    'testMonthlyByNWeekDayLarge',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byDayOfWeek: [['TU', 3], ['TH', -3]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 11, 9, 0), dateAdapter(1997, 9, 16, 9, 0), dateAdapter(1997, 10, 16, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonthAndWeekDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonthAndNWeekDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: [['TU', 1], ['TH', -1]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 29, 9, 0), dateAdapter(1998, 3, 3, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonthAndNWeekDayLarge',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: [['TU', 3], ['TH', -3]],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 15, 9, 0), dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 3, 12, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonthDayAndWeekDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 2, 3, 9, 0), dateAdapter(1998, 3, 3, 9, 0)]
  )

  testRecurring(
    'testMonthlyByMonthAndMonthDayAndWeekDay',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 3, 3, 9, 0), dateAdapter(2001, 3, 1, 9, 0)]
  )

  testRecurring(
    'testMonthlyByHour',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byHourOfDay: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0), dateAdapter(1997, 10, 2, 6, 0), dateAdapter(1997, 10, 2, 18, 0)]
  )

  testRecurring(
    'testMonthlyByMinute',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6), dateAdapter(1997, 9, 2, 9, 18), dateAdapter(1997, 10, 2, 9, 6)]
  )

  testRecurring(
    'testMonthlyBySecond',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1997, 10, 2, 9, 0, 6)]
  )

  testRecurring(
    'testMonthlyByHourAndMinute',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 6), dateAdapter(1997, 9, 2, 18, 18), dateAdapter(1997, 10, 2, 6, 6)]
  )

  testRecurring(
    'testMonthlyByHourAndSecond',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byHourOfDay: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 0, 6),
      dateAdapter(1997, 9, 2, 18, 0, 18),
      dateAdapter(1997, 10, 2, 6, 0, 6),
    ]
  )

  testRecurring(
    'testMonthlyByMinuteAndSecond',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 6), dateAdapter(1997, 9, 2, 9, 6, 18), dateAdapter(1997, 9, 2, 9, 18, 6)]
  )

  testRecurring(
    'testMonthlyByHourAndMinuteAndSecond',
    new RRule({
      frequency: 'MONTHLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 6, 6),
      dateAdapter(1997, 9, 2, 18, 6, 18),
      dateAdapter(1997, 9, 2, 18, 18, 6),
    ]
  )

  testRecurring(
    'testMonthlyNegByMonthDayJanFebForNonLeapYear',
    new RRule({
      frequency: 'MONTHLY',
      count: 4,
      byDayOfMonth: [-1],
      start: parse('20131201T0900000'),
    }),
    [
      dateAdapter(2013, 12, 31, 9, 0),
      dateAdapter(2014, 1, 31, 9, 0),
      dateAdapter(2014, 2, 28, 9, 0),
      dateAdapter(2014, 3, 31, 9, 0),
    ]
  )

  testRecurring(
    'testMonthlyNegByMonthDayJanFebForLeapYear',
    new RRule({
      frequency: 'MONTHLY',
      count: 4,
      byDayOfMonth: [-1],
      start: parse('20151201T0900000'),
    }),
    [
      dateAdapter(2015, 12, 31, 9, 0),
      dateAdapter(2016, 1, 31, 9, 0),
      dateAdapter(2016, 2, 29, 9, 0),
      dateAdapter(2016, 3, 31, 9, 0),
    ]
  )
})

describe('WEEKLY', () => {
  testRecurring(
    'testWeekly',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 9, 9, 0), dateAdapter(1997, 9, 16, 9, 0)]
  )

  testRecurring(
    'testWeeklyInterval',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      interval: 2,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 16, 9, 0), dateAdapter(1997, 9, 30, 9, 0)]
  )

  testRecurring(
    'testWeeklyIntervalLarge',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      interval: 20,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1998, 1, 20, 9, 0), dateAdapter(1998, 6, 9, 9, 0)]
  )

  testRecurring(
    'testWeeklyByMonth',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 13, 9, 0), dateAdapter(1998, 1, 20, 9, 0)]
  )

  testRecurring(
    'testWeeklyByWeekDay',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 9, 9, 0)]
  )

  testRecurring(
    'testWeeklyByMonthAndWeekDay',
    // This test is interesting, because it crosses the year
    // boundary in a weekly period to find day '1' as a
    // valid recurrence.
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)]
  )

  testRecurring(
    'testWeeklyByHour',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byHourOfDay: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0), dateAdapter(1997, 9, 9, 6, 0), dateAdapter(1997, 9, 9, 18, 0)]
  )

  testRecurring(
    'testWeeklyByMinute',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6), dateAdapter(1997, 9, 2, 9, 18), dateAdapter(1997, 9, 9, 9, 6)]
  )

  testRecurring(
    'testWeeklyBySecond',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1997, 9, 9, 9, 0, 6)]
  )

  testRecurring(
    'testWeeklyByHourAndMinute',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 6), dateAdapter(1997, 9, 2, 18, 18), dateAdapter(1997, 9, 9, 6, 6)]
  )

  testRecurring(
    'testWeeklyByHourAndSecond',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byHourOfDay: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0, 6), dateAdapter(1997, 9, 2, 18, 0, 18), dateAdapter(1997, 9, 9, 6, 0, 6)]
  )

  testRecurring(
    'testWeeklyByMinuteAndSecond',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 6), dateAdapter(1997, 9, 2, 9, 6, 18), dateAdapter(1997, 9, 2, 9, 18, 6)]
  )

  testRecurring(
    'testWeeklyByHourAndMinuteAndSecond',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 6, 6),
      dateAdapter(1997, 9, 2, 18, 6, 18),
      dateAdapter(1997, 9, 2, 18, 18, 6),
    ]
  )
})

describe('DAILY', () => {
  testRecurring(
    'testDaily',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)]
  )

  testRecurring(
    'testDailyInterval',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      interval: 2,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 6, 9, 0)]
  )

  testRecurring(
    'testDailyIntervalLarge',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      interval: 92,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 12, 3, 9, 0), dateAdapter(1998, 3, 5, 9, 0)]
  )

  testRecurring(
    'testDailyByMonth',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 2, 9, 0), dateAdapter(1998, 1, 3, 9, 0)]
  )

  testRecurring(
    'testDailyByMonthDay',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byDayOfMonth: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 10, 1, 9, 0), dateAdapter(1997, 10, 3, 9, 0)]
  )

  testRecurring(
    'testDailyByMonthAndMonthDay',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [5, 7],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 5, 9, 0), dateAdapter(1998, 1, 7, 9, 0), dateAdapter(1998, 3, 5, 9, 0)]
  )

  testRecurring(
    'testDailyByWeekDay',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 4, 9, 0), dateAdapter(1997, 9, 9, 9, 0)]
  )

  testRecurring(
    'testDailyByMonthAndWeekDay',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 1, 6, 9, 0), dateAdapter(1998, 1, 8, 9, 0)]
  )

  testRecurring(
    'testDailyByMonthDayAndWeekDay',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 2, 3, 9, 0), dateAdapter(1998, 3, 3, 9, 0)]
  )

  testRecurring(
    'testDailyByMonthAndMonthDayAndWeekDay',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 9, 0), dateAdapter(1998, 3, 3, 9, 0), dateAdapter(2001, 3, 1, 9, 0)]
  )

  testRecurring(
    'testDailyByHour',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byHourOfDay: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0), dateAdapter(1997, 9, 3, 6, 0), dateAdapter(1997, 9, 3, 18, 0)]
  )

  testRecurring(
    'testDailyByMinute',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6), dateAdapter(1997, 9, 2, 9, 18), dateAdapter(1997, 9, 3, 9, 6)]
  )

  testRecurring(
    'testDailyBySecond',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1997, 9, 3, 9, 0, 6)]
  )

  testRecurring(
    'testDailyByHourAndMinute',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 6), dateAdapter(1997, 9, 2, 18, 18), dateAdapter(1997, 9, 3, 6, 6)]
  )

  testRecurring(
    'testDailyByHourAndSecond',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byHourOfDay: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0, 6), dateAdapter(1997, 9, 2, 18, 0, 18), dateAdapter(1997, 9, 3, 6, 0, 6)]
  )

  testRecurring(
    'testDailyByMinuteAndSecond',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 6), dateAdapter(1997, 9, 2, 9, 6, 18), dateAdapter(1997, 9, 2, 9, 18, 6)]
  )

  testRecurring(
    'testDailyByHourAndMinuteAndSecond',
    new RRule({
      frequency: 'DAILY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 6, 6),
      dateAdapter(1997, 9, 2, 18, 6, 18),
      dateAdapter(1997, 9, 2, 18, 18, 6),
    ]
  )
})

describe('HOURLY', () => {
  testRecurring(
    'testHourly',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 10, 0), dateAdapter(1997, 9, 2, 11, 0)]
  )

  testRecurring(
    'testHourlyInterval',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      interval: 2,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 11, 0), dateAdapter(1997, 9, 2, 13, 0)]
  )

  testRecurring(
    'testHourlyIntervalLarge',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      interval: 769,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 10, 4, 10, 0), dateAdapter(1997, 11, 5, 11, 0)]
  )

  testRecurring(
    'testHourlyByMonth',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)]
  )

  testRecurring(
    'testHourlyByMonthDay',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byDayOfMonth: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 3, 0, 0), dateAdapter(1997, 9, 3, 1, 0), dateAdapter(1997, 9, 3, 2, 0)]
  )

  testRecurring(
    'testHourlyByMonthAndMonthDay',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [5, 7],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 5, 0, 0), dateAdapter(1998, 1, 5, 1, 0), dateAdapter(1998, 1, 5, 2, 0)]
  )

  testRecurring(
    'testHourlyByWeekDay',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 10, 0), dateAdapter(1997, 9, 2, 11, 0)]
  )

  testRecurring(
    'testHourlyByMonthAndWeekDay',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)]
  )

  testRecurring(
    'testHourlyByMonthDayAndWeekDay',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)]
  )

  testRecurring(
    'testHourlyByMonthAndMonthDayAndWeekDay',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 1, 0), dateAdapter(1998, 1, 1, 2, 0)]
  )

  testRecurring(
    'testHourlyByHour',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byHourOfDay: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0), dateAdapter(1997, 9, 3, 6, 0), dateAdapter(1997, 9, 3, 18, 0)]
  )

  testRecurring(
    'testHourlyByMinute',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6), dateAdapter(1997, 9, 2, 9, 18), dateAdapter(1997, 9, 2, 10, 6)]
  )

  testRecurring(
    'testHourlyBySecond',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1997, 9, 2, 10, 0, 6)]
  )

  testRecurring(
    'testHourlyByHourAndMinute',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 6), dateAdapter(1997, 9, 2, 18, 18), dateAdapter(1997, 9, 3, 6, 6)]
  )

  testRecurring(
    'testHourlyByHourAndSecond',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byHourOfDay: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0, 6), dateAdapter(1997, 9, 2, 18, 0, 18), dateAdapter(1997, 9, 3, 6, 0, 6)]
  )

  testRecurring(
    'testHourlyByMinuteAndSecond',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 6), dateAdapter(1997, 9, 2, 9, 6, 18), dateAdapter(1997, 9, 2, 9, 18, 6)]
  )

  testRecurring(
    'testHourlyByHourAndMinuteAndSecond',
    new RRule({
      frequency: 'HOURLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 6, 6),
      dateAdapter(1997, 9, 2, 18, 6, 18),
      dateAdapter(1997, 9, 2, 18, 18, 6),
    ]
  )
})

describe('MINUTELY', () => {
  testRecurring(
    'testMinutely',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 9, 1), dateAdapter(1997, 9, 2, 9, 2)]
  )

  testRecurring(
    'testMinutelyInterval',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      interval: 2,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 9, 2), dateAdapter(1997, 9, 2, 9, 4)]
  )

  testRecurring(
    'testMinutelyIntervalLarge',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      interval: 1501,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 10, 1), dateAdapter(1997, 9, 4, 11, 2)]
  )

  testRecurring(
    'testMinutelyByMonth',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)]
  )

  testRecurring(
    'testMinutelyByMonthDay',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byDayOfMonth: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 3, 0, 0), dateAdapter(1997, 9, 3, 0, 1), dateAdapter(1997, 9, 3, 0, 2)]
  )

  testRecurring(
    'testMinutelyByMonthAndMonthDay',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [5, 7],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 5, 0, 0), dateAdapter(1998, 1, 5, 0, 1), dateAdapter(1998, 1, 5, 0, 2)]
  )

  testRecurring(
    'testMinutelyByWeekDay',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 2, 9, 1), dateAdapter(1997, 9, 2, 9, 2)]
  )

  testRecurring(
    'testMinutelyByMonthAndWeekDay',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)]
  )

  testRecurring(
    'testMinutelyByMonthDayAndWeekDay',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)]
  )

  testRecurring(
    'testMinutelyByMonthAndMonthDayAndWeekDay',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0), dateAdapter(1998, 1, 1, 0, 1), dateAdapter(1998, 1, 1, 0, 2)]
  )

  testRecurring(
    'testMinutelyByHour',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byHourOfDay: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0), dateAdapter(1997, 9, 2, 18, 1), dateAdapter(1997, 9, 2, 18, 2)]
  )

  testRecurring(
    'testMinutelyByMinute',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6), dateAdapter(1997, 9, 2, 9, 18), dateAdapter(1997, 9, 2, 10, 6)]
  )

  testRecurring(
    'testMinutelyBySecond',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1997, 9, 2, 9, 1, 6)]
  )

  testRecurring(
    'testMinutelyByHourAndMinute',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 6), dateAdapter(1997, 9, 2, 18, 18), dateAdapter(1997, 9, 3, 6, 6)]
  )

  testRecurring(
    'testMinutelyByHourAndSecond',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byHourOfDay: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 0, 6),
      dateAdapter(1997, 9, 2, 18, 0, 18),
      dateAdapter(1997, 9, 2, 18, 1, 6),
    ]
  )

  testRecurring(
    'testMinutelyByMinuteAndSecond',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 6), dateAdapter(1997, 9, 2, 9, 6, 18), dateAdapter(1997, 9, 2, 9, 18, 6)]
  )

  testRecurring(
    'testMinutelyByHourAndMinuteAndSecond',
    new RRule({
      frequency: 'MINUTELY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T180606'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 6, 6),
      dateAdapter(1997, 9, 2, 18, 6, 18),
      dateAdapter(1997, 9, 2, 18, 18, 6),
    ]
  )
})

describe('SECONDLY', () => {
  testRecurring(
    'testSecondly',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 0), dateAdapter(1997, 9, 2, 9, 0, 1), dateAdapter(1997, 9, 2, 9, 0, 2)]
  )

  testRecurring(
    'testSecondlyInterval',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      interval: 2,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 0), dateAdapter(1997, 9, 2, 9, 0, 2), dateAdapter(1997, 9, 2, 9, 0, 4)]
  )

  testRecurring(
    'testSecondlyIntervalLarge',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      interval: 90061,
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 0), dateAdapter(1997, 9, 3, 10, 1, 1), dateAdapter(1997, 9, 4, 11, 2, 2)]
  )

  testRecurring(
    'testSecondlyByMonth',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byMonthOfYear: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0, 0), dateAdapter(1998, 1, 1, 0, 0, 1), dateAdapter(1998, 1, 1, 0, 0, 2)]
  )

  testRecurring(
    'testSecondlyByMonthDay',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byDayOfMonth: [1, 3],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 3, 0, 0, 0), dateAdapter(1997, 9, 3, 0, 0, 1), dateAdapter(1997, 9, 3, 0, 0, 2)]
  )

  testRecurring(
    'testSecondlyByMonthAndMonthDay',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [5, 7],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 5, 0, 0, 0), dateAdapter(1998, 1, 5, 0, 0, 1), dateAdapter(1998, 1, 5, 0, 0, 2)]
  )

  testRecurring(
    'testSecondlyByWeekDay',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 0), dateAdapter(1997, 9, 2, 9, 0, 1), dateAdapter(1997, 9, 2, 9, 0, 2)]
  )

  testRecurring(
    'testSecondlyByMonthAndWeekDay',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0, 0), dateAdapter(1998, 1, 1, 0, 0, 1), dateAdapter(1998, 1, 1, 0, 0, 2)]
  )

  testRecurring(
    'testSecondlyByMonthDayAndWeekDay',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0, 0), dateAdapter(1998, 1, 1, 0, 0, 1), dateAdapter(1998, 1, 1, 0, 0, 2)]
  )

  testRecurring(
    'testSecondlyByMonthAndMonthDayAndWeekDay',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byMonthOfYear: [1, 3],
      byDayOfMonth: [1, 3],
      byDayOfWeek: ['TU', 'TH'],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1998, 1, 1, 0, 0, 0), dateAdapter(1998, 1, 1, 0, 0, 1), dateAdapter(1998, 1, 1, 0, 0, 2)]
  )

  testRecurring(
    'testSecondlyByHour',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byHourOfDay: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 0, 0), dateAdapter(1997, 9, 2, 18, 0, 1), dateAdapter(1997, 9, 2, 18, 0, 2)]
  )

  testRecurring(
    'testSecondlyByMinute',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 0), dateAdapter(1997, 9, 2, 9, 6, 1), dateAdapter(1997, 9, 2, 9, 6, 2)]
  )

  testRecurring(
    'testSecondlyBySecond',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1997, 9, 2, 9, 1, 6)]
  )

  testRecurring(
    'testSecondlyByHourAndMinute',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 18, 6, 0), dateAdapter(1997, 9, 2, 18, 6, 1), dateAdapter(1997, 9, 2, 18, 6, 2)]
  )

  testRecurring(
    'testSecondlyByHourAndSecond',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byHourOfDay: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 0, 6),
      dateAdapter(1997, 9, 2, 18, 0, 18),
      dateAdapter(1997, 9, 2, 18, 1, 6),
    ]
  )

  testRecurring(
    'testSecondlyByMinuteAndSecond',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 6, 6), dateAdapter(1997, 9, 2, 9, 6, 18), dateAdapter(1997, 9, 2, 9, 18, 6)]
  )

  testRecurring(
    'testSecondlyByHourAndMinuteAndSecond',
    new RRule({
      frequency: 'SECONDLY',
      count: 3,
      byHourOfDay: [6, 18],
      byMinuteOfHour: [6, 18],
      bySecondOfMinute: [6, 18],
      start: parse('19970902T090000'),
    }),
    [
      dateAdapter(1997, 9, 2, 18, 6, 6),
      dateAdapter(1997, 9, 2, 18, 6, 18),
      dateAdapter(1997, 9, 2, 18, 18, 6),
    ]
  )
})

describe('UNTIL', () => {
  testRecurring(
    'testUntilNotMatching',
    new RRule({
      frequency: 'DAILY',
      // count: 3,
      start: parse('19970902T090000'),
      until: parse('19970905T080000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)]
  )

  testRecurring(
    'testUntilMatching',
    new RRule({
      frequency: 'DAILY',
      // count: 3,
      start: parse('19970902T090000'),
      until: parse('19970904T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)]
  )

  testRecurring(
    'testUntilSingle',
    new RRule({
      frequency: 'DAILY',
      // count: 3,
      start: parse('19970902T090000'),
      until: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0)]
  )

  testRecurring(
    'testUntilEmpty',
    new RRule({
      frequency: 'DAILY',
      // count: 3,
      start: parse('19970902T090000'),
      until: parse('19970901T090000'),
    }),
    []
  )

  testRecurring(
    'testUntilWithDate',
    new RRule({
      frequency: 'DAILY',
      // count: 3,
      start: parse('19970902T090000'),
      until: dateAdapter(1997, 9, 5),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)]
  )
})

describe('WKST', () => {
  testRecurring(
    'testWkStIntervalMO',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      interval: 2,
      byDayOfWeek: ['TU', 'SU'],
      weekStart: 'MO',
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 7, 9, 0), dateAdapter(1997, 9, 16, 9, 0)]
  )

  testRecurring(
    'testWkStIntervalSU',
    new RRule({
      frequency: 'WEEKLY',
      count: 3,
      interval: 2,
      byDayOfWeek: ['TU', 'SU'],
      weekStart: 'SU',
      start: parse('19970902T090000'),
    }),
    [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 14, 9, 0), dateAdapter(1997, 9, 16, 9, 0)]
  )
})

testRecurring(
  'testDTStartIsDate',
  new RRule({
    frequency: 'DAILY',
    count: 3,
    start: dateAdapter(1997, 9, 2),
  }),
  [dateAdapter(1997, 9, 2, 0, 0), dateAdapter(1997, 9, 3, 0, 0), dateAdapter(1997, 9, 4, 0, 0)]
)

testRecurring(
  'testDTStartWithMicroseconds',
  new RRule({
    frequency: 'DAILY',
    count: 3,
    start: parse('19970902T090000.5'),
  }),
  [dateAdapter(1997, 9, 2, 9, 0), dateAdapter(1997, 9, 3, 9, 0), dateAdapter(1997, 9, 4, 9, 0)]
)

describe('testMaxYear', () => {
  it('throws error', () => {
    const rule = new RRule({
      frequency: 'YEARLY',
      count: 3,
      byMonthOfYear: [2],
      byDayOfMonth: [31],
      start: parse('99970902T090000'),
    })

    expect(() => {
      rule.occurrences().toArray()
    }).toThrowError()
  })
})

testRecurring(
  'testSubsecondStartYearly',
  new RRule({
    frequency: 'YEARLY',
    count: 1,
    start: new StandardDateAdapter(new Date(1420063200001)),
  }),
  [new StandardDateAdapter(new Date(1420063200001))]
)

// describe('arguments', () => {
//   describe('START', () => {
//     testRecurring(
//       'testSecondlyBySecond',
//       new RRule({
//         frequency: 'SECONDLY',
//         count: 3,
//         bySecondOfMinute: [6, 18],
//         start: parse('19970902T090000'),
//       }),
//       [dateAdapter(1997, 9, 2, 9, 0, 6), dateAdapter(1997, 9, 2, 9, 0, 18), dateAdapter(1997, 9, 2, 9, 1, 6)]
//     )
//   })
// })

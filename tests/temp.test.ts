/**
 * Credit:
 * The vast majority of these tests were taken from [rrulejs](https://github.com/jakubroztocil/rrule),
 * which itself credits the python library `dateutil.rrule` for first creating the tests.
 */

import { RRule, Utils, DateAdapterConstructor, IDateAdapterConstructor, IDateAdapter } from '@rschedule/rschedule'
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'
import { dateAdapter, DatetimeFn, environment, context, standardDatetimeFn, momentDatetimeFn, momentTZDatetimeFn, TIMEZONES, luxonDatetimeFn } from './utilities'
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-date-adapter';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { DateTime } from 'luxon';


function testRecurring(
  testName: string,
  rule: RRule<DateAdapterConstructor>,
  expectedDates: IDateAdapter<any>[]
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
  })
}

testRecurring(
  'testYearly',
  new RRule({
    frequency: 'YEARLY',
    count: 3,
    start: new StandardDateAdapter(standardDatetimeFn(1997,9,2,9,0,0,0), {timezone: 'UTC'}),
  }, {dateAdapter: StandardDateAdapter}),
  [
    standardDatetimeFn(1997,9,2,9,0,0,0), 
    standardDatetimeFn(1998,9,2,9,0,0,0), 
    standardDatetimeFn(1999,9,2,9,0,0,0),
  ]
)

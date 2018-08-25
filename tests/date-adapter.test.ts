import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { MomentDateAdapter, MomentTZDateAdapter } from '@rschedule/moment-date-adapter';
import { DateAdapter as IDateAdapter, IDateAdapterConstructor, RRule, Schedule, Calendar, Utils } from '@rschedule/rschedule';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';

import { context, environment, DatetimeFn, standardDatetimeFn, momentDatetimeFn, momentTZDatetimeFn, luxonDatetimeFn } from './utilities';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { DateTime } from 'luxon';

/**
 * ### DateAdapter tests
 * 
 * Run the generic `DateAdapter` test suite for each date adapter class.
 */

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

  // function to create new dateAdapter instances
  const dateAdapter: DatetimeFn<IDateAdapter<any>> = 
    (...args: (number|string|undefined)[]) => {
      if (args.length === 8) {
        const timezone = args[7]
        // @ts-ignore doesn't like use of spread operator
        return new DateAdapter(datetime(...args), {timezone});
      }
      else {
        // @ts-ignore doesn't like use of spread operator
        return new DateAdapter(datetime(...args));
      }
    }

  // function to get the given time array as an ISO string
  const isoString: DatetimeFn<string> = (...args: (number|string|undefined)[]) => 
    // @ts-ignore doesn't like use of spread operator
    dateAdapter(...args).toISOString();

  // Ordinarily, I'd just say that an DateAdapter in local time should always have 
  // `timezone === undefined`. The `luxon` DateTime object may always have a timezone
  // though, if it can figure out what the local timezone is. In this case, setting 
  // the timezone to the local time using `.set('timezone', undefined)` will not produce a 
  // DateAdapter with `.get('timezone') === undefined` and we need to know what the local
  // timezone equals in order to compare against.
  const localTimezone = dateAdapter().get('timezone')

  describe(`${DateAdapter.name}Class`, () => {
    it('is instantiable', () => {
      expect(new DateAdapter()).toBeInstanceOf(DateAdapter)
  
      const date = datetime(1970, 1, 1)
  
      expect(new DateAdapter(date).date === date).toBeFalsy()
    })
  
    it('#isInstance()', () => {
      expect(DateAdapter.isInstance(1)).toBeFalsy()
      expect(DateAdapter.isInstance('1')).toBeFalsy()
      expect(DateAdapter.isInstance({})).toBeFalsy()
      expect(DateAdapter.isInstance(DateAdapter)).toBeFalsy()
      expect(DateAdapter.isInstance(new Date())).toBeFalsy()
      expect(DateAdapter.isInstance(new DateAdapter())).toBeTruthy()
    })

    it('#hasTimezoneSupport', () => {
      expect(typeof DateAdapter.hasTimezoneSupport).toBe('boolean')
    })
  })

  describe('local', () => {
    let adapter: IDateAdapter<any>

    beforeEach(() => {
      adapter = dateAdapter(1970, 1, 1, 1, 1, 1)
    })

    it('#isSameClass()', () => {
      expect(adapter.isSameClass(new DateAdapter())).toBeTruthy()
      expect(adapter.isSameClass(new Date())).toBeFalsy()
      expect(adapter.isSameClass(1)).toBeFalsy()
      expect(adapter.isSameClass({})).toBeFalsy()
    })

    it('#isEqual()', () => {
      expect(adapter.isEqual(adapter)).toBeTruthy()
      expect(adapter.isEqual(new DateAdapter(adapter.date))).toBeTruthy()
      expect(adapter.isEqual(new DateAdapter())).toBeFalsy()
      expect(adapter.isEqual(1 as any)).toBeFalsy()
      expect(adapter.isEqual(new Date() as any)).toBeFalsy()
    })

    it('#isBefore()', () => {
      expect(adapter.isBefore(adapter)).toBeFalsy()
      expect(adapter.isBefore(dateAdapter(1969, 1, 1))).toBeFalsy()
      expect(adapter.isBefore(dateAdapter(1971, 1, 1))).toBeTruthy()
      expect(adapter.isBefore(new DateAdapter())).toBeTruthy()
    })

    it('#isBeforeOrEqual()', () => {
      expect(adapter.isBeforeOrEqual(adapter)).toBeTruthy()
      expect(adapter.isBeforeOrEqual(dateAdapter(1969, 1, 1))).toBeFalsy()
      expect(adapter.isBeforeOrEqual(dateAdapter(1971, 1, 1))).toBeTruthy()
      expect(adapter.isBeforeOrEqual(new DateAdapter())).toBeTruthy()
    })

    it('#isAfter()', () => {
      expect(adapter.isAfter(adapter)).toBeFalsy()
      expect(adapter.isAfter(dateAdapter(1969, 1, 1))).toBeTruthy()
      expect(adapter.isAfter(dateAdapter(1971, 1, 1))).toBeFalsy()
      expect(adapter.isAfter(new DateAdapter())).toBeFalsy()
    })

    it('#isAfterOrEqual()', () => {
      expect(adapter.isAfterOrEqual(adapter)).toBeTruthy()
      expect(adapter.isAfterOrEqual(dateAdapter(1969, 1, 1))).toBeTruthy()
      expect(adapter.isAfterOrEqual(dateAdapter(1971, 1, 1))).toBeFalsy()
      expect(adapter.isAfterOrEqual(new DateAdapter())).toBeFalsy()
    })

    it('#toISOString()', () => {
      expect(adapter.toISOString()).toMatch(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/
      )
    })

    it('#toICal()', () => {
      expect(adapter.toICal({format: 'local'})).toMatch(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
      expect(adapter.toICal({format: 'UTC'})).toMatch(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/)
    })

    it('#clone()', () => {
      expect(adapter.clone()).toBeInstanceOf(DateAdapter)
      expect(adapter.clone() === adapter).toBeFalsy()
      expect(adapter.clone() == adapter).toBeFalsy()
      expect(adapter.clone().date).toEqual(adapter.date)
      expect(adapter.clone().date == adapter.date).toBeFalsy()
      expect(adapter.clone().utcOffset).toEqual(adapter.utcOffset)
      expect(adapter.clone().get('timezone')).toEqual(adapter.get('timezone'))
      expect(adapter.clone().toISOString() === adapter.toISOString()).toBeTruthy()
      const date = datetime(1984, 5, 5, 2, 1, 4)
      expect(
        new DateAdapter(date).clone().isEqual(new DateAdapter(date))
      ).toBeTruthy()
    })

    // This test is being thrown off by the implementation of the `datetime` function
    // which is receiving the input of 'apple', ignoring it,
    // and just returning a generic datetime
    it.skip('#assertIsValid()', () => {
      expect(() => new DateAdapter(datetime('apple' as any))).toThrowError()

      expect(() => {
        adapter.date = datetime('apple' as any)
        adapter.assertIsValid()
      }).toThrowError()
    })

    it('#rule', () => {
      const rule = new RRule({
        start: adapter,
        frequency: 'DAILY'
      })

      adapter.rule = rule
      
      expect(adapter.rule).toBeInstanceOf(RRule)
      expect(adapter.rule).toBe(rule)
    })

    it('#schedule', () => {
      const schedule = new Schedule()

      adapter.schedule = schedule
      
      expect(adapter.schedule).toBeInstanceOf(Schedule)
      expect(adapter.schedule).toBe(schedule)
    })

    it('#calendar', () => {
      const calendar = new Calendar()

      adapter.calendar = calendar
      
      expect(adapter.calendar).toBeInstanceOf(Calendar)
      expect(adapter.calendar).toBe(calendar)
    })

    describe('#add()', () => {
      let newAdapter: IDateAdapter<any>

      beforeEach(() => {
        newAdapter = adapter.clone()
      })

      afterEach(() => {
        expect(newAdapter.toISOString()).not.toBe(adapter.toISOString())
      })

      describe('year', () => {
        it('1', () =>
          expect(newAdapter.add(1, 'year').toISOString()).toBe(isoString(1971, 1, 1, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.add(13, 'year').toISOString()).toBe(isoString(1983, 1, 1, 1, 1, 1)))
      })

      describe('month', () => {
        it('1', () =>
          expect(newAdapter.add(1, 'month').toISOString()).toBe(isoString(1970, 2, 1, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.add(13, 'month').toISOString()).toBe(isoString(1971, 2, 1, 1, 1, 1)))
      })

      describe('week', () => {
        it('1', () =>
          expect(newAdapter.add(1, 'week').toISOString()).toBe(isoString(1970, 1, 8, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.add(13, 'week').toISOString()).toBe(isoString(1970, 4, 2, 1, 1, 1)))
      })

      describe('day', () => {
        it('1', () =>
          expect(newAdapter.add(1, 'day').toISOString()).toBe(isoString(1970, 1, 2, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.add(13, 'day').toISOString()).toBe(isoString(1970, 1, 14, 1, 1, 1)))
      })

      describe('hour', () => {
        it('1', () =>
          expect(newAdapter.add(1, 'hour').toISOString()).toBe(isoString(1970, 1, 1, 2, 1, 1)))
        it('13', () =>
          expect(newAdapter.add(13, 'hour').toISOString()).toBe(isoString(1970, 1, 1, 14, 1, 1)))
      })

      describe('minute', () => {
        it('1', () =>
          expect(newAdapter.add(1, 'minute').toISOString()).toBe(isoString(1970, 1, 1, 1, 2, 1)))
        it('13', () =>
          expect(newAdapter.add(13, 'minute').toISOString()).toBe(isoString(1970, 1, 1, 1, 14, 1)))
      })

      describe('second', () => {
        it('1', () =>
          expect(newAdapter.add(1, 'second').toISOString()).toBe(isoString(1970, 1, 1, 1, 1, 2)))
        it('13', () =>
          expect(newAdapter.add(13, 'second').toISOString()).toBe(isoString(1970, 1, 1, 1, 1, 14)))
      })
    })

    describe('#subtract()', () => {
      let newAdapter: IDateAdapter<any>

      beforeEach(() => {
        newAdapter = adapter.clone()
      })

      afterEach(() => {
        expect(newAdapter.toISOString()).not.toBe(adapter.toISOString())
      })

      describe('year', () => {
        it('1', () =>
          expect(newAdapter.subtract(1, 'year').toISOString()).toBe(isoString(1969, 1, 1, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.subtract(13, 'year').toISOString()).toBe(isoString(1957, 1, 1, 1, 1, 1)))
      })

      describe('month', () => {
        it('1', () =>
          expect(newAdapter.subtract(1, 'month').toISOString()).toBe(isoString(1969, 12, 1, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.subtract(13, 'month').toISOString()).toBe(
            isoString(1968, 12, 1, 1, 1, 1)
          ))
      })

      describe('week', () => {
        it('1', () =>
          expect(newAdapter.subtract(1, 'week').toISOString()).toBe(isoString(1969, 12, 25, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.subtract(13, 'week').toISOString()).toBe(isoString(1969, 10, 2, 1, 1, 1)))
      })

      describe('day', () => {
        it('1', () =>
          expect(newAdapter.subtract(1, 'day').toISOString()).toBe(isoString(1969, 12, 31, 1, 1, 1)))
        it('13', () =>
          expect(newAdapter.subtract(13, 'day').toISOString()).toBe(isoString(1969, 12, 19, 1, 1, 1)))
      })

      describe('hour', () => {
        it('1', () =>
          expect(newAdapter.subtract(1, 'hour').toISOString()).toBe(isoString(1970, 1, 1, 0, 1, 1)))
        it('13', () =>
          expect(newAdapter.subtract(13, 'hour').toISOString()).toBe(
            isoString(1969, 12, 31, 12, 1, 1)
          ))
      })

      describe('minute', () => {
        it('1', () =>
          expect(newAdapter.subtract(1, 'minute').toISOString()).toBe(isoString(1970, 1, 1, 1, 0, 1)))
        it('13', () =>
          expect(newAdapter.subtract(13, 'minute').toISOString()).toBe(
            isoString(1970, 1, 1, 0, 48, 1)
          ))
      })

      describe('second', () => {
        it('1', () =>
          expect(newAdapter.subtract(1, 'second').toISOString()).toBe(isoString(1970, 1, 1, 1, 1, 0)))
        it('13', () =>
          expect(newAdapter.subtract(13, 'second').toISOString()).toBe(
            isoString(1970, 1, 1, 1, 0, 48)
          ))
      })
    })

    describe('#get()', () => {
      it('year', () => expect(adapter.get('year')).toBe(1970))

      it('month', () => expect(adapter.get('month')).toBe(1))

      it('yearday', () => expect(adapter.get('yearday')).toBe(1))

      it('weekday', () => expect(adapter.get('weekday')).toBe('TH'))

      it('day', () => expect(adapter.get('day')).toBe(1))

      it('hour', () => expect(adapter.get('hour')).toBe(1))

      it('minute', () => expect(adapter.get('minute')).toBe(1))

      it('second', () => expect(adapter.get('second')).toBe(1))

      it('ordinal', () => expect(adapter.valueOf()).toBe(32461000))

      // I can't think of a generic way to test TZ offset for all DateAdapters
      it.skip('tzoffset', () => {
        const offset = adapter.date.getTimezoneOffset()

        expect(adapter.utcOffset).toBe(offset)
      })

      it('timezone', () => expect(adapter.get('timezone')).toBe(localTimezone))
    })

    describe('#set()', () => {
      it('year', () =>
        expect(adapter.set('year', 2000).toISOString()).toBe(isoString(2000, 1, 1, 1, 1, 1)))

      it('month', () =>
        expect(adapter.set('month', 5).toISOString()).toBe(isoString(1970, 5, 1, 1, 1, 1)))

      it('day', () =>
        expect(adapter.set('day', 20).toISOString()).toBe(isoString(1970, 1, 20, 1, 1, 1)))

      it('hour', () =>
        expect(adapter.set('hour', 3).toISOString()).toBe(isoString(1970, 1, 1, 3, 1, 1)))

      it('minute', () =>
        expect(adapter.set('minute', 4).toISOString()).toBe(isoString(1970, 1, 1, 1, 4, 1)))

      it('second', () =>
        expect(adapter.set('second', 5).toISOString()).toBe(isoString(1970, 1, 1, 1, 1, 5)))

      it('timezone', () => {
        expect(adapter.set('timezone', 'UTC').toISOString()).toBe(isoString(1970, 1, 1, 1, 1, 1))
        expect(adapter.get('timezone')).toBe('UTC')
      })
    })
  })

  describe('UTC', () => {
    let localAdapter: IDateAdapter<any>
    let utcAdapter: IDateAdapter<any>

    beforeEach(() => {
      localAdapter = dateAdapter(2000, 1, 2, 3, 4, 5, 0)
      utcAdapter = dateAdapter(2000, 1, 2, 3, 4, 5, 0, 'UTC')
    })

    afterEach(() => {
      expect(localAdapter.get('timezone') === localTimezone)
      expect(utcAdapter.get('timezone') === 'UTC')
    })

    it('#clone()', () => {
      expect(utcAdapter.clone()).toBeInstanceOf(DateAdapter)
      expect(utcAdapter.clone() === utcAdapter).toBeFalsy()
      expect(utcAdapter.clone() == utcAdapter).toBeFalsy()
      expect(utcAdapter.clone().date).toEqual(utcAdapter.date)
      expect(utcAdapter.clone().date == utcAdapter.date).toBeFalsy()
      expect(utcAdapter.clone().utcOffset).toEqual(utcAdapter.utcOffset)
      expect(utcAdapter.clone().get('timezone')).toEqual(utcAdapter.get('timezone'))
      expect(utcAdapter.clone().toISOString() === utcAdapter.toISOString()).toBeTruthy()
      const date = datetime(1984, 5, 5, 2, 1, 4)
      expect(
        new DateAdapter(date).clone().isEqual(new DateAdapter(date))
      ).toBeTruthy()
    })

    describe('#get()', () => {
      it('year', () => expect(utcAdapter.get('year')).toBe(2000))

      it('month', () => expect(utcAdapter.get('month')).toBe(1))

      it('yearday', () => expect(utcAdapter.get('yearday')).toBe(2))

      it('weekday', () => expect(utcAdapter.get('weekday')).toBe('SU'))

      it('day', () => expect(utcAdapter.get('day')).toBe(2))

      it('hour', () => expect(utcAdapter.get('hour')).toBe(3))

      it('minute', () => expect(utcAdapter.get('minute')).toBe(4))

      it('second', () => expect(utcAdapter.get('second')).toBe(5))

      it('ordinal', () => expect(utcAdapter.valueOf()).toBe(946782245000))

      it('tzoffset', () => expect(utcAdapter.utcOffset).toBe(0))

      it('timezone', () => expect(utcAdapter.get('timezone')).toBe('UTC'))
    })

    describe('#set()', () => {
      it('year', () => {
        expect(utcAdapter.set('year', 2001).toISOString()).toBe(isoString(2001, 1, 2, 3, 4, 5, 0, 'UTC'))
        expect(utcAdapter.set('year', 2001).toISOString()).not.toBe(isoString(2001, 1, 2, 3, 4, 5, 0))
        expect(utcAdapter.set('year', 2001).toISOString()).not.toBe(localAdapter.set('year', 2001).toISOString())
      })

      it('month', () => {
        expect(utcAdapter.set('month', 3).toISOString()).toBe(isoString(2000, 3, 2, 3, 4, 5, 0, 'UTC'))
        expect(utcAdapter.set('month', 3).toISOString()).not.toBe(isoString(2000, 3, 2, 3, 4, 5, 0))
        expect(utcAdapter.set('month', 3).toISOString()).not.toBe(localAdapter.set('month', 3).toISOString())
      })

      it('day', () => {
        expect(utcAdapter.set('day', 3).toISOString()).toBe(isoString(2000, 1, 3, 3, 4, 5, 0, 'UTC'))
        expect(utcAdapter.set('day', 3).toISOString()).not.toBe(isoString(2000, 1, 3, 3, 4, 5, 0))
        expect(utcAdapter.set('day', 3).toISOString()).not.toBe(localAdapter.set('day', 3).toISOString())
      })

      it('hour', () => {
        expect(utcAdapter.set('hour', 4).toISOString()).toBe(isoString(2000, 1, 2, 4, 4, 5, 0, 'UTC'))
        expect(utcAdapter.set('hour', 4).toISOString()).not.toBe(isoString(2000, 1, 2, 4, 4, 5, 0))
        expect(utcAdapter.set('hour', 4).toISOString()).not.toBe(localAdapter.set('hour', 4).toISOString())
      })

      it('minute', () => {
        expect(utcAdapter.set('minute', 5).toISOString()).toBe(isoString(2000, 1, 2, 3, 5, 5, 0, 'UTC'))
        expect(utcAdapter.set('minute', 5).toISOString()).not.toBe(isoString(2000, 1, 2, 3, 5, 5, 0))
        expect(utcAdapter.set('minute', 5).toISOString()).not.toBe(localAdapter.set('minute', 5).toISOString())
      })

      it('second', () => {
        expect(utcAdapter.set('second', 6).toISOString()).toBe(isoString(2000, 1, 2, 3, 4, 6, 0, 'UTC'))
        expect(utcAdapter.set('second', 6).toISOString()).not.toBe(isoString(2000, 1, 2, 3, 4, 6, 0))
        expect(utcAdapter.set('second', 6).toISOString()).not.toBe(localAdapter.set('second', 6).toISOString())
      })

      it('millisecond', () => {
        expect(utcAdapter.set('millisecond', 10).toISOString()).toBe(isoString(2000, 1, 2, 3, 4, 5, 10, 'UTC'))
        expect(utcAdapter.set('millisecond', 10).toISOString()).not.toBe(isoString(2000, 1, 2, 3, 4, 5, 10))
        expect(utcAdapter.set('millisecond', 10).toISOString()).not.toBe(localAdapter.set('millisecond', 10).toISOString())
      })

      it('timezone', () => {
        utcAdapter.set('timezone', undefined)
        
        expect(utcAdapter.toISOString()).toBe(
          isoString(2000,1,2,3,4,5,0, 'UTC')
        )
        
        expect(utcAdapter.get('timezone')).toBe(localTimezone)

        // reset to pass `afterAll()` tests
        utcAdapter.set('timezone', 'UTC')
      })
    })
  })

  if (DateAdapter.hasTimezoneSupport) {
    /** 
     * Test handling of valid timezones
     */
    [
      "Africa/Johannesburg",
      "America/Los_Angeles",
      "America/Chicago",
      "America/New_York",
      "America/Santiago",
      "Europe/Athens",
      "Europe/London",
      "Asia/Shanghai",
      "Asia/Singapore",
      "Australia/Melbourne",
    ].forEach(zone => {
      context(zone, (zone) => {
        let localAdapter: IDateAdapter<any>
        let zoneAdapter: IDateAdapter<any>
    
        beforeEach(() => {
          localAdapter = dateAdapter(2000, 1, 2, 3, 4, 5, 0)
          zoneAdapter = dateAdapter(2000, 1, 2, 3, 4, 5, 0, zone)
        })

        it('#clone()', () => {
          expect(zoneAdapter.clone()).toBeInstanceOf(DateAdapter)
          expect(zoneAdapter.clone() === zoneAdapter).toBeFalsy()
          expect(zoneAdapter.clone() == zoneAdapter).toBeFalsy()
          expect(zoneAdapter.clone().date).toEqual(zoneAdapter.date)
          expect(zoneAdapter.clone().date == zoneAdapter.date).toBeFalsy()
          expect(zoneAdapter.clone().utcOffset).toEqual(zoneAdapter.utcOffset)
          expect(zoneAdapter.clone().get('timezone')).toEqual(zoneAdapter.get('timezone'))
          expect(zoneAdapter.clone().toISOString() === zoneAdapter.toISOString()).toBeTruthy()
          const date = datetime(1984, 5, 5, 2, 1, 4)
          expect(
            new DateAdapter(date).clone().isEqual(new DateAdapter(date))
          ).toBeTruthy()
        })
  
        describe('#get()', () => {
          it('year', () => expect(zoneAdapter.get('year')).toBe(2000))
    
          it('month', () => expect(zoneAdapter.get('month')).toBe(1))
    
          it('yearday', () => expect(zoneAdapter.get('yearday')).toBe(2))
    
          it('weekday', () => expect(zoneAdapter.get('weekday')).toBe('SU'))
    
          it('day', () => expect(zoneAdapter.get('day')).toBe(2))
    
          it('hour', () => expect(zoneAdapter.get('hour')).toBe(3))
    
          it('minute', () => expect(zoneAdapter.get('minute')).toBe(4))
    
          it('second', () => expect(zoneAdapter.get('second')).toBe(5))
    
          // don't have a good way of getting the real ordinal value to test against
          it.skip('ordinal', () => expect(zoneAdapter.valueOf()).toBe(946782245000))
    
          // don't have a good way of testing the offset as it will change by DST
          it.skip('tzoffset', () => expect(zoneAdapter.utcOffset).toBe(0))
    
          it('timezone', () => expect(zoneAdapter.get('timezone')).toBe(zone))
        })
  
        describe('#set()', () => {
          it('year', () => {
            expect(zoneAdapter.set('year', 2001).toISOString()).toBe(isoString(2001, 1, 2, 3, 4, 5, 0, zone))

            if (localAdapter.utcOffset !== zoneAdapter.utcOffset) {
              expect(zoneAdapter.toISOString()).not.toBe(isoString(2001, 1, 2, 3, 4, 5, 0))
              expect(zoneAdapter.toISOString()).not.toBe(localAdapter.set('year', 2001).toISOString())
            }
          })
    
          it('month', () => {
            expect(zoneAdapter.set('month', 3).toISOString()).toBe(isoString(2000, 3, 2, 3, 4, 5, 0, zone))

            if (localAdapter.utcOffset !== zoneAdapter.utcOffset) {
              expect(zoneAdapter.toISOString()).not.toBe(isoString(2000, 3, 2, 3, 4, 5, 0))
              expect(zoneAdapter.toISOString()).not.toBe(localAdapter.set('month', 3).toISOString())
            }
          })
    
          it('day', () => {
            expect(zoneAdapter.set('day', 3).toISOString()).toBe(isoString(2000, 1, 3, 3, 4, 5, 0, zone))

            if (localAdapter.utcOffset !== zoneAdapter.utcOffset) {
              expect(zoneAdapter.toISOString()).not.toBe(isoString(2000, 1, 3, 3, 4, 5, 0))
              expect(zoneAdapter.toISOString()).not.toBe(localAdapter.set('day', 3).toISOString())
            }
          })
    
          it('hour', () => {
            expect(zoneAdapter.set('hour', 4).toISOString()).toBe(isoString(2000, 1, 2, 4, 4, 5, 0, zone))

            if (localAdapter.utcOffset !== zoneAdapter.utcOffset) {
              expect(zoneAdapter.toISOString()).not.toBe(isoString(2000, 1, 2, 4, 4, 5, 0))
              expect(zoneAdapter.toISOString()).not.toBe(localAdapter.set('hour', 4).toISOString())
            }
          })
    
          it('minute', () => {
            expect(zoneAdapter.set('minute', 5).toISOString()).toBe(isoString(2000, 1, 2, 3, 5, 5, 0, zone))

            if (localAdapter.utcOffset !== zoneAdapter.utcOffset) {
              expect(zoneAdapter.toISOString()).not.toBe(isoString(2000, 1, 2, 3, 5, 5, 0))
              expect(zoneAdapter.toISOString()).not.toBe(localAdapter.set('minute', 5).toISOString())
            }
          })
    
          it('second', () => {
            expect(zoneAdapter.set('second', 6).toISOString()).toBe(isoString(2000, 1, 2, 3, 4, 6, 0, zone))

            if (localAdapter.utcOffset !== zoneAdapter.utcOffset) {
              expect(zoneAdapter.toISOString()).not.toBe(isoString(2000, 1, 2, 3, 4, 6, 0))
              expect(zoneAdapter.toISOString()).not.toBe(localAdapter.set('second', 6).toISOString())
            }
          })
    
          it('millisecond', () => {
            expect(zoneAdapter.set('millisecond', 10).toISOString()).toBe(isoString(2000, 1, 2, 3, 4, 5, 10, zone))

            if (localAdapter.utcOffset !== zoneAdapter.utcOffset) {
              expect(zoneAdapter.toISOString()).not.toBe(isoString(2000, 1, 2, 3, 4, 5, 10))
              expect(zoneAdapter.toISOString()).not.toBe(localAdapter.set('millisecond', 10).toISOString())
              }
          })
    
          it('timezone', () => {
            zoneAdapter.set('timezone', undefined)
            
            expect(zoneAdapter.toISOString()).toBe(
              isoString(2000,1,2,3,4,5,0, zone)
            )
            expect(zoneAdapter.get('timezone')).toBe(localTimezone)

            zoneAdapter.set('timezone', 'UTC')
            
            expect(zoneAdapter.toISOString()).toBe(
              isoString(2000,1,2,3,4,5,0, zone)
            )
            expect(zoneAdapter.get('timezone')).toBe('UTC')
    
            // reset to pass `afterAll()` tests
            zoneAdapter.set('timezone', zone)
          })
        })
      })
    });

    /** Test handling of invalid timezones */
    
    describe('invalid timezone', () => {
      [
        "America/Fadfe",
        "Fake/Melbourne",
        "FJlkeal",
      ].forEach(zone => {
        context(zone, (zone) => {      
          it('throws error', () => {
            expect(() => {
              dateAdapter(2000, 1, 2, 3, 4, 5, 0).set('timezone', zone)
            }).toThrowError(
              `${DateAdapter.name} provided invalid timezone "${zone}".`
            )
          })
        })
      })        
    })
  }
  else {
    describe("no timezone support", () => {
      let adapter: IDateAdapter<any>
  
      beforeEach(() => {
        adapter = dateAdapter(2000, 1, 2, 3, 4, 5, 0)
      })

      describe('#set()', () => {  
        it('timezone', () => {
          expect(() => {adapter.set('timezone', 'America/New_York')}).toThrowError(
            `${DateAdapter.name} does not support "America/New_York" timezone.`
          )
        })
      })
    })
  }
})

})
// @ts-ignore
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'
import { datetime, isoString } from './utilities'

describe('StandardDateAdapterClass', () => {
  it('is instantiable', () => {
    expect(new StandardDateAdapter()).toBeInstanceOf(StandardDateAdapter)

    const date = datetime(1970, 1, 1)

    expect(new StandardDateAdapter(date).date === date).toBeFalsy()
    expect(new StandardDateAdapter(date).date.valueOf() === date.valueOf()).toBeTruthy()
  })

  it('#isInstance()', () => {
    expect(StandardDateAdapter.isInstance(1)).toBeFalsy()
    expect(StandardDateAdapter.isInstance('1')).toBeFalsy()
    expect(StandardDateAdapter.isInstance({})).toBeFalsy()
    expect(StandardDateAdapter.isInstance(StandardDateAdapter)).toBeFalsy()
    expect(StandardDateAdapter.isInstance(new Date())).toBeFalsy()
    expect(StandardDateAdapter.isInstance(new StandardDateAdapter())).toBeTruthy()
  })
})

/**
 * StandardDateAdapter
 */
describe('StandardDateAdapter', () => {
  let adapter: StandardDateAdapter

  beforeEach(() => {
    adapter = new StandardDateAdapter(datetime(1970, 1, 1, 1, 1, 1))
  })

  it('#isSameClass()', () => {
    expect(adapter.isSameClass(new StandardDateAdapter())).toBeTruthy()
    expect(adapter.isSameClass(new Date())).toBeFalsy()
    expect(adapter.isSameClass(1)).toBeFalsy()
    expect(adapter.isSameClass({})).toBeFalsy()
  })

  it('#isEqual()', () => {
    expect(adapter.isEqual(adapter)).toBeTruthy()
    expect(adapter.isEqual(new StandardDateAdapter(adapter.date))).toBeTruthy()
    expect(adapter.isEqual(new StandardDateAdapter())).toBeFalsy()
    expect(adapter.isEqual(1)).toBeFalsy()
    expect(adapter.isEqual(new Date())).toBeFalsy()
  })

  it('#isBefore()', () => {
    expect(adapter.isBefore(adapter)).toBeFalsy()
    expect(adapter.isBefore(new StandardDateAdapter(datetime(1969, 1, 1)))).toBeFalsy()
    expect(adapter.isBefore(new StandardDateAdapter(datetime(1971, 1, 1)))).toBeTruthy()
    expect(adapter.isBefore(new StandardDateAdapter())).toBeTruthy()
  })

  it('#isBeforeOrEqual()', () => {
    expect(adapter.isBeforeOrEqual(adapter)).toBeTruthy()
    expect(adapter.isBeforeOrEqual(new StandardDateAdapter(datetime(1969, 1, 1)))).toBeFalsy()
    expect(adapter.isBeforeOrEqual(new StandardDateAdapter(datetime(1971, 1, 1)))).toBeTruthy()
    expect(adapter.isBeforeOrEqual(new StandardDateAdapter())).toBeTruthy()
  })

  it('#isAfter()', () => {
    expect(adapter.isAfter(adapter)).toBeFalsy()
    expect(adapter.isAfter(new StandardDateAdapter(datetime(1969, 1, 1)))).toBeTruthy()
    expect(adapter.isAfter(new StandardDateAdapter(datetime(1971, 1, 1)))).toBeFalsy()
    expect(adapter.isAfter(new StandardDateAdapter())).toBeFalsy()
  })

  it('#isAfterOrEqual()', () => {
    expect(adapter.isAfterOrEqual(adapter)).toBeTruthy()
    expect(adapter.isAfterOrEqual(new StandardDateAdapter(datetime(1969, 1, 1)))).toBeTruthy()
    expect(adapter.isAfterOrEqual(new StandardDateAdapter(datetime(1971, 1, 1)))).toBeFalsy()
    expect(adapter.isAfterOrEqual(new StandardDateAdapter())).toBeFalsy()
  })

  it('#assertIsValid()', () => {
    adapter.date = new Date('apple')

    expect(() => {
      adapter.assertIsValid()
    }).toThrowError()
  })

  it('#toISOString()', () => {
    expect(adapter.toISOString()).toMatch(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/
    )
  })

  it('#toICal()', () => {
    expect(adapter.toICal()).toMatch(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
    expect(adapter.toICal(true)).toMatch(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/)
  })

  it('#clone()', () => {
    expect(adapter.clone()).toBeInstanceOf(StandardDateAdapter)
    expect(adapter.clone() === adapter).toBeFalsy()
    expect(adapter.clone() == adapter).toBeFalsy()
    expect(adapter.clone().date === adapter.date).toBeFalsy()
    expect(adapter.clone().date == adapter.date).toBeFalsy()
    expect(adapter.clone().date.valueOf() === adapter.date.valueOf()).toBeTruthy()
    const date = datetime(1984, 5, 5, 2, 1, 4)
    expect(
      new StandardDateAdapter(date).clone().isEqual(new StandardDateAdapter(date))
    ).toBeTruthy()
    expect(new StandardDateAdapter(date).date.toISOString()).toBe(date.toISOString())
  })

  describe('#add()', () => {
    let newAdapter: StandardDateAdapter

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
        expect(newAdapter.add(13, 'month').toISOString()).toBe(isoString(1970, 14, 1, 1, 1, 1)))
    })

    describe('week', () => {
      it('1', () =>
        expect(newAdapter.add(1, 'week').toISOString()).toBe(isoString(1970, 1, 8, 1, 1, 1)))
      it('13', () =>
        expect(newAdapter.add(13, 'week').toISOString()).toBe(isoString(1970, 1, 92, 1, 1, 1)))
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
    let newAdapter: StandardDateAdapter

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
    let newAdapter: StandardDateAdapter

    describe('timezone=local', () => {
      it('year', () => expect(adapter.get('year')).toBe(1970))

      it('month', () => expect(adapter.get('month')).toBe(1))

      it('yearday', () => expect(adapter.get('yearday')).toBe(1))

      it('weekday', () => expect(adapter.get('weekday')).toBe('TH'))

      it('day', () => expect(adapter.get('day')).toBe(1))

      it('hour', () => expect(adapter.get('hour')).toBe(1))

      it('minute', () => expect(adapter.get('minute')).toBe(1))

      it('second', () => expect(adapter.get('second')).toBe(1))

      it('ordinal', () => expect(adapter.get('ordinal')).toBe(32461000))

      it('tzoffset', () => {
        const offset = adapter.date.getTimezoneOffset() * 60

        expect(adapter.get('tzoffset')).toBe(offset)
      })

      it('timezone', () => expect(adapter.get('timezone')).toBe(undefined))
    })

    describe('timezone="UTC"', () => {
      beforeEach(() => {
        newAdapter = new StandardDateAdapter(new Date(Date.UTC(2000, 7, 3, 4, 5, 6)))
        newAdapter.timezone = 'UTC'
      })

      it('year', () => expect(newAdapter.get('year')).toBe(2000))

      it('month', () => expect(newAdapter.get('month')).toBe(8))

      it('yearday', () => expect(newAdapter.get('yearday')).toBe(215))

      it('weekday', () => expect(newAdapter.get('weekday')).toBe('TH'))

      it('day', () => expect(newAdapter.get('day')).toBe(3))

      it('hour', () => expect(newAdapter.get('hour')).toBe(4))

      it('minute', () => expect(newAdapter.get('minute')).toBe(5))

      it('second', () => expect(newAdapter.get('second')).toBe(6))

      it('ordinal', () => expect(newAdapter.get('ordinal')).toBe(965275506000))

      it('tzoffset', () => expect(newAdapter.get('tzoffset')).toBe(0))

      it('timezone', () => expect(newAdapter.get('timezone')).toBe('UTC'))
    })
  })

  describe('#set()', () => {
    let newAdapter: StandardDateAdapter

    describe('timezone=local', () => {
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
        expect(adapter.timezone).toBe('UTC')
      })
    })

    describe('timezone="UTC"', () => {
      beforeEach(() => {
        newAdapter = new StandardDateAdapter(new Date(Date.UTC(2000, 7, 3, 4, 5, 6)))
        newAdapter.timezone = 'UTC'
      })

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
        expect(adapter.set('timezone', undefined).toISOString()).toBe(
          isoString(1970, 1, 1, 1, 1, 1)
        )
        expect(adapter.timezone).toBe(undefined)
      })
    })
  })
})

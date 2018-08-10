import {
  parseICalStrings,
  parseDTStart,
  parseDatetime,
  parseWkst,
  parseByMonth,
  parseByMonthDay,
  parseFrequency,
  parseUntil,
  parseCount,
  parseInterval,
  parseBySecond,
  parseByMinute,
  parseByHour,
  parseByDay,
  ruleOptionsToIcalString,
  // @ts-ignore
} from '@rschedule/rschedule'
// @ts-ignore
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'
import { test, datetime } from './utilities'

describe('parseDatetime()', () => {
  describe('VALID', () => {
    test('19990102T030405', time => {
      expect(parseDatetime(time)).toEqual({
        datetimes: [[1999, 1, 2, 3, 4, 5]],
        timezone: undefined,
        raw: time,
      })
    })

    test('20000307T132405Z', time => {
      expect(parseDatetime(time)).toEqual({
        datetimes: [[2000, 3, 7, 13, 24, 5]],
        timezone: 'UTC',
        raw: time,
      })
    })

    test('TZID=America/New_York:19970902T090000', time => {
      expect(parseDatetime(time)).toEqual({
        datetimes: [[1997, 9, 2, 9, 0, 0]],
        timezone: 'America/New_York',
        raw: time,
      })
    })
  })

  describe('INVALID', () => {
    test('20000307132405', time => {
      expect(() => parseDatetime(time)).toThrowError(`Invalid ICAL date/time string "${time}"`)
    })
    test('TZID=America/New_York:19970902T09000', time => {
      expect(() => parseDatetime(time)).toThrowError(`Invalid ICAL date/time string "${time}"`)
    })
    test('TZIDAmerica/New_York:19970902T090000', time => {
      expect(() => parseDatetime(time)).toThrowError(`Invalid ICAL date/time string "${time}"`)
    })
  })
})

describe('parseDTStart()', () => {
  describe('VALID', () => {
    test('DTSTART:19970902T090000', time => {
      expect(parseDTStart(time)).toEqual({
        datetimes: [[1997, 9, 2, 9, 0, 0]],
        timezone: undefined,
        raw: '19970902T090000',
      })
    })

    test('DTSTART:19970902T090000Z', time => {
      expect(parseDTStart(time)).toEqual({
        datetimes: [[1997, 9, 2, 9, 0, 0]],
        timezone: 'UTC',
        raw: '19970902T090000Z',
      })
    })

    test('DTSTART;TZID=America/New_York:19970902T090000', time => {
      expect(parseDTStart(time)).toEqual({
        datetimes: [[1997, 9, 2, 9, 0, 0]],
        timezone: 'America/New_York',
        raw: 'TZID=America/New_York:19970902T090000',
      })
    })
  })

  describe('INVALID', () => {
    test('DTSTART;TZID=America/New_York19970902T090000', time => {
      expect(() => {
        parseDTStart(time)
      }).toThrowError(`Invalid "DTSTART" value "${time}"`)
    })

    test('TZID=America/New_York19970902T090000', time => {
      expect(() => {
        parseDTStart(time)
      }).toThrowError(`Invalid "DTSTART" value "${time}"`)
    })

    test('ap$', time => {
      expect(() => {
        parseDTStart(time)
      }).toThrowError(`Invalid "DTSTART" value "${time}"`)
    })
  })
})

describe('parseFrequency()', () => {
  describe('VALID', () => {
    test('SECONDLY', text => {
      expect(parseFrequency(text)).toEqual(text)
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseFrequency(text)).toThrowError(`Invalid FREQ value "${text}"`)
    })
  })
})

describe('parseUntil()', () => {
  describe('VALID', () => {
    test('19970902T090000Z', text => {
      expect(parseUntil(text, StandardDateAdapter, new StandardDateAdapter()).toISOString()).toBe(
        new StandardDateAdapter(new Date(Date.UTC(1997, 8, 2, 9))).toISOString()
      )
    })

    test('19970902T090000', text => {
      expect(parseUntil(text, StandardDateAdapter, new StandardDateAdapter()).toISOString()).toBe(
        new StandardDateAdapter(new Date(1997, 8, 2, 9)).toISOString()
      )
    })
  })

  describe('INVALID', () => {
    test('19970902090000', text => {
      expect(() => parseUntil(text, StandardDateAdapter, new StandardDateAdapter())).toThrowError(
        `Invalid ICAL date/time string "${text}"`
      )
    })
  })
})

describe('parseCount()', () => {
  describe('VALID', () => {
    test('3', text => {
      expect(parseCount(text)).toBe(3)
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseCount(text)).toThrowError(`Invalid COUNT value "${text}"`)
    })
  })
})

describe('parseInterval()', () => {
  describe('VALID', () => {
    test('3', text => {
      expect(parseInterval(text)).toBe(3)
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseInterval(text)).toThrowError(`Invalid INTERVAL value "${text}"`)
    })
  })
})

describe('parseBySecond()', () => {
  describe('VALID', () => {
    test('3', text => {
      expect(parseBySecond(text)).toEqual([3])
    })

    test('3,4,6,7', text => {
      expect(parseBySecond(text)).toEqual([3, 4, 6, 7])
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseBySecond(text)).toThrowError(`Invalid BYSECOND value "${text}"`)
    })

    test('1,a,4,5', text => {
      expect(() => parseBySecond(text)).toThrowError(`Invalid BYSECOND value "a"`)
    })
  })
})

describe('parseByMinute()', () => {
  describe('VALID', () => {
    test('3', text => {
      expect(parseByMinute(text)).toEqual([3])
    })

    test('3,4,6,7', text => {
      expect(parseByMinute(text)).toEqual([3, 4, 6, 7])
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseByMinute(text)).toThrowError(`Invalid BYMINUTE value "${text}"`)
    })

    test('1,a,4,5', text => {
      expect(() => parseByMinute(text)).toThrowError(`Invalid BYMINUTE value "a"`)
    })
  })
})

describe('parseByHour()', () => {
  describe('VALID', () => {
    test('3', text => {
      expect(parseByHour(text)).toEqual([3])
    })

    test('3,4,60,7', text => {
      expect(parseByHour(text)).toEqual([3, 4, 60, 7])
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseByHour(text)).toThrowError(`Invalid BYHOUR value "${text}"`)
    })

    test('1,3,4,a', text => {
      expect(() => parseByHour(text)).toThrowError(`Invalid BYHOUR value "a"`)
    })
  })
})

describe('parseByDay()', () => {
  describe('VALID', () => {
    test('TU', text => {
      expect(parseByDay(text)).toEqual(['TU'])
    })

    test('1TU,WE,-3FR', text => {
      expect(parseByDay(text)).toEqual([['TU', 1], 'WE', ['FR', -3]])
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseByDay(text)).toThrowError(`Invalid BYDAY value "${text}"`)
    })

    test('1,3,4,a', text => {
      expect(() => parseByDay(text)).toThrowError(`Invalid BYDAY value "1"`)
    })

    test('+1TU,WE,-3FR', text => {
      expect(() => parseByDay(text)).toThrowError(`Invalid BYDAY value "+1TU"`)
    })
  })
})

describe('parseByMonthDay()', () => {
  describe('VALID', () => {
    test('3', text => {
      expect(parseByMonthDay(text)).toEqual([3])
    })

    test('3,4,60,7', text => {
      expect(parseByMonthDay(text)).toEqual([3, 4, 60, 7])
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseByMonthDay(text)).toThrowError(`Invalid BYMONTHDAY value "${text}"`)
    })

    test('1,3,4,a', text => {
      expect(() => parseByMonthDay(text)).toThrowError(`Invalid BYMONTHDAY value "a"`)
    })
  })
})

describe('parseByMonth()', () => {
  describe('VALID', () => {
    test('3', text => {
      expect(parseByMonth(text)).toEqual([3])
    })

    test('3,4,60,7', text => {
      expect(parseByMonth(text)).toEqual([3, 4, 60, 7])
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseByMonth(text)).toThrowError(`Invalid BYMONTH value "${text}"`)
    })

    test('1,3,4,a', text => {
      expect(() => parseByMonth(text)).toThrowError(`Invalid BYMONTH value "a"`)
    })
  })
})

describe('parseWkst()', () => {
  describe('VALID', () => {
    test('TU', text => {
      expect(parseWkst(text)).toBe('TU')
    })

    test('WE', text => {
      expect(parseWkst(text)).toBe('WE')
    })
  })

  describe('INVALID', () => {
    test('SECONDL', text => {
      expect(() => parseWkst(text)).toThrowError(`Invalid WKST value "${text}"`)
    })

    test('SU,FR', text => {
      expect(() => parseWkst(text)).toThrowError(`Invalid WKST value "${text}"`)
    })
  })
})

describe('parseICalStrings()', () => {
  describe('VALID', () => {
    test('DTSTART:19970902T090000\nRRULE:FREQ=DAILY;COUNT=10', ical => {
      expect(parseICalStrings([ical], StandardDateAdapter)).toEqual({
        rdates: [],
        exdates: [],
        rrules: [
          {
            start: new StandardDateAdapter(datetime(1997, 9, 2, 9)),
            frequency: 'DAILY',
            count: 10,
          },
        ],
      })
    })

    test(
      [
        'DTSTART:19970902T090000',
        'RRULE:FREQ=YEARLY;UNTIL=20000131T140000;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA',
      ].join('\n'),
      ical => {
        expect(parseICalStrings([ical], StandardDateAdapter)).toEqual({
          rdates: [],
          exdates: [],
          rrules: [
            {
              start: new StandardDateAdapter(datetime(1997, 9, 2, 9)),
              frequency: 'YEARLY',
              until: new StandardDateAdapter(datetime(2000, 1, 31, 14)),
              byMonthOfYear: [1],
              byDayOfWeek: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
            },
          ],
        })
      }
    )

    test(
      [
        'DTSTART:19970902T090000',
        'RRULE:FREQ=WEEKLY;UNTIL=19971007T000000Z;WKST=SU;BYDAY=TU,TH',
        'RDATE:19970714T123000Z',
        'RDATE:19970714T123000Z',
        'EXDATE:19970714T123000Z',
      ].join('\n'),
      ical => {
        expect(parseICalStrings([ical], StandardDateAdapter)).toEqual({
          rdates: [
            new StandardDateAdapter(new Date(Date.UTC(1997, 6, 14, 12, 30))),
            new StandardDateAdapter(new Date(Date.UTC(1997, 6, 14, 12, 30))),
          ],
          exdates: [new StandardDateAdapter(new Date(Date.UTC(1997, 6, 14, 12, 30)))],
          rrules: [
            {
              start: new StandardDateAdapter(datetime(1997, 9, 2, 9)),
              frequency: 'WEEKLY',
              until: new StandardDateAdapter(new Date(Date.UTC(1997, 9, 7))),
              weekStart: 'SU',
              byDayOfWeek: ['TU', 'TH'],
            },
          ],
        })
      }
    )

    test(
      ['DTSTART:19970907T090000', 'RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=10;BYDAY=1SU,-1SU'].join(
        '\n'
      ),
      ical => {
        expect(parseICalStrings([ical], StandardDateAdapter)).toEqual({
          rdates: [],
          exdates: [],
          rrules: [
            {
              start: new StandardDateAdapter(datetime(1997, 9, 7, 9)),
              frequency: 'MONTHLY',
              interval: 2,
              count: 10,
              byDayOfWeek: [['SU', 1], ['SU', -1]],
            },
          ],
        })
      }
    )

    test(
      [
        'DTSTART:19970910T090000',
        'RRULE:FREQ=SECONDLY;INTERVAL=18;COUNT=10;BYMONTHDAY=10,11,12',
        'RDATE:19970714T083000',
      ].join('\n'),
      ical => {
        expect(parseICalStrings([ical], StandardDateAdapter)).toEqual({
          rdates: [new StandardDateAdapter(datetime(1997, 7, 14, 8, 30))],
          exdates: [],
          rrules: [
            {
              start: new StandardDateAdapter(datetime(1997, 9, 10, 9)),
              frequency: 'SECONDLY',
              interval: 18,
              count: 10,
              byDayOfMonth: [10, 11, 12],
            },
          ],
        })
      }
    )
  })

  describe('INVALID', () => {
    test(
      [
        // wont parse timezone if given DateAdapter doesn't support timezones
        'DTSTART;TZID=America/New_York:19970902T090000',
        'RRULE:FREQ=YEARLY;UNTIL=20000131T140000Z;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA',
      ].join('\n'),
      ical => {
        expect(() => {
          parseICalStrings([ical], StandardDateAdapter)
        }).toThrowError(
          'The `StandardDateAdapter` only supports datetimes in UTC or LOCAL time. ' +
            'You attempted to parse an ICAL string with a "America/New_York" timezone.'
        )
      }
    )

    test(
      ['DTSTART:19970101T090000', 'RRULE:FREQ=YEARLY;INTERVAL=3;COUNT=10;BYYEARDAY=1,100,200'].join(
        '\n'
      ),
      ical => {
        expect(() => {
          parseICalStrings([ical], StandardDateAdapter)
        }).toThrowError(
          '"BYYEARDAY" ' +
            'rule option is unsupported by rSchedule ' +
            'and I have no plans to implement it. Pull requests are welcome though.'
        )
      }
    )
  })
})

describe('ruleOptionsToIcalString()', () => {
  describe('VALID', () => {
    test('DTSTART:19970902T090000\nRRULE:FREQ=DAILY;COUNT=10', ical => {
      expect(
        ruleOptionsToIcalString(
          {
            start: new StandardDateAdapter(datetime(1997, 9, 2, 9)),
            frequency: 'DAILY',
            count: 10,
          },
          'RRULE'
        )
      ).toBe(ical)
    })

    test(
      [
        'DTSTART:19970902T090000',
        'RRULE:FREQ=YEARLY;UNTIL=20000131T140000;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA',
      ].join('\n'),
      ical => {
        expect(
          ruleOptionsToIcalString(
            {
              start: new StandardDateAdapter(datetime(1997, 9, 2, 9)),
              frequency: 'YEARLY',
              until: new StandardDateAdapter(datetime(2000, 1, 31, 14)),
              byMonthOfYear: [1],
              byDayOfWeek: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
            },
            'RRULE'
          )
        ).toBe(ical)
      }
    )

    test(
      [
        'DTSTART:19970902T090000',
        'RRULE:FREQ=WEEKLY;UNTIL=19971007T000000;WKST=SU;BYDAY=TU,TH',
      ].join('\n'),
      ical => {
        expect(
          ruleOptionsToIcalString(
            {
              start: new StandardDateAdapter(datetime(1997, 9, 2, 9)),
              frequency: 'WEEKLY',
              until: new StandardDateAdapter(datetime(1997, 10, 7)),
              weekStart: 'SU',
              byDayOfWeek: ['TU', 'TH'],
            },
            'RRULE'
          )
        ).toBe(ical)
      }
    )

    test(
      ['DTSTART:19970907T090000', 'RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=10;BYDAY=1SU,-1SU'].join(
        '\n'
      ),
      ical => {
        expect(
          ruleOptionsToIcalString(
            {
              start: new StandardDateAdapter(datetime(1997, 9, 7, 9)),
              frequency: 'MONTHLY',
              interval: 2,
              count: 10,
              byDayOfWeek: [['SU', 1], ['SU', -1]],
            },
            'RRULE'
          )
        ).toBe(ical)
      }
    )

    test(
      [
        'DTSTART:19970910T090000',
        'RRULE:FREQ=SECONDLY;INTERVAL=18;COUNT=10;BYMONTHDAY=10,11,12',
      ].join('\n'),
      ical => {
        expect(
          ruleOptionsToIcalString(
            {
              start: new StandardDateAdapter(datetime(1997, 9, 10, 9)),
              frequency: 'SECONDLY',
              interval: 18,
              count: 10,
              byDayOfMonth: [10, 11, 12],
            },
            'RRULE'
          )
        ).toBe(ical)
      }
    )
  })
})

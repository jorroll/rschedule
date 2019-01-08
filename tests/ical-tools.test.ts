import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-date-adapter';
import { Schedule, Utils } from '@rschedule/rschedule';
import {
  parseICal,
  serializeToICal,
  serializeToJCal,
} from '@rschedule/serializers/ical';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime } from 'luxon';
import moment from 'moment-timezone';
import {
  IDtstartProperty,
  parseBYDAY,
  parseBYHOUR,
  parseBYMINUTE,
  parseBYMONTH,
  parseBYMONTHDAY,
  parseBYSECOND,
  parseCOUNT,
  parseINTERVAL,
  parseUNTIL,
  parseWKST,
} from '../packages/serializers/src/lib/ical/parser';
import { test } from './utilities';

const VCALENDAR_STRING = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:ical rrule test
X-WR-TIMEZONE:Europe/London
X-WR-CALDESC:This is to test the rrule settings of a calendar
BEGIN:VTIMEZONE
TZID:Europe/London
X-LIC-LOCATION:Europe/London
BEGIN:DAYLIGHT
TZOFFSETFROM:+0000
TZOFFSETTO:+0100
TZNAME:BST
DTSTART:19700329T010000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0100
TZOFFSETTO:+0000
TZNAME:GMT
DTSTART:19701025T020000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
DTSTART;TZID=Europe/London:20181010T110000
DTEND;TZID=Europe/London:20181010T113000
DTSTAMP:20181010T134444Z
UID:3j14596us9ojbeke2d0mr82mob@google.com
RECURRENCE-ID;TZID=Europe/London:20181010T100000
CREATED:20181008T121212Z
DESCRIPTION:
LAST-MODIFIED:20181008T121234Z
LOCATION:
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Event repeating weekly on a Wednesday at 11am
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART:20181011T120000Z
DTEND:20181011T123000Z
DTSTAMP:20181010T134444Z
UID:1402esp2cdk8pq3134vgg4famo@google.com
CREATED:20181008T120827Z
DESCRIPTION:
LAST-MODIFIED:20181008T121227Z
LOCATION:
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Single event on 11th October
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/London:20181010T100000
DTEND;TZID=Europe/London:20181010T103000
RRULE:FREQ=WEEKLY;BYDAY=WE
DTSTAMP:20181010T134444Z
UID:3j14596us9ojbeke2d0mr82mob@google.com
CREATED:20181008T121212Z
DESCRIPTION:
LAST-MODIFIED:20181008T121212Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Event repeating weekly on a Wednesday at 11am
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/London:20181009T100000
DTEND;TZID=Europe/London:20181009T103000
RRULE:FREQ=MONTHLY;BYDAY=2TU
DTSTAMP:20181010T134444Z
UID:608sq47akt79igo6qu3175lb71@google.com
CREATED:20181008T121046Z
DESCRIPTION:
LAST-MODIFIED:20181008T121046Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Event repeating monthly on 2nd tuesday at 10am
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/London:20181008T100000
DTEND;TZID=Europe/London:20181008T103000
RRULE:FREQ=WEEKLY;BYDAY=MO
DTSTAMP:20181010T134444Z
UID:595ippl4ti0denhj174asq1qn5@google.com
CREATED:20181008T121014Z
DESCRIPTION:
LAST-MODIFIED:20181008T121014Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Event repeating weekly at 10am on Monday
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/London:20181008T090000
DTEND;TZID=Europe/London:20181008T093000
RRULE:FREQ=DAILY
DTSTAMP:20181010T134444Z
UID:31k86s3g7aim1hp6og8kvuuvh9@google.com
CREATED:20181008T120947Z
DESCRIPTION:
LAST-MODIFIED:20181008T120947Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Event repeating Daily at 9am
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART:20181007T090000Z
DTEND:20181007T093000Z
DTSTAMP:20181010T134444Z
UID:7ft0gsg6a9i4u5ukhfo6troduo@google.com
CREATED:20181008T120843Z
DESCRIPTION:
LAST-MODIFIED:20181008T120843Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Single event on 7th october
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

const VEVENT_STRING = `BEGIN:VEVENT
DTSTART;TZID=Europe/London:20181008T090000
DTEND;TZID=Europe/London:20181008T093000
RRULE:FREQ=DAILY
DTSTAMP:20181010T134444Z
UID:31k86s3g7aim1hp6og8kvuuvh9@google.com
CREATED:20181008T120947Z
DESCRIPTION:
LAST-MODIFIED:20181008T120947Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Event repeating Daily at 9am
TRANSP:OPAQUE
END:VEVENT`;

const DTSTART_STRING_DATETIME = `DTSTART;VALUE=DATE-TIME:20181008T090000`;
const DTSTART_STRING_DATE = `DTSTART;VALUE=DATE:20181008`;
const DTSTART_STRING_TIME = `DTSTART;VALUE=TIME:090000`;

const RRULE_STRING = `DTSTART;TZID=America/New_York:19970902T090000
RRULE:FREQ=YEARLY;UNTIL=20000131T140000Z;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA`;

const RRULE_STRING_TWO = `DTSTART:19970902T090000
RRULE:FREQ=WEEKLY;UNTIL=19971007T000000Z;WKST=SU;BYDAY=TU,TH
RDATE:19970714T123000Z
RDATE:19970714T123000Z
EXDATE:19970714T123000Z`;

const INVALID_STRING_ONE = 'Dced34xdio';
const INVALID_STRING_TWO = `DEINT:34dfadlkn;cce`;
const INVALID_STRING_THREE = '';
const INVALID_STRING_FOUR = '\n\n';
const INVALID_STRING_FIVE = `DTSTART:19970902T090000
dfDDDdveajdfdoih3289hxfd
`;
const INVALID_STRING_SIX = `DTSTART:19970902T090000
dfDDDdve;ajdfdoih3289hxfd
dfadfnk:dfjoiaoice
`;

function buildDTSTART(
  props: any,
  y: number,
  m: number,
  d: number,
  h: number,
  mm: number,
  s: number,
  options: {
    utcDate?: boolean;
  } = {},
): IDtstartProperty<typeof StandardDateAdapter> {
  const result = [
    'dtstart',
    {},
    'date-time',
    `${Utils.toTwoCharString(y)}-${Utils.toTwoCharString(
      m,
    )}-${Utils.toTwoCharString(d)}T` +
      `${Utils.toTwoCharString(h)}:${Utils.toTwoCharString(
        mm,
      )}:${Utils.toTwoCharString(s)}`,
  ];

  if (props.tzid && props.tzid === 'UTC') {
    (result as any).processedValue = new Date(Date.UTC(y, m - 1, d, h, mm, s));
    result[3] = (result[3] as any).concat('Z');
  } else if (options.utcDate) {
    (result as any).processedValue = new Date(Date.UTC(y, m - 1, d, h, mm, s));
  } else {
    (result as any).processedValue = new Date(y, m - 1, d, h, mm, s);
  }

  return result as any;
}

describe('StandardDateAdapter()', () => {
  describe('parseUNTIL()', () => {
    describe('VALID', () => {
      test('2010-10-10T00:00:00Z', () => {
        expect(
          parseUNTIL(
            ['rrule', {}, 'recur', { until: '2010-10-10T00:00:00Z' }],
            StandardDateAdapter,
            buildDTSTART({}, 2010, 10, 10, 0, 0, 0, { utcDate: true }),
          ).toISOString(),
        ).toEqual(new Date(Date.UTC(2010, 9, 10, 0, 0, 0)).toISOString());
      });

      test('1997-09-02T09:00:00', () => {
        expect(
          parseUNTIL(
            ['rrule', {}, 'recur', { until: '1997-09-02T09:00:00' }],
            StandardDateAdapter,
            buildDTSTART({}, 1997, 9, 2, 9, 0, 0),
          ).toISOString(),
        ).toEqual(new Date(1997, 8, 2, 9, 0, 0).toISOString());
      });
    });

    describe('INVALID', () => {
      test('19970902090000', () => {
        expect(() =>
          parseUNTIL(
            ['rrule', {}, 'recur', { until: '1997-09-02T09::' }],
            StandardDateAdapter,
            buildDTSTART({}, 1997, 9, 3, 9, 0, 0),
          ).toISOString(),
        ).toThrowError(`Invalid date/time value "1997-09-02T09::"`);
      });

      test('19970902090000', () => {
        expect(() =>
          parseUNTIL(
            ['rrule', {}, 'recur', { until: '1997-09-02T09:00:00' }],
            StandardDateAdapter,
            buildDTSTART({}, 1997, 9, 3, 9, 0, 0),
          ).toISOString(),
        ).toThrowError(
          `Invalid RRULE "UNTIL" property. ` +
            `"UNTIL" value cannot be less than "DTSTART" value.`,
        );
      });
    });
  });

  describe('parseCOUNT()', () => {
    describe('VALID', () => {
      test('3', () => {
        expect(parseCOUNT(3)).toBe(3);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseCOUNT(text as any)).toThrowError(
          `Invalid COUNT value "${text}"`,
        );
      });

      test('-1', () => {
        expect(() => parseCOUNT(-1)).toThrowError(`Invalid COUNT value "-1"`);
      });
    });
  });

  describe('parseINTERVAL()', () => {
    describe('VALID', () => {
      test('3', () => {
        expect(parseINTERVAL(3)).toBe(3);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseINTERVAL(text as any)).toThrowError(
          `Invalid INTERVAL value "${text}"`,
        );
      });

      test('-1', () => {
        expect(() => parseINTERVAL(-1)).toThrowError(
          `Invalid INTERVAL value "-1"`,
        );
      });
    });
  });

  describe('parseBYSECOND()', () => {
    describe('VALID', () => {
      test(3, text => {
        expect(parseBYSECOND(text)).toEqual([3]);
      });

      test([3, 4, 6, 7], text => {
        expect(parseBYSECOND(text)).toEqual([3, 4, 6, 7]);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseBYSECOND(text as any)).toThrowError(
          `Invalid BYSECOND value "${text}"`,
        );
      });

      test([1, 'a', 4, 5], text => {
        expect(() => parseBYSECOND(text as any)).toThrowError(
          `Invalid BYSECOND value "a"`,
        );
      });
    });
  });

  describe('parseBYMINUTE()', () => {
    describe('VALID', () => {
      test(3, text => {
        expect(parseBYMINUTE(text)).toEqual([3]);
      });

      test([3, 4, 6, 7], text => {
        expect(parseBYMINUTE(text)).toEqual([3, 4, 6, 7]);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseBYMINUTE(text as any)).toThrowError(
          `Invalid BYMINUTE value "${text}"`,
        );
      });

      test([1, 'a', 4, 5], text => {
        expect(() => parseBYMINUTE(text as any)).toThrowError(
          `Invalid BYMINUTE value "a"`,
        );
      });
    });
  });

  describe('parseBYHOUR()', () => {
    describe('VALID', () => {
      test(3, text => {
        expect(parseBYHOUR(text)).toEqual([3]);
      });

      test([3, 4, 23, 7], text => {
        expect(parseBYHOUR(text)).toEqual([3, 4, 23, 7]);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseBYHOUR(text as any)).toThrowError(
          `Invalid BYHOUR value "${text}"`,
        );
      });

      test([1, 3, 4, 'a'], text => {
        expect(() => parseBYHOUR(text as any)).toThrowError(
          `Invalid BYHOUR value "a"`,
        );
      });

      test([1, 3, 4, 60], text => {
        expect(() => parseBYHOUR(text)).toThrowError(
          `Invalid BYHOUR value "60"`,
        );
      });
    });
  });

  describe('parseBYDAY()', () => {
    describe('VALID', () => {
      test('TU', text => {
        expect(parseBYDAY(text)).toEqual(['TU']);
      });

      test(['1TU', 'WE', '-3FR'], text => {
        expect(parseBYDAY(text)).toEqual([['TU', 1], 'WE', ['FR', -3]]);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseBYDAY(text)).toThrowError(
          `Invalid BYDAY value "${text}"`,
        );
      });

      test([1, 3, 4, 'a'], text => {
        expect(() => parseBYDAY(text as any)).toThrowError(
          `Invalid BYDAY value "1"`,
        );
      });

      test(['+1TU', 'WE', '-3FR'], text => {
        expect(() => parseBYDAY(text)).toThrowError(
          `Invalid BYDAY value "+1TU"`,
        );
      });
    });
  });

  describe('parseBYMONTHDAY()', () => {
    describe('VALID', () => {
      test(3, text => {
        expect(parseBYMONTHDAY(text)).toEqual([3]);
      });

      test([3, -4, 31, 7], text => {
        expect(parseBYMONTHDAY(text)).toEqual([3, -4, 31, 7]);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseBYMONTHDAY(text as any)).toThrowError(
          `Invalid BYMONTHDAY value "${text}"`,
        );
      });

      test([1, 3, 4, 'a'], text => {
        expect(() => parseBYMONTHDAY(text as any)).toThrowError(
          `Invalid BYMONTHDAY value "a"`,
        );
      });

      test([3, 4, -60, 7], text => {
        expect(() => parseBYMONTHDAY(text)).toThrowError(
          `Invalid BYMONTHDAY value "-60"`,
        );
      });
    });
  });

  describe('parseBYMONTH()', () => {
    describe('VALID', () => {
      test(3, text => {
        expect(parseBYMONTH(text)).toEqual([3]);
      });

      test([3, 4, 12, 7], text => {
        expect(parseBYMONTH(text)).toEqual([3, 4, 12, 7]);
      });
    });

    describe('INVALID', () => {
      test('SECONDL', text => {
        expect(() => parseBYMONTH(text as any)).toThrowError(
          `Invalid BYMONTH value "${text}"`,
        );
      });

      test([1, 3, 4, 'a'], text => {
        expect(() => parseBYMONTH(text as any)).toThrowError(
          `Invalid BYMONTH value "a"`,
        );
      });
    });
  });

  describe('parseWKST()', () => {
    describe('VALID', () => {
      test(3, text => {
        expect(parseWKST(text)).toBe('TU');
      });

      test(4, text => {
        expect(parseWKST(text)).toBe('WE');
      });
    });

    describe('INVALID', () => {
      test('TU', text => {
        expect(() => parseWKST(text as any)).toThrowError(
          `Invalid WKST value "${text}"`,
        );
      });

      test([1, 3], text => {
        expect(() => parseWKST(text as any)).toThrowError(
          `Invalid WKST value "${text}"`,
        );
      });
    });
  });

  describe('serializes', () => {
    let schedule: Schedule<typeof StandardDateAdapter>;

    beforeAll(
      () =>
        (schedule = new Schedule({
          rrules: [
            {
              start: new Date(2010, 9, 10),
              frequency: 'DAILY',
            },
          ],
          dateAdapter: StandardDateAdapter,
        })),
    );

    describe('serializeToJCal()', () => {
      it('serializes Schedule', () => {
        expect(serializeToJCal(schedule)).toEqual([
          [
            'vevent',
            [
              ['dtstart', {}, 'date-time', '2010-10-10T00:00:00'],
              [
                'rrule',
                {},
                'recur',
                {
                  freq: 'DAILY',
                },
              ],
            ],
            [],
          ],
        ]);
      });
    });

    describe('serializeToICal()', () => {
      it('serializes Schedule', () => {
        const ical = [
          'BEGIN:VEVENT',
          'DTSTART:20101010T000000',
          'RRULE:FREQ=DAILY',
          'END:VEVENT',
        ]
          .join('\n')
          .concat('\n');

        expect(serializeToICal(schedule)).toEqual([ical]);
      });
    });
  });

  describe('deserializes | serializes | deserializes', () => {
    const ical = [
      'BEGIN:VEVENT',
      'DTSTART:20101010T000000',
      'RRULE:FREQ=DAILY',
      'RDATE:20101010T000000',
      'END:VEVENT',
    ]
      .join('\n')
      .concat('\n');

    it('works', () => {
      const parsed = parseICal(ical, StandardDateAdapter)[0]
        .events[0] as Schedule<typeof StandardDateAdapter>;

      const serialized = serializeToICal(parsed)[0];

      expect(serialized).toBe(ical);
    });
  });
});

describe('MomentTZDateAdapter', () => {
  describe('parseICal()', () => {
    it('parses RRULE_STRING', () => {
      expect(
        parseICal(RRULE_STRING, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toEqual([
        {
          iCalendar: [
            [
              'vevent',
              [
                [
                  'dtstart',
                  { tzid: 'America/New_York' },
                  'date-time',
                  '1997-09-02T09:00:00',
                ],
                [
                  'rrule',
                  {},
                  'recur',
                  {
                    byday: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
                    bymonth: 1,
                    freq: 'YEARLY',
                    until: '2000-01-31T14:00:00Z',
                  },
                ],
              ],
              [],
            ],
          ],
          calendars: [],
          events: [
            {
              data: {
                iCalendar: [
                  'vevent',
                  [
                    [
                      'dtstart',
                      { tzid: 'America/New_York' },
                      'date-time',
                      '1997-09-02T09:00:00',
                    ],
                    [
                      'rrule',
                      {},
                      'recur',
                      {
                        byday: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
                        bymonth: 1,
                        freq: 'YEARLY',
                        until: '2000-01-31T14:00:00Z',
                      },
                    ],
                  ],
                  [],
                ],
              },
              exdates: [],
              exrules: [],
              rdates: [moment.tz([1997, 8, 2, 9, 0, 0], 'America/New_York')],
              rrules: [
                {
                  byDayOfWeek: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
                  byMonthOfYear: [1],
                  frequency: 'YEARLY',
                  start: moment.tz([1997, 8, 2, 9, 0, 0], 'America/New_York'),
                  until: moment
                    .utc([2000, 0, 31, 14, 0, 0])
                    .tz('America/New_York'),
                },
              ],
            },
          ],
        },
      ]);
    });

    it('parses RRULE_STRING_TWO', () => {
      expect(
        JSON.parse(
          JSON.stringify(
            parseICal(RRULE_STRING_TWO, MomentTZDateAdapter, {
              returnOptionsObjects: true,
            }),
          ),
        ),
      ).toEqual([
        {
          iCalendar: [
            [
              'vevent',
              [
                ['dtstart', {}, 'date-time', '1997-09-02T09:00:00'],
                [
                  'rrule',
                  {},
                  'recur',
                  {
                    byday: ['TU', 'TH'],
                    freq: 'WEEKLY',
                    until: '1997-10-07T00:00:00Z',
                    wkst: 1,
                  },
                ],
                ['rdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                ['rdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                ['exdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
              ],
              [],
            ],
          ],
          calendars: [],
          events: [
            {
              data: {
                iCalendar: [
                  'vevent',
                  [
                    ['dtstart', {}, 'date-time', '1997-09-02T09:00:00'],
                    [
                      'rrule',
                      {},
                      'recur',
                      {
                        byday: ['TU', 'TH'],
                        freq: 'WEEKLY',
                        until: '1997-10-07T00:00:00Z',
                        wkst: 1,
                      },
                    ],
                    ['rdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                    ['rdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                    ['exdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                  ],
                  [],
                ],
              },
              exdates: [moment.utc([1997, 6, 14, 12, 30, 0]).toJSON()],
              exrules: [],
              rdates: [
                moment.utc([1997, 6, 14, 12, 30, 0]).toJSON(),
                moment.utc([1997, 6, 14, 12, 30, 0]).toJSON(),
                moment([1997, 8, 2, 9, 0, 0]).toJSON(),
              ],
              rrules: [
                {
                  byDayOfWeek: ['TU', 'TH'],
                  frequency: 'WEEKLY',
                  start: moment([1997, 8, 2, 9, 0, 0]).toJSON(),
                  until: moment.utc([1997, 9, 7, 0, 0, 0]).toJSON(),
                  weekStart: 'SU',
                },
              ],
            },
          ],
        },
      ]);
    });

    it('parses VEVENT_STRING', () => {
      expect(
        parseICal(VEVENT_STRING, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toEqual([
        {
          iCalendar: [
            [
              'vevent',
              [
                [
                  'dtstart',
                  { tzid: 'Europe/London' },
                  'date-time',
                  '2018-10-08T09:00:00',
                ],
                [
                  'dtend',
                  { tzid: 'Europe/London' },
                  'date-time',
                  '2018-10-08T09:30:00',
                ],
                ['rrule', {}, 'recur', { freq: 'DAILY' }],
                ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                ['uid', {}, 'text', '31k86s3g7aim1hp6og8kvuuvh9@google.com'],
                ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
                ['description', {}, 'text', ''],
                ['last-modified', {}, 'date-time', '2018-10-08T12:09:47Z'],
                ['location', {}, 'text', ''],
                ['sequence', {}, 'integer', 0],
                ['status', {}, 'text', 'CONFIRMED'],
                ['summary', {}, 'text', 'Event repeating Daily at 9am'],
                ['transp', {}, 'text', 'OPAQUE'],
              ],
              [],
            ],
          ],
          calendars: [],
          events: [
            {
              data: {
                iCalendar: [
                  'vevent',
                  [
                    [
                      'dtstart',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-08T09:00:00',
                    ],
                    [
                      'dtend',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-08T09:30:00',
                    ],
                    ['rrule', {}, 'recur', { freq: 'DAILY' }],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '31k86s3g7aim1hp6og8kvuuvh9@google.com',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:09:47Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 0],
                    ['status', {}, 'text', 'CONFIRMED'],
                    ['summary', {}, 'text', 'Event repeating Daily at 9am'],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
              },
              exdates: [],
              exrules: [],
              rdates: [moment.tz([2018, 9, 8, 9, 0, 0], 'Europe/London')],
              rrules: [
                {
                  frequency: 'DAILY',
                  start: moment.tz([2018, 9, 8, 9, 0, 0], 'Europe/London'),
                },
              ],
            },
          ],
        },
      ]);
    });

    it('parses VCALENDAR_STRING', () => {
      expect(
        parseICal(VCALENDAR_STRING, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toEqual([
        {
          events: [],
          calendars: [
            {
              schedules: [
                {
                  rrules: [],
                  exrules: [],
                  rdates: [moment.tz([2018, 9, 10, 11, 0, 0], 'Europe/London')],
                  exdates: [],
                  data: {
                    iCalendar: [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T11:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T11:30:00',
                        ],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '3j14596us9ojbeke2d0mr82mob@google.com',
                        ],
                        [
                          'recurrence-id',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T10:00:00',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:12:34Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 1],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating weekly on a Wednesday at 11am',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  },
                },
                {
                  rrules: [],
                  exrules: [],
                  rdates: [moment.tz([2018, 9, 11, 12, 0, 0], 'UTC')],
                  exdates: [],
                  data: {
                    iCalendar: [
                      'vevent',
                      [
                        ['dtstart', {}, 'date-time', '2018-10-11T12:00:00Z'],
                        ['dtend', {}, 'date-time', '2018-10-11T12:30:00Z'],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '1402esp2cdk8pq3134vgg4famo@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:08:27Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:12:27Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 1],
                        ['status', {}, 'text', 'CONFIRMED'],
                        ['summary', {}, 'text', 'Single event on 11th October'],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  },
                },
                {
                  rrules: [
                    {
                      frequency: 'WEEKLY',
                      start: moment.tz(
                        [2018, 9, 10, 10, 0, 0],
                        'Europe/London',
                      ),
                      byDayOfWeek: ['WE'],
                    },
                  ],
                  exrules: [],
                  rdates: [moment.tz([2018, 9, 10, 10, 0, 0], 'Europe/London')],
                  exdates: [],
                  data: {
                    iCalendar: [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T10:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T10:30:00',
                        ],
                        ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'WE' }],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '3j14596us9ojbeke2d0mr82mob@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:12:12Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating weekly on a Wednesday at 11am',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  },
                },
                {
                  rrules: [
                    {
                      frequency: 'MONTHLY',
                      start: moment.tz([2018, 9, 9, 10, 0, 0], 'Europe/London'),
                      byDayOfWeek: [['TU', 2]],
                    },
                  ],
                  exrules: [],
                  rdates: [moment.tz([2018, 9, 9, 10, 0, 0], 'Europe/London')],
                  exdates: [],
                  data: {
                    iCalendar: [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-09T10:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-09T10:30:00',
                        ],
                        [
                          'rrule',
                          {},
                          'recur',
                          { freq: 'MONTHLY', byday: '2TU' },
                        ],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '608sq47akt79igo6qu3175lb71@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:10:46Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:10:46Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating monthly on 2nd tuesday at 10am',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  },
                },
                {
                  rrules: [
                    {
                      frequency: 'WEEKLY',
                      start: moment.tz([2018, 9, 8, 10, 0, 0], 'Europe/London'),
                      byDayOfWeek: ['MO'],
                    },
                  ],
                  exrules: [],
                  rdates: [moment.tz([2018, 9, 8, 10, 0, 0], 'Europe/London')],
                  exdates: [],
                  data: {
                    iCalendar: [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T10:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T10:30:00',
                        ],
                        ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'MO' }],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '595ippl4ti0denhj174asq1qn5@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:10:14Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:10:14Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating weekly at 10am on Monday',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  },
                },
                {
                  rrules: [
                    {
                      frequency: 'DAILY',
                      start: moment.tz([2018, 9, 8, 9, 0, 0], 'Europe/London'),
                    },
                  ],
                  exrules: [],
                  rdates: [moment.tz([2018, 9, 8, 9, 0, 0], 'Europe/London')],
                  exdates: [],
                  data: {
                    iCalendar: [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T09:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T09:30:00',
                        ],
                        ['rrule', {}, 'recur', { freq: 'DAILY' }],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '31k86s3g7aim1hp6og8kvuuvh9@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:09:47Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        ['summary', {}, 'text', 'Event repeating Daily at 9am'],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  },
                },
                {
                  rrules: [],
                  exrules: [],
                  rdates: [moment.tz([2018, 9, 7, 9, 0, 0], 'UTC')],
                  exdates: [],
                  data: {
                    iCalendar: [
                      'vevent',
                      [
                        ['dtstart', {}, 'date-time', '2018-10-07T09:00:00Z'],
                        ['dtend', {}, 'date-time', '2018-10-07T09:30:00Z'],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '7ft0gsg6a9i4u5ukhfo6troduo@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:08:43Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:08:43Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        ['summary', {}, 'text', 'Single event on 7th october'],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  },
                },
              ],
              data: {
                iCalendar: [
                  'vcalendar',
                  [
                    [
                      'prodid',
                      {},
                      'text',
                      '-//Google Inc//Google Calendar 70.9054//EN',
                    ],
                    ['version', {}, 'text', '2.0'],
                    ['calscale', {}, 'text', 'GREGORIAN'],
                    ['method', {}, 'text', 'PUBLISH'],
                    ['x-wr-calname', {}, 'unknown', 'ical rrule test'],
                    ['x-wr-timezone', {}, 'unknown', 'Europe/London'],
                    [
                      'x-wr-caldesc',
                      {},
                      'unknown',
                      'This is to test the rrule settings of a calendar',
                    ],
                  ],
                  [
                    [
                      'vtimezone',
                      [
                        ['tzid', {}, 'text', 'Europe/London'],
                        ['x-lic-location', {}, 'unknown', 'Europe/London'],
                      ],
                      [
                        [
                          'daylight',
                          [
                            ['tzoffsetfrom', {}, 'utc-offset', '+00:00'],
                            ['tzoffsetto', {}, 'utc-offset', '+01:00'],
                            ['tzname', {}, 'text', 'BST'],
                            ['dtstart', {}, 'date-time', '1970-03-29T01:00:00'],
                            [
                              'rrule',
                              {},
                              'recur',
                              { freq: 'YEARLY', bymonth: 3, byday: '-1SU' },
                            ],
                          ],
                          [],
                        ],
                        [
                          'standard',
                          [
                            ['tzoffsetfrom', {}, 'utc-offset', '+01:00'],
                            ['tzoffsetto', {}, 'utc-offset', '+00:00'],
                            ['tzname', {}, 'text', 'GMT'],
                            ['dtstart', {}, 'date-time', '1970-10-25T02:00:00'],
                            [
                              'rrule',
                              {},
                              'recur',
                              { freq: 'YEARLY', bymonth: 10, byday: '-1SU' },
                            ],
                          ],
                          [],
                        ],
                      ],
                    ],
                    [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T11:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T11:30:00',
                        ],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '3j14596us9ojbeke2d0mr82mob@google.com',
                        ],
                        [
                          'recurrence-id',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T10:00:00',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:12:34Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 1],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating weekly on a Wednesday at 11am',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                    [
                      'vevent',
                      [
                        ['dtstart', {}, 'date-time', '2018-10-11T12:00:00Z'],
                        ['dtend', {}, 'date-time', '2018-10-11T12:30:00Z'],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '1402esp2cdk8pq3134vgg4famo@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:08:27Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:12:27Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 1],
                        ['status', {}, 'text', 'CONFIRMED'],
                        ['summary', {}, 'text', 'Single event on 11th October'],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                    [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T10:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-10T10:30:00',
                        ],
                        ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'WE' }],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '3j14596us9ojbeke2d0mr82mob@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:12:12Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating weekly on a Wednesday at 11am',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                    [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-09T10:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-09T10:30:00',
                        ],
                        [
                          'rrule',
                          {},
                          'recur',
                          { freq: 'MONTHLY', byday: '2TU' },
                        ],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '608sq47akt79igo6qu3175lb71@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:10:46Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:10:46Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating monthly on 2nd tuesday at 10am',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                    [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T10:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T10:30:00',
                        ],
                        ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'MO' }],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '595ippl4ti0denhj174asq1qn5@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:10:14Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:10:14Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        [
                          'summary',
                          {},
                          'text',
                          'Event repeating weekly at 10am on Monday',
                        ],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                    [
                      'vevent',
                      [
                        [
                          'dtstart',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T09:00:00',
                        ],
                        [
                          'dtend',
                          { tzid: 'Europe/London' },
                          'date-time',
                          '2018-10-08T09:30:00',
                        ],
                        ['rrule', {}, 'recur', { freq: 'DAILY' }],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '31k86s3g7aim1hp6og8kvuuvh9@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:09:47Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        ['summary', {}, 'text', 'Event repeating Daily at 9am'],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                    [
                      'vevent',
                      [
                        ['dtstart', {}, 'date-time', '2018-10-07T09:00:00Z'],
                        ['dtend', {}, 'date-time', '2018-10-07T09:30:00Z'],
                        ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                        [
                          'uid',
                          {},
                          'text',
                          '7ft0gsg6a9i4u5ukhfo6troduo@google.com',
                        ],
                        ['created', {}, 'date-time', '2018-10-08T12:08:43Z'],
                        ['description', {}, 'text', ''],
                        [
                          'last-modified',
                          {},
                          'date-time',
                          '2018-10-08T12:08:43Z',
                        ],
                        ['location', {}, 'text', ''],
                        ['sequence', {}, 'integer', 0],
                        ['status', {}, 'text', 'CONFIRMED'],
                        ['summary', {}, 'text', 'Single event on 7th october'],
                        ['transp', {}, 'text', 'OPAQUE'],
                      ],
                      [],
                    ],
                  ],
                ],
              },
            },
          ],
          iCalendar: [
            [
              'vcalendar',
              [
                [
                  'prodid',
                  {},
                  'text',
                  '-//Google Inc//Google Calendar 70.9054//EN',
                ],
                ['version', {}, 'text', '2.0'],
                ['calscale', {}, 'text', 'GREGORIAN'],
                ['method', {}, 'text', 'PUBLISH'],
                ['x-wr-calname', {}, 'unknown', 'ical rrule test'],
                ['x-wr-timezone', {}, 'unknown', 'Europe/London'],
                [
                  'x-wr-caldesc',
                  {},
                  'unknown',
                  'This is to test the rrule settings of a calendar',
                ],
              ],
              [
                [
                  'vtimezone',
                  [
                    ['tzid', {}, 'text', 'Europe/London'],
                    ['x-lic-location', {}, 'unknown', 'Europe/London'],
                  ],
                  [
                    [
                      'daylight',
                      [
                        ['tzoffsetfrom', {}, 'utc-offset', '+00:00'],
                        ['tzoffsetto', {}, 'utc-offset', '+01:00'],
                        ['tzname', {}, 'text', 'BST'],
                        ['dtstart', {}, 'date-time', '1970-03-29T01:00:00'],
                        [
                          'rrule',
                          {},
                          'recur',
                          { freq: 'YEARLY', bymonth: 3, byday: '-1SU' },
                        ],
                      ],
                      [],
                    ],
                    [
                      'standard',
                      [
                        ['tzoffsetfrom', {}, 'utc-offset', '+01:00'],
                        ['tzoffsetto', {}, 'utc-offset', '+00:00'],
                        ['tzname', {}, 'text', 'GMT'],
                        ['dtstart', {}, 'date-time', '1970-10-25T02:00:00'],
                        [
                          'rrule',
                          {},
                          'recur',
                          { freq: 'YEARLY', bymonth: 10, byday: '-1SU' },
                        ],
                      ],
                      [],
                    ],
                  ],
                ],
                [
                  'vevent',
                  [
                    [
                      'dtstart',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-10T11:00:00',
                    ],
                    [
                      'dtend',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-10T11:30:00',
                    ],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '3j14596us9ojbeke2d0mr82mob@google.com',
                    ],
                    [
                      'recurrence-id',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-10T10:00:00',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:12:34Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 1],
                    ['status', {}, 'text', 'CONFIRMED'],
                    [
                      'summary',
                      {},
                      'text',
                      'Event repeating weekly on a Wednesday at 11am',
                    ],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
                [
                  'vevent',
                  [
                    ['dtstart', {}, 'date-time', '2018-10-11T12:00:00Z'],
                    ['dtend', {}, 'date-time', '2018-10-11T12:30:00Z'],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '1402esp2cdk8pq3134vgg4famo@google.com',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:08:27Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:12:27Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 1],
                    ['status', {}, 'text', 'CONFIRMED'],
                    ['summary', {}, 'text', 'Single event on 11th October'],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
                [
                  'vevent',
                  [
                    [
                      'dtstart',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-10T10:00:00',
                    ],
                    [
                      'dtend',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-10T10:30:00',
                    ],
                    ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'WE' }],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '3j14596us9ojbeke2d0mr82mob@google.com',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:12:12Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 0],
                    ['status', {}, 'text', 'CONFIRMED'],
                    [
                      'summary',
                      {},
                      'text',
                      'Event repeating weekly on a Wednesday at 11am',
                    ],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
                [
                  'vevent',
                  [
                    [
                      'dtstart',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-09T10:00:00',
                    ],
                    [
                      'dtend',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-09T10:30:00',
                    ],
                    ['rrule', {}, 'recur', { freq: 'MONTHLY', byday: '2TU' }],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '608sq47akt79igo6qu3175lb71@google.com',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:10:46Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:10:46Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 0],
                    ['status', {}, 'text', 'CONFIRMED'],
                    [
                      'summary',
                      {},
                      'text',
                      'Event repeating monthly on 2nd tuesday at 10am',
                    ],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
                [
                  'vevent',
                  [
                    [
                      'dtstart',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-08T10:00:00',
                    ],
                    [
                      'dtend',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-08T10:30:00',
                    ],
                    ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'MO' }],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '595ippl4ti0denhj174asq1qn5@google.com',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:10:14Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:10:14Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 0],
                    ['status', {}, 'text', 'CONFIRMED'],
                    [
                      'summary',
                      {},
                      'text',
                      'Event repeating weekly at 10am on Monday',
                    ],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
                [
                  'vevent',
                  [
                    [
                      'dtstart',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-08T09:00:00',
                    ],
                    [
                      'dtend',
                      { tzid: 'Europe/London' },
                      'date-time',
                      '2018-10-08T09:30:00',
                    ],
                    ['rrule', {}, 'recur', { freq: 'DAILY' }],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '31k86s3g7aim1hp6og8kvuuvh9@google.com',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:09:47Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 0],
                    ['status', {}, 'text', 'CONFIRMED'],
                    ['summary', {}, 'text', 'Event repeating Daily at 9am'],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
                [
                  'vevent',
                  [
                    ['dtstart', {}, 'date-time', '2018-10-07T09:00:00Z'],
                    ['dtend', {}, 'date-time', '2018-10-07T09:30:00Z'],
                    ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
                    [
                      'uid',
                      {},
                      'text',
                      '7ft0gsg6a9i4u5ukhfo6troduo@google.com',
                    ],
                    ['created', {}, 'date-time', '2018-10-08T12:08:43Z'],
                    ['description', {}, 'text', ''],
                    ['last-modified', {}, 'date-time', '2018-10-08T12:08:43Z'],
                    ['location', {}, 'text', ''],
                    ['sequence', {}, 'integer', 0],
                    ['status', {}, 'text', 'CONFIRMED'],
                    ['summary', {}, 'text', 'Single event on 7th october'],
                    ['transp', {}, 'text', 'OPAQUE'],
                  ],
                  [],
                ],
              ],
            ],
          ],
        },
      ]);
    });

    it('handles INVALID_STRING_ONE', () => {
      expect(() =>
        parseICal(INVALID_STRING_ONE, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toThrowError(`invalid line (no token ";" or ":") "Dced34xdio"`);
    });

    it('handles INVALID_STRING_TWO', () => {
      expect(() =>
        parseICal(INVALID_STRING_TWO, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toThrowError(`Invalid VEVENT component: "DTSTART" property missing.`);
    });

    it('handles INVALID_STRING_THREE', () => {
      expect(
        parseICal(INVALID_STRING_THREE, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toEqual([{ iCalendar: [], calendars: [], events: [] }]);
    });

    it('handles INVALID_STRING_FOUR', () => {
      expect(
        parseICal(INVALID_STRING_FOUR, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toEqual([{ iCalendar: [], calendars: [], events: [] }]);
    });

    it('handles INVALID_STRING_FIVE', () => {
      expect(() =>
        parseICal(INVALID_STRING_FIVE, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toThrowError(
        `invalid line (no token ";" or ":") "dfDDDdveajdfdoih3289hxfd"`,
      );
    });

    it('handles INVALID_STRING_SIX', () => {
      expect(() =>
        parseICal(INVALID_STRING_SIX, MomentTZDateAdapter, {
          returnOptionsObjects: true,
        }),
      ).toThrowError(`Invalid parameters in 'dfDDDdve;ajdfdoih3289hxfd'`);
    });
  });

  describe('serializes', () => {
    let schedule: Schedule<typeof MomentTZDateAdapter>;

    beforeAll(
      () =>
        (schedule = new Schedule({
          rrules: [
            {
              start: moment([2010, 9, 10]),
              frequency: 'DAILY',
            },
          ],
          dateAdapter: MomentTZDateAdapter,
        })),
    );

    describe('serializeToJCal()', () => {
      it('serializes Schedule', () => {
        expect(serializeToJCal(schedule)).toEqual([
          [
            'vevent',
            [
              ['dtstart', {}, 'date-time', '2010-10-10T00:00:00'],
              [
                'rrule',
                {},
                'recur',
                {
                  freq: 'DAILY',
                },
              ],
            ],
            [],
          ],
        ]);
      });
    });

    describe('serializeToICal()', () => {
      it('serializes Schedule', () => {
        const ical = [
          'BEGIN:VEVENT',
          'DTSTART:20101010T000000',
          'RRULE:FREQ=DAILY',
          'END:VEVENT',
        ]
          .join('\n')
          .concat('\n');

        expect(serializeToICal(schedule)).toEqual([ical]);
      });
    });
  });

  describe('deserializes | serializes | deserializes', () => {
    const ical = [
      'BEGIN:VEVENT',
      'DTSTART:20101010T000000',
      'RRULE:FREQ=DAILY',
      'RDATE:20101010T000000',
      'END:VEVENT',
    ]
      .join('\n')
      .concat('\n');

    it('works', () => {
      const parsed = parseICal(ical, MomentTZDateAdapter)[0]
        .events[0] as Schedule<typeof MomentTZDateAdapter>;

      const serialized = serializeToICal(parsed)[0];

      expect(serialized).toBe(ical);
    });
  });
});

describe('LuxonDateAdapter', () => {
  describe('serializes', () => {
    let schedule: Schedule<typeof LuxonDateAdapter>;

    beforeAll(
      () =>
        (schedule = new Schedule({
          rrules: [
            {
              start: DateTime.fromObject({ year: 2010, month: 10, day: 10 }),
              frequency: 'DAILY',
            },
          ],
          dateAdapter: LuxonDateAdapter,
        })),
    );

    describe('serializeToJCal()', () => {
      it('serializes Schedule', () => {
        expect(serializeToJCal(schedule)).toEqual([
          [
            'vevent',
            [
              [
                'dtstart',
                { tzid: 'America/Los_Angeles' },
                'date-time',
                '2010-10-10T00:00:00',
              ],
              [
                'rrule',
                {},
                'recur',
                {
                  freq: 'DAILY',
                },
              ],
            ],
            [],
          ],
        ]);
      });
    });

    describe('serializeToICal()', () => {
      it('serializes Schedule', () => {
        const ical = [
          'BEGIN:VEVENT',
          'DTSTART;TZID=America/Los_Angeles:20101010T000000',
          'RRULE:FREQ=DAILY',
          'END:VEVENT',
        ]
          .join('\n')
          .concat('\n');

        expect(serializeToICal(schedule)).toEqual([ical]);
      });
    });
  });

  describe('deserializes | serializes | deserializes', () => {
    const ical = [
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/Los_Angeles:20101010T000000',
      'RRULE:FREQ=DAILY',
      'RDATE;TZID=America/Los_Angeles:20101010T000000',
      'END:VEVENT',
    ]
      .join('\n')
      .concat('\n');

    it('works', () => {
      const parsed = parseICal(ical, LuxonDateAdapter)[0].events[0] as Schedule<
        typeof LuxonDateAdapter
      >;

      const serialized = serializeToICal(parsed)[0];

      expect(serialized).toBe(ical);
    });
  });

  describe('serializes and deserializes Schedule to VEVENT', () => {
    const now = DateTime.fromObject({
      year: 2010,
      month: 10,
      day: 10,
      hour: 7,
    });

    const schedule = new Schedule({
      rrules: [
        {
          frequency: 'DAILY',
          start: now,
          count: 3,
          byHourOfDay: [7, 16],
        },
      ],
      rdates: [now.plus({ days: 1 }).startOf('day')],
      dateAdapter: LuxonDateAdapter,
    });

    const ical = [
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/Los_Angeles:20101010T070000',
      'RRULE:FREQ=DAILY;COUNT=3;BYHOUR=7,16',
      'RDATE;TZID=America/Los_Angeles:20101011T000000',
      'END:VEVENT',
    ]
      .join('\n')
      .concat('\n');

    const serialized = serializeToICal(schedule)[0];

    it('works', () => {
      expect(serialized).toBe(ical);
    });
  });

  describe('serializes and deserializes Schedule to VCALENDAR', () => {
    const now = DateTime.fromObject({
      year: 2010,
      month: 10,
      day: 10,
      hour: 7,
    });

    const schedule = new Schedule({
      rrules: [
        {
          frequency: 'DAILY',
          start: now,
          count: 3,
          byHourOfDay: [7, 16],
        },
        {
          frequency: 'DAILY',
          start: now.plus({ days: 1 }).startOf('day'),
          count: 2,
          byHourOfDay: [9],
        },
      ],
      rdates: [now.plus({ days: 1 }).startOf('day')],
      dateAdapter: LuxonDateAdapter,
    });

    const ical = [
      'BEGIN:VCALENDAR',
      'X-RSCHEDULE-TYPE:SCHEDULE',
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/Los_Angeles:20101010T070000',
      'RRULE:FREQ=DAILY;COUNT=3;BYHOUR=7,16',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/Los_Angeles:20101011T000000',
      'RRULE:FREQ=DAILY;COUNT=2;BYHOUR=9',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/Los_Angeles:20101011T000000',
      'RDATE;TZID=America/Los_Angeles:20101011T000000',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .join('\n')
      .concat('\n');

    const serialized = serializeToICal(schedule)[0];

    it('works', () => {
      expect(serialized).toBe(ical);
    });
  });
});

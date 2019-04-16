import { IJCalProperty, serializeToICal, serializeToJCal, VEvent } from '@rschedule/ical-tools';
import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import { ConstructorReturnType, DateAdapter as DateAdapterConstructor } from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime as LuxonDateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import {
  parseBYDAY,
  parseBYHOUR,
  parseBYMINUTE,
  parseBYMONTH,
  parseBYMONTHDAY,
  parseBYSECOND,
  parseCOUNT,
  parseICal,
  parseINTERVAL,
  parseUNTIL,
  parseWKST,
} from '../packages/ical-tools/src/lib/parser';
import {
  context,
  DatetimeFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  standardDatetimeFn,
  test,
  timezoneDateAdapterFn,
  timezoneIsoStringFn,
  TIMEZONES,
} from './utilities';

function toTwoCharString(int: number) {
  if (int < 10) {
    return `0${int}`;
  } else {
    return `${int}`;
  }
}

// const VCALENDAR_STRING = `BEGIN:VCALENDAR
// PRODID:-//Google Inc//Google Calendar 70.9054//EN
// VERSION:2.0
// CALSCALE:GREGORIAN
// METHOD:PUBLISH
// X-WR-CALNAME:ical rrule test
// X-WR-TIMEZONE:Europe/London
// X-WR-CALDESC:This is to test the rrule settings of a calendar
// BEGIN:VTIMEZONE
// TZID:Europe/London
// X-LIC-LOCATION:Europe/London
// BEGIN:DAYLIGHT
// TZOFFSETFROM:+0000
// TZOFFSETTO:+0100
// TZNAME:BST
// DTSTART:19700329T010000
// RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
// END:DAYLIGHT
// BEGIN:STANDARD
// TZOFFSETFROM:+0100
// TZOFFSETTO:+0000
// TZNAME:GMT
// DTSTART:19701025T020000
// RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
// END:STANDARD
// END:VTIMEZONE
// BEGIN:VEVENT
// DTSTART;TZID=Europe/London:20181010T110000
// DTEND;TZID=Europe/London:20181010T113000
// DTSTAMP:20181010T134444Z
// UID:3j14596us9ojbeke2d0mr82mob@google.com
// RECURRENCE-ID;TZID=Europe/London:20181010T100000
// CREATED:20181008T121212Z
// DESCRIPTION:
// LAST-MODIFIED:20181008T121234Z
// LOCATION:
// SEQUENCE:1
// STATUS:CONFIRMED
// SUMMARY:Event repeating weekly on a Wednesday at 11am
// TRANSP:OPAQUE
// END:VEVENT
// BEGIN:VEVENT
// DTSTART:20181011T120000Z
// DTEND:20181011T123000Z
// DTSTAMP:20181010T134444Z
// UID:1402esp2cdk8pq3134vgg4famo@google.com
// CREATED:20181008T120827Z
// DESCRIPTION:
// LAST-MODIFIED:20181008T121227Z
// LOCATION:
// SEQUENCE:1
// STATUS:CONFIRMED
// SUMMARY:Single event on 11th October
// TRANSP:OPAQUE
// END:VEVENT
// BEGIN:VEVENT
// DTSTART;TZID=Europe/London:20181010T100000
// DTEND;TZID=Europe/London:20181010T103000
// RRULE:FREQ=WEEKLY;BYDAY=WE
// DTSTAMP:20181010T134444Z
// UID:3j14596us9ojbeke2d0mr82mob@google.com
// CREATED:20181008T121212Z
// DESCRIPTION:
// LAST-MODIFIED:20181008T121212Z
// LOCATION:
// SEQUENCE:0
// STATUS:CONFIRMED
// SUMMARY:Event repeating weekly on a Wednesday at 11am
// TRANSP:OPAQUE
// END:VEVENT
// BEGIN:VEVENT
// DTSTART;TZID=Europe/London:20181009T100000
// DTEND;TZID=Europe/London:20181009T103000
// RRULE:FREQ=MONTHLY;BYDAY=2TU
// DTSTAMP:20181010T134444Z
// UID:608sq47akt79igo6qu3175lb71@google.com
// CREATED:20181008T121046Z
// DESCRIPTION:
// LAST-MODIFIED:20181008T121046Z
// LOCATION:
// SEQUENCE:0
// STATUS:CONFIRMED
// SUMMARY:Event repeating monthly on 2nd tuesday at 10am
// TRANSP:OPAQUE
// END:VEVENT
// BEGIN:VEVENT
// DTSTART;TZID=Europe/London:20181008T100000
// DTEND;TZID=Europe/London:20181008T103000
// RRULE:FREQ=WEEKLY;BYDAY=MO
// DTSTAMP:20181010T134444Z
// UID:595ippl4ti0denhj174asq1qn5@google.com
// CREATED:20181008T121014Z
// DESCRIPTION:
// LAST-MODIFIED:20181008T121014Z
// LOCATION:
// SEQUENCE:0
// STATUS:CONFIRMED
// SUMMARY:Event repeating weekly at 10am on Monday
// TRANSP:OPAQUE
// END:VEVENT
// BEGIN:VEVENT
// DTSTART;TZID=Europe/London:20181008T090000
// DTEND;TZID=Europe/London:20181008T093000
// RRULE:FREQ=DAILY
// DTSTAMP:20181010T134444Z
// UID:31k86s3g7aim1hp6og8kvuuvh9@google.com
// CREATED:20181008T120947Z
// DESCRIPTION:
// LAST-MODIFIED:20181008T120947Z
// LOCATION:
// SEQUENCE:0
// STATUS:CONFIRMED
// SUMMARY:Event repeating Daily at 9am
// TRANSP:OPAQUE
// END:VEVENT
// BEGIN:VEVENT
// DTSTART:20181007T090000Z
// DTEND:20181007T093000Z
// DTSTAMP:20181010T134444Z
// UID:7ft0gsg6a9i4u5ukhfo6troduo@google.com
// CREATED:20181008T120843Z
// DESCRIPTION:
// LAST-MODIFIED:20181008T120843Z
// LOCATION:
// SEQUENCE:0
// STATUS:CONFIRMED
// SUMMARY:Single event on 7th october
// TRANSP:OPAQUE
// END:VEVENT
// END:VCALENDAR`;

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
RRULE:FREQ=WEEKLY;UNTIL=19971007T000000;WKST=SU;BYDAY=TU,TH
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

// Sometimes hidden properties on objects seem to cause `toEqual()` checks
// to fail. This function can clean JSON objects for tests.
function cloneJSON<T>(json: T): T {
  return JSON.parse(JSON.stringify(json));
}

const DATE_ADAPTERS = [
  [StandardDateAdapter, standardDatetimeFn],
  [MomentDateAdapter, momentDatetimeFn],
  [MomentTZDateAdapter, momentTZDatetimeFn],
  [LuxonDateAdapter, luxonDatetimeFn],
] as [
  [typeof StandardDateAdapter, DatetimeFn<Date>],
  [typeof MomentDateAdapter, DatetimeFn<MomentST>],
  [typeof MomentTZDateAdapter, DatetimeFn<MomentTZ>],
  [typeof LuxonDateAdapter, DatetimeFn<LuxonDateTime>]
];

DATE_ADAPTERS.forEach(dateAdapterSet => {
  environment(dateAdapterSet, dateAdapterSet => {
    const [DateAdapter, datetime] = dateAdapterSet as [
      typeof DateAdapterConstructor,
      DatetimeFn<any>
    ];

    // const zones = !DateAdapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];
    const zones = !DateAdapter.hasTimezoneSupport ? ([null, 'UTC'] as const) : TIMEZONES;

    zones.forEach(zone => {
      // function to create new dateAdapter instances
      const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, zone);

      function buildDTSTART(
        y: number,
        m: number,
        d: number,
        h: number,
        mm: number,
        s: number,
        options: {
          timezone?: string | null;
        } = {},
      ): IJCalProperty & {
        processedValue: ConstructorReturnType<typeof DateAdapter>;
      } {
        const result: IJCalProperty = [
          'dtstart',
          {},
          'date-time',
          `${toTwoCharString(y)}-${toTwoCharString(m)}-${toTwoCharString(d)}T` +
            `${toTwoCharString(h)}:${toTwoCharString(mm)}:${toTwoCharString(s)}`,
        ];

        if (options.timezone) {
          (result as any).processedValue = dateAdapter(y, m, d, h, mm, s, options.timezone);
          result[1].tzid = options.timezone;
        } else if (options.timezone === null) {
          (result as any).processedValue = dateAdapter(y, m, d, h, mm, s, options.timezone);
        } else {
          (result as any).processedValue = dateAdapter(y, m, d, h, mm, s);
        }

        if (options.timezone === 'UTC') {
          delete result[1].tzid;
          result[3] = `${result[3]}Z`;
        }

        return result as any;
      }

      context(zone, timezone => {
        describe('parseUNTIL()', () => {
          describe('VALID', () => {
            test('2010-10-10T00:00:00Z', () => {
              expect(
                parseUNTIL(
                  ['rrule', {}, 'recur', { until: '2010-10-10T00:00:00Z' }],
                  DateAdapter,
                  buildDTSTART(2010, 10, 10, 0, 0, 0, { timezone: 'UTC' }),
                ).toISOString(),
              ).toEqual(dateAdapter(2010, 10, 10, 0, 0, 0, 'UTC').toISOString());
            });

            test('1997-09-02T09:00:00', () => {
              expect(
                parseUNTIL(
                  ['rrule', {}, 'recur', { until: '1997-09-02T09:00:00' }],
                  DateAdapter,
                  buildDTSTART(1997, 9, 2, 9, 0, 0, { timezone: null }),
                ).toISOString(),
              ).toEqual(dateAdapter(1997, 9, 2, 9, 0, 0, null).toISOString());
            });

            test('1997-09-05T09:00:00Z', () => {
              expect(
                parseUNTIL(
                  ['rrule', {}, 'recur', { until: '1997-09-05T09:00:00Z' }],
                  DateAdapter,
                  buildDTSTART(1997, 9, 2, 9, 0, 0),
                ).toISOString(),
              ).toEqual(dateAdapter(1997, 9, 5, 9, 0, 0, 'UTC').toISOString());
            });
          });

          describe('INVALID', () => {
            test('19970902090000', () => {
              expect(() =>
                parseUNTIL(
                  ['rrule', {}, 'recur', { until: '1997-09-02T09::' }],
                  DateAdapter,
                  buildDTSTART(1997, 9, 3, 9, 0, 0),
                ).toISOString(),
              ).toThrowError(`Invalid date/time value "1997-09-02T09::"`);

              expect(() =>
                parseUNTIL(
                  ['rrule', {}, 'recur', { until: '1997-09-02T09:00:00' }],
                  DateAdapter,
                  buildDTSTART(1997, 9, 3, 9, 0, 0),
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
              expect(() => parseCOUNT(text as any)).toThrowError(`Invalid COUNT value "${text}"`);
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
              expect(() => parseINTERVAL(-1)).toThrowError(`Invalid INTERVAL value "-1"`);
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
              expect(() => parseBYSECOND(text as any)).toThrowError(`Invalid BYSECOND value "a"`);
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
              expect(() => parseBYMINUTE(text as any)).toThrowError(`Invalid BYMINUTE value "a"`);
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
              expect(() => parseBYHOUR(text as any)).toThrowError(`Invalid BYHOUR value "${text}"`);
            });

            test([1, 3, 4, 'a'], text => {
              expect(() => parseBYHOUR(text as any)).toThrowError(`Invalid BYHOUR value "a"`);
            });

            test([1, 3, 4, 60], text => {
              expect(() => parseBYHOUR(text)).toThrowError(`Invalid BYHOUR value "60"`);
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
              expect(() => parseBYDAY(text)).toThrowError(`Invalid BYDAY value "${text}"`);
            });

            test([1, 3, 4, 'a'], text => {
              expect(() => parseBYDAY(text as any)).toThrowError(`Invalid BYDAY value "1"`);
            });

            test(['+1TU', 'WE', '-3FR'], text => {
              expect(() => parseBYDAY(text)).toThrowError(`Invalid BYDAY value "+1TU"`);
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
              expect(() => parseBYMONTHDAY(text)).toThrowError(`Invalid BYMONTHDAY value "-60"`);
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
              expect(() => parseBYMONTH(text as any)).toThrowError(`Invalid BYMONTH value "a"`);
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
              expect(() => parseWKST(text as any)).toThrowError(`Invalid WKST value "${text}"`);
            });

            test([1, 3], text => {
              expect(() => parseWKST(text as any)).toThrowError(`Invalid WKST value "${text}"`);
            });
          });
        });

        describe('serializes', () => {
          let schedule: VEvent<typeof DateAdapter>;

          beforeAll(
            () =>
              (schedule = new VEvent({
                start: dateAdapter(2010, 11, 10, 0, 0, 0),
                rrules: [
                  {
                    frequency: 'DAILY',
                  },
                ],
                dateAdapter: DateAdapter,
              })),
          );

          describe('serializeToJCal()', () => {
            it('serializes Schedule with only `start`', () => {
              expect(
                cloneJSON(
                  serializeToJCal(
                    new VEvent({
                      start: dateAdapter(2010, 11, 10, 0, 0, 0),
                      dateAdapter: DateAdapter,
                    }),
                  ),
                ),
              ).toEqual(
                cloneJSON(['vevent', [buildDTSTART(2010, 11, 10, 0, 0, 0, { timezone })], []]),
              );
            });
          });

          describe('serializeToJCal()', () => {
            it('serializes Schedule', () => {
              expect(cloneJSON(serializeToJCal(schedule))).toEqual(
                cloneJSON([
                  'vevent',
                  [
                    buildDTSTART(2010, 11, 10, 0, 0, 0, { timezone }),
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
                ]),
              );
            });
          });

          describe('serializeToICal()', () => {
            it('serializes Schedule', () => {
              const ical = ['BEGIN:VEVENT', null, 'RRULE:FREQ=DAILY', 'END:VEVENT'];

              if (timezone === 'UTC') {
                ical[1] = 'DTSTART:20101110T000000Z';
              } else if (timezone === null) {
                ical[1] = 'DTSTART:20101110T000000';
              } else {
                ical[1] = `DTSTART;TZID=${timezone}:20101110T000000`;
              }

              expect(serializeToICal(schedule)).toEqual(ical.join('\n').concat('\n'));
            });
          });
        });

        describe('parseICal()', () => {
          it('parses RRULE_STRING', () => {
            if (DateAdapter.hasTimezoneSupport) {
              const result = parseICal(RRULE_STRING, { dateAdapter: DateAdapter });

              expect(result.iCal).toBe(`BEGIN:VEVENT\n${RRULE_STRING}\nEND:VEVENT`);

              expect(result.jCal).toEqual([
                [
                  'vevent',
                  [
                    ['dtstart', { tzid: 'America/New_York' }, 'date-time', '1997-09-02T09:00:00'],
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
              ]);

              expect(
                cloneJSON(
                  result.vEvents.map(event => ({
                    start: event.start,
                    rrules: event.rrules.map(rule => rule.options),
                    data: event.data,
                  })),
                ),
              ).toEqual([
                {
                  data: {
                    jCal: [
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
                  start: dateAdapter(1997, 9, 2, 9, 0, 0, 'America/New_York').toJSON(),
                  rrules: [
                    {
                      byDayOfWeek: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
                      byMonthOfYear: [1],
                      frequency: 'YEARLY',
                      start: dateAdapter(1997, 9, 2, 9, 0, 0, 'America/New_York').toJSON(),
                      end: dateAdapter(2000, 1, 31, 14, 0, 0, 'UTC')
                        .set('timezone', 'America/New_York')
                        .toJSON(),
                    },
                  ],
                },
              ]);
            } else {
              expect(() => parseICal(RRULE_STRING, { dateAdapter: DateAdapter })).toThrowError();
            }
          });

          it('parses RRULE_STRING_TWO', () => {
            const result = parseICal(RRULE_STRING_TWO, { dateAdapter: DateAdapter });

            expect(result.iCal).toBe(`BEGIN:VEVENT\n${RRULE_STRING_TWO}\nEND:VEVENT`);

            expect(cloneJSON(result.jCal)).toEqual([
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
                      until: '1997-10-07T00:00:00',
                      wkst: 1,
                    },
                  ],
                  ['rdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                  ['rdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                  ['exdate', {}, 'date-time', '1997-07-14T12:30:00Z'],
                ],
                [],
              ],
            ]);

            expect(
              cloneJSON(
                result.vEvents.map(event => ({
                  start: event.start,
                  rrules: event.rrules.map(rule => rule.options),
                  rdates: event.rdates.adapters,
                  exdates: event.exdates.adapters,
                  data: event.data,
                })),
              ),
            ).toEqual([
              {
                data: {
                  jCal: [
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
                          until: '1997-10-07T00:00:00',
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
                start: dateAdapter(1997, 9, 2, 9, 0, 0, null).toJSON(),
                exdates: [dateAdapter(1997, 7, 14, 12, 30, 0, 'UTC').toJSON()],
                rdates: [
                  dateAdapter(1997, 7, 14, 12, 30, 0, 'UTC').toJSON(),
                  dateAdapter(1997, 7, 14, 12, 30, 0, 'UTC').toJSON(),
                ],
                rrules: [
                  {
                    byDayOfWeek: ['TU', 'TH'],
                    frequency: 'WEEKLY',
                    start: dateAdapter(1997, 9, 2, 9, 0, 0, null).toJSON(),
                    end: dateAdapter(1997, 10, 7, 0, 0, 0, null).toJSON(),
                    weekStart: 'SU',
                  },
                ],
              },
            ]);
          });

          it('parses VEVENT_STRING', () => {
            if (DateAdapter.hasTimezoneSupport) {
              const result = parseICal(VEVENT_STRING, { dateAdapter: DateAdapter });

              expect(result.iCal).toBe(VEVENT_STRING);

              expect(cloneJSON(result.jCal)).toEqual([
                [
                  'vevent',
                  [
                    ['dtstart', { tzid: 'Europe/London' }, 'date-time', '2018-10-08T09:00:00'],
                    ['dtend', { tzid: 'Europe/London' }, 'date-time', '2018-10-08T09:30:00'],
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
              ]);

              expect(
                cloneJSON(
                  result.vEvents.map(event => ({
                    start: event.start,
                    rrules: event.rrules.map(rule => rule.options),
                    data: event.data,
                  })),
                ),
              ).toEqual([
                {
                  data: {
                    jCal: [
                      'vevent',
                      [
                        ['dtstart', { tzid: 'Europe/London' }, 'date-time', '2018-10-08T09:00:00'],
                        ['dtend', { tzid: 'Europe/London' }, 'date-time', '2018-10-08T09:30:00'],
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
                  },
                  start: dateAdapter(2018, 10, 8, 9, 0, 0, 'Europe/London').toJSON(),
                  rrules: [
                    {
                      frequency: 'DAILY',
                      start: dateAdapter(2018, 10, 8, 9, 0, 0, 'Europe/London').toJSON(),
                    },
                  ],
                },
              ]);
            } else {
              expect(() => parseICal(VEVENT_STRING, { dateAdapter: DateAdapter })).toThrowError();
            }
          });

          // it('parses VCALENDAR_STRING', () => {
          //   expect(
          //     parseICal(VCALENDAR_STRING, MomentTZDateAdapter, {
          //       returnOptionsObjects: true,
          //     }),
          //   ).toEqual([
          //     {
          //       events: [],
          //       calendars: [
          //         {
          //           schedules: [
          //             {
          //               rrules: [],
          //               exrules: [],
          //               rdates: [dateAdapter(2018, 9, 10, 11, 0, 0)],
          //               exdates: [],
          //               data: {
          //                 iCalendar: [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T11:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T11:30:00',
          //                     ],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '3j14596us9ojbeke2d0mr82mob@google.com'],
          //                     [
          //                       'recurrence-id',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T10:00:00',
          //                     ],
          //                     ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:12:34Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 1],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     [
          //                       'summary',
          //                       {},
          //                       'text',
          //                       'Event repeating weekly on a Wednesday at 11am',
          //                     ],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               },
          //             },
          //             {
          //               rrules: [],
          //               exrules: [],
          //               rdates: [dateAdapter(2018, 9, 11, 12, 0, 0)],
          //               exdates: [],
          //               data: {
          //                 iCalendar: [
          //                   'vevent',
          //                   [
          //                     ['dtstart', {}, 'date-time', '2018-10-11T12:00:00Z'],
          //                     ['dtend', {}, 'date-time', '2018-10-11T12:30:00Z'],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '1402esp2cdk8pq3134vgg4famo@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:08:27Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:12:27Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 1],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Single event on 11th October'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               },
          //             },
          //             {
          //               rrules: [
          //                 {
          //                   frequency: 'WEEKLY',
          //                   start: dateAdapter(2018, 9, 10, 10, 0, 0),
          //                   byDayOfWeek: ['WE'],
          //                 },
          //               ],
          //               exrules: [],
          //               rdates: [dateAdapter(2018, 9, 10, 10, 0, 0)],
          //               exdates: [],
          //               data: {
          //                 iCalendar: [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T10:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T10:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'WE' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '3j14596us9ojbeke2d0mr82mob@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     [
          //                       'summary',
          //                       {},
          //                       'text',
          //                       'Event repeating weekly on a Wednesday at 11am',
          //                     ],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               },
          //             },
          //             {
          //               rrules: [
          //                 {
          //                   frequency: 'MONTHLY',
          //                   start: dateAdapter(2018, 9, 9, 10, 0, 0),
          //                   byDayOfWeek: [['TU', 2]],
          //                 },
          //               ],
          //               exrules: [],
          //               rdates: [dateAdapter(2018, 9, 9, 10, 0, 0)],
          //               exdates: [],
          //               data: {
          //                 iCalendar: [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-09T10:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-09T10:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'MONTHLY', byday: '2TU' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '608sq47akt79igo6qu3175lb71@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:10:46Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:10:46Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     [
          //                       'summary',
          //                       {},
          //                       'text',
          //                       'Event repeating monthly on 2nd tuesday at 10am',
          //                     ],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               },
          //             },
          //             {
          //               rrules: [
          //                 {
          //                   frequency: 'WEEKLY',
          //                   start: dateAdapter(2018, 9, 8, 10, 0, 0),
          //                   byDayOfWeek: ['MO'],
          //                 },
          //               ],
          //               exrules: [],
          //               rdates: [dateAdapter(2018, 9, 8, 10, 0, 0)],
          //               exdates: [],
          //               data: {
          //                 iCalendar: [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T10:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T10:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'MO' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '595ippl4ti0denhj174asq1qn5@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:10:14Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:10:14Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Event repeating weekly at 10am on Monday'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               },
          //             },
          //             {
          //               rrules: [
          //                 {
          //                   frequency: 'DAILY',
          //                   start: dateAdapter(2018, 9, 8, 9, 0, 0),
          //                 },
          //               ],
          //               exrules: [],
          //               rdates: [dateAdapter(2018, 9, 8, 9, 0, 0)],
          //               exdates: [],
          //               data: {
          //                 iCalendar: [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T09:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T09:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'DAILY' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '31k86s3g7aim1hp6og8kvuuvh9@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:09:47Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Event repeating Daily at 9am'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               },
          //             },
          //             {
          //               rrules: [],
          //               exrules: [],
          //               rdates: [dateAdapter(2018, 9, 7, 9, 0, 0)],
          //               exdates: [],
          //               data: {
          //                 iCalendar: [
          //                   'vevent',
          //                   [
          //                     ['dtstart', {}, 'date-time', '2018-10-07T09:00:00Z'],
          //                     ['dtend', {}, 'date-time', '2018-10-07T09:30:00Z'],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '7ft0gsg6a9i4u5ukhfo6troduo@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:08:43Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:08:43Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Single event on 7th october'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               },
          //             },
          //           ],
          //           data: {
          //             iCalendar: [
          //               'vcalendar',
          //               [
          //                 ['prodid', {}, 'text', '-//Google Inc//Google Calendar 70.9054//EN'],
          //                 ['version', {}, 'text', '2.0'],
          //                 ['calscale', {}, 'text', 'GREGORIAN'],
          //                 ['method', {}, 'text', 'PUBLISH'],
          //                 ['x-wr-calname', {}, 'unknown', 'ical rrule test'],
          //                 ['x-wr-timezone', {}, 'unknown', 'Europe/London'],
          //                 [
          //                   'x-wr-caldesc',
          //                   {},
          //                   'unknown',
          //                   'This is to test the rrule settings of a calendar',
          //                 ],
          //               ],
          //               [
          //                 [
          //                   'vtimezone',
          //                   [
          //                     ['tzid', {}, 'text', 'Europe/London'],
          //                     ['x-lic-location', {}, 'unknown', 'Europe/London'],
          //                   ],
          //                   [
          //                     [
          //                       'daylight',
          //                       [
          //                         ['tzoffsetfrom', {}, 'utc-offset', '+00:00'],
          //                         ['tzoffsetto', {}, 'utc-offset', '+01:00'],
          //                         ['tzname', {}, 'text', 'BST'],
          //                         ['dtstart', {}, 'date-time', '1970-03-29T01:00:00'],
          //                         [
          //                           'rrule',
          //                           {},
          //                           'recur',
          //                           { freq: 'YEARLY', bymonth: 3, byday: '-1SU' },
          //                         ],
          //                       ],
          //                       [],
          //                     ],
          //                     [
          //                       'standard',
          //                       [
          //                         ['tzoffsetfrom', {}, 'utc-offset', '+01:00'],
          //                         ['tzoffsetto', {}, 'utc-offset', '+00:00'],
          //                         ['tzname', {}, 'text', 'GMT'],
          //                         ['dtstart', {}, 'date-time', '1970-10-25T02:00:00'],
          //                         [
          //                           'rrule',
          //                           {},
          //                           'recur',
          //                           { freq: 'YEARLY', bymonth: 10, byday: '-1SU' },
          //                         ],
          //                       ],
          //                       [],
          //                     ],
          //                   ],
          //                 ],
          //                 [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T11:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T11:30:00',
          //                     ],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '3j14596us9ojbeke2d0mr82mob@google.com'],
          //                     [
          //                       'recurrence-id',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T10:00:00',
          //                     ],
          //                     ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:12:34Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 1],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     [
          //                       'summary',
          //                       {},
          //                       'text',
          //                       'Event repeating weekly on a Wednesday at 11am',
          //                     ],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //                 [
          //                   'vevent',
          //                   [
          //                     ['dtstart', {}, 'date-time', '2018-10-11T12:00:00Z'],
          //                     ['dtend', {}, 'date-time', '2018-10-11T12:30:00Z'],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '1402esp2cdk8pq3134vgg4famo@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:08:27Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:12:27Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 1],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Single event on 11th October'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //                 [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T10:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-10T10:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'WE' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '3j14596us9ojbeke2d0mr82mob@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     [
          //                       'summary',
          //                       {},
          //                       'text',
          //                       'Event repeating weekly on a Wednesday at 11am',
          //                     ],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //                 [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-09T10:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-09T10:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'MONTHLY', byday: '2TU' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '608sq47akt79igo6qu3175lb71@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:10:46Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:10:46Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     [
          //                       'summary',
          //                       {},
          //                       'text',
          //                       'Event repeating monthly on 2nd tuesday at 10am',
          //                     ],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //                 [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T10:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T10:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'MO' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '595ippl4ti0denhj174asq1qn5@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:10:14Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:10:14Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Event repeating weekly at 10am on Monday'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //                 [
          //                   'vevent',
          //                   [
          //                     [
          //                       'dtstart',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T09:00:00',
          //                     ],
          //                     [
          //                       'dtend',
          //                       { tzid: 'Europe/London' },
          //                       'date-time',
          //                       '2018-10-08T09:30:00',
          //                     ],
          //                     ['rrule', {}, 'recur', { freq: 'DAILY' }],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '31k86s3g7aim1hp6og8kvuuvh9@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:09:47Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Event repeating Daily at 9am'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //                 [
          //                   'vevent',
          //                   [
          //                     ['dtstart', {}, 'date-time', '2018-10-07T09:00:00Z'],
          //                     ['dtend', {}, 'date-time', '2018-10-07T09:30:00Z'],
          //                     ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                     ['uid', {}, 'text', '7ft0gsg6a9i4u5ukhfo6troduo@google.com'],
          //                     ['created', {}, 'date-time', '2018-10-08T12:08:43Z'],
          //                     ['description', {}, 'text', ''],
          //                     ['last-modified', {}, 'date-time', '2018-10-08T12:08:43Z'],
          //                     ['location', {}, 'text', ''],
          //                     ['sequence', {}, 'integer', 0],
          //                     ['status', {}, 'text', 'CONFIRMED'],
          //                     ['summary', {}, 'text', 'Single event on 7th october'],
          //                     ['transp', {}, 'text', 'OPAQUE'],
          //                   ],
          //                   [],
          //                 ],
          //               ],
          //             ],
          //           },
          //         },
          //       ],
          //       iCalendar: [
          //         [
          //           'vcalendar',
          //           [
          //             ['prodid', {}, 'text', '-//Google Inc//Google Calendar 70.9054//EN'],
          //             ['version', {}, 'text', '2.0'],
          //             ['calscale', {}, 'text', 'GREGORIAN'],
          //             ['method', {}, 'text', 'PUBLISH'],
          //             ['x-wr-calname', {}, 'unknown', 'ical rrule test'],
          //             ['x-wr-timezone', {}, 'unknown', 'Europe/London'],
          //             [
          //               'x-wr-caldesc',
          //               {},
          //               'unknown',
          //               'This is to test the rrule settings of a calendar',
          //             ],
          //           ],
          //           [
          //             [
          //               'vtimezone',
          //               [
          //                 ['tzid', {}, 'text', 'Europe/London'],
          //                 ['x-lic-location', {}, 'unknown', 'Europe/London'],
          //               ],
          //               [
          //                 [
          //                   'daylight',
          //                   [
          //                     ['tzoffsetfrom', {}, 'utc-offset', '+00:00'],
          //                     ['tzoffsetto', {}, 'utc-offset', '+01:00'],
          //                     ['tzname', {}, 'text', 'BST'],
          //                     ['dtstart', {}, 'date-time', '1970-03-29T01:00:00'],
          //                     ['rrule', {}, 'recur', { freq: 'YEARLY', bymonth: 3, byday: '-1SU' }],
          //                   ],
          //                   [],
          //                 ],
          //                 [
          //                   'standard',
          //                   [
          //                     ['tzoffsetfrom', {}, 'utc-offset', '+01:00'],
          //                     ['tzoffsetto', {}, 'utc-offset', '+00:00'],
          //                     ['tzname', {}, 'text', 'GMT'],
          //                     ['dtstart', {}, 'date-time', '1970-10-25T02:00:00'],
          //                     [
          //                       'rrule',
          //                       {},
          //                       'recur',
          //                       { freq: 'YEARLY', bymonth: 10, byday: '-1SU' },
          //                     ],
          //                   ],
          //                   [],
          //                 ],
          //               ],
          //             ],
          //             [
          //               'vevent',
          //               [
          //                 [
          //                   'dtstart',
          //                   { tzid: 'Europe/London' },
          //                   'date-time',
          //                   '2018-10-10T11:00:00',
          //                 ],
          //                 ['dtend', { tzid: 'Europe/London' }, 'date-time', '2018-10-10T11:30:00'],
          //                 ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                 ['uid', {}, 'text', '3j14596us9ojbeke2d0mr82mob@google.com'],
          //                 [
          //                   'recurrence-id',
          //                   { tzid: 'Europe/London' },
          //                   'date-time',
          //                   '2018-10-10T10:00:00',
          //                 ],
          //                 ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                 ['description', {}, 'text', ''],
          //                 ['last-modified', {}, 'date-time', '2018-10-08T12:12:34Z'],
          //                 ['location', {}, 'text', ''],
          //                 ['sequence', {}, 'integer', 1],
          //                 ['status', {}, 'text', 'CONFIRMED'],
          //                 ['summary', {}, 'text', 'Event repeating weekly on a Wednesday at 11am'],
          //                 ['transp', {}, 'text', 'OPAQUE'],
          //               ],
          //               [],
          //             ],
          //             [
          //               'vevent',
          //               [
          //                 ['dtstart', {}, 'date-time', '2018-10-11T12:00:00Z'],
          //                 ['dtend', {}, 'date-time', '2018-10-11T12:30:00Z'],
          //                 ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                 ['uid', {}, 'text', '1402esp2cdk8pq3134vgg4famo@google.com'],
          //                 ['created', {}, 'date-time', '2018-10-08T12:08:27Z'],
          //                 ['description', {}, 'text', ''],
          //                 ['last-modified', {}, 'date-time', '2018-10-08T12:12:27Z'],
          //                 ['location', {}, 'text', ''],
          //                 ['sequence', {}, 'integer', 1],
          //                 ['status', {}, 'text', 'CONFIRMED'],
          //                 ['summary', {}, 'text', 'Single event on 11th October'],
          //                 ['transp', {}, 'text', 'OPAQUE'],
          //               ],
          //               [],
          //             ],
          //             [
          //               'vevent',
          //               [
          //                 [
          //                   'dtstart',
          //                   { tzid: 'Europe/London' },
          //                   'date-time',
          //                   '2018-10-10T10:00:00',
          //                 ],
          //                 ['dtend', { tzid: 'Europe/London' }, 'date-time', '2018-10-10T10:30:00'],
          //                 ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'WE' }],
          //                 ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                 ['uid', {}, 'text', '3j14596us9ojbeke2d0mr82mob@google.com'],
          //                 ['created', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                 ['description', {}, 'text', ''],
          //                 ['last-modified', {}, 'date-time', '2018-10-08T12:12:12Z'],
          //                 ['location', {}, 'text', ''],
          //                 ['sequence', {}, 'integer', 0],
          //                 ['status', {}, 'text', 'CONFIRMED'],
          //                 ['summary', {}, 'text', 'Event repeating weekly on a Wednesday at 11am'],
          //                 ['transp', {}, 'text', 'OPAQUE'],
          //               ],
          //               [],
          //             ],
          //             [
          //               'vevent',
          //               [
          //                 [
          //                   'dtstart',
          //                   { tzid: 'Europe/London' },
          //                   'date-time',
          //                   '2018-10-09T10:00:00',
          //                 ],
          //                 ['dtend', { tzid: 'Europe/London' }, 'date-time', '2018-10-09T10:30:00'],
          //                 ['rrule', {}, 'recur', { freq: 'MONTHLY', byday: '2TU' }],
          //                 ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                 ['uid', {}, 'text', '608sq47akt79igo6qu3175lb71@google.com'],
          //                 ['created', {}, 'date-time', '2018-10-08T12:10:46Z'],
          //                 ['description', {}, 'text', ''],
          //                 ['last-modified', {}, 'date-time', '2018-10-08T12:10:46Z'],
          //                 ['location', {}, 'text', ''],
          //                 ['sequence', {}, 'integer', 0],
          //                 ['status', {}, 'text', 'CONFIRMED'],
          //                 ['summary', {}, 'text', 'Event repeating monthly on 2nd tuesday at 10am'],
          //                 ['transp', {}, 'text', 'OPAQUE'],
          //               ],
          //               [],
          //             ],
          //             [
          //               'vevent',
          //               [
          //                 [
          //                   'dtstart',
          //                   { tzid: 'Europe/London' },
          //                   'date-time',
          //                   '2018-10-08T10:00:00',
          //                 ],
          //                 ['dtend', { tzid: 'Europe/London' }, 'date-time', '2018-10-08T10:30:00'],
          //                 ['rrule', {}, 'recur', { freq: 'WEEKLY', byday: 'MO' }],
          //                 ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                 ['uid', {}, 'text', '595ippl4ti0denhj174asq1qn5@google.com'],
          //                 ['created', {}, 'date-time', '2018-10-08T12:10:14Z'],
          //                 ['description', {}, 'text', ''],
          //                 ['last-modified', {}, 'date-time', '2018-10-08T12:10:14Z'],
          //                 ['location', {}, 'text', ''],
          //                 ['sequence', {}, 'integer', 0],
          //                 ['status', {}, 'text', 'CONFIRMED'],
          //                 ['summary', {}, 'text', 'Event repeating weekly at 10am on Monday'],
          //                 ['transp', {}, 'text', 'OPAQUE'],
          //               ],
          //               [],
          //             ],
          //             [
          //               'vevent',
          //               [
          //                 [
          //                   'dtstart',
          //                   { tzid: 'Europe/London' },
          //                   'date-time',
          //                   '2018-10-08T09:00:00',
          //                 ],
          //                 ['dtend', { tzid: 'Europe/London' }, 'date-time', '2018-10-08T09:30:00'],
          //                 ['rrule', {}, 'recur', { freq: 'DAILY' }],
          //                 ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                 ['uid', {}, 'text', '31k86s3g7aim1hp6og8kvuuvh9@google.com'],
          //                 ['created', {}, 'date-time', '2018-10-08T12:09:47Z'],
          //                 ['description', {}, 'text', ''],
          //                 ['last-modified', {}, 'date-time', '2018-10-08T12:09:47Z'],
          //                 ['location', {}, 'text', ''],
          //                 ['sequence', {}, 'integer', 0],
          //                 ['status', {}, 'text', 'CONFIRMED'],
          //                 ['summary', {}, 'text', 'Event repeating Daily at 9am'],
          //                 ['transp', {}, 'text', 'OPAQUE'],
          //               ],
          //               [],
          //             ],
          //             [
          //               'vevent',
          //               [
          //                 ['dtstart', {}, 'date-time', '2018-10-07T09:00:00Z'],
          //                 ['dtend', {}, 'date-time', '2018-10-07T09:30:00Z'],
          //                 ['dtstamp', {}, 'date-time', '2018-10-10T13:44:44Z'],
          //                 ['uid', {}, 'text', '7ft0gsg6a9i4u5ukhfo6troduo@google.com'],
          //                 ['created', {}, 'date-time', '2018-10-08T12:08:43Z'],
          //                 ['description', {}, 'text', ''],
          //                 ['last-modified', {}, 'date-time', '2018-10-08T12:08:43Z'],
          //                 ['location', {}, 'text', ''],
          //                 ['sequence', {}, 'integer', 0],
          //                 ['status', {}, 'text', 'CONFIRMED'],
          //                 ['summary', {}, 'text', 'Single event on 7th october'],
          //                 ['transp', {}, 'text', 'OPAQUE'],
          //               ],
          //               [],
          //             ],
          //           ],
          //         ],
          //       ],
          //     },
          //   ]);
          // });

          it('handles INVALID_STRING_ONE', () => {
            expect(() => parseICal(INVALID_STRING_ONE, { dateAdapter: DateAdapter })).toThrowError(
              `invalid line (no token ";" or ":") "Dced34xdio"`,
            );
          });

          it('handles INVALID_STRING_TWO', () => {
            expect(() => parseICal(INVALID_STRING_TWO, { dateAdapter: DateAdapter })).toThrowError(
              `Invalid VEVENT component: "DTSTART" property missing.`,
            );
          });

          it('handles INVALID_STRING_THREE', () => {
            expect(parseICal(INVALID_STRING_THREE, { dateAdapter: DateAdapter })).toEqual({
              jCal: [],
              iCal: INVALID_STRING_THREE,
              vEvents: [],
            });
          });

          it('handles INVALID_STRING_FOUR', () => {
            expect(parseICal(INVALID_STRING_FOUR, { dateAdapter: DateAdapter })).toEqual({
              jCal: [],
              iCal: INVALID_STRING_FOUR,
              vEvents: [],
            });
          });

          it('handles INVALID_STRING_FIVE', () => {
            expect(() => parseICal(INVALID_STRING_FIVE, { dateAdapter: DateAdapter })).toThrowError(
              `invalid line (no token ";" or ":") "dfDDDdveajdfdoih3289hxfd"`,
            );
          });

          it('handles INVALID_STRING_SIX', () => {
            expect(() => parseICal(INVALID_STRING_SIX, { dateAdapter: DateAdapter })).toThrowError(
              `Invalid parameters in 'dfDDDdve;ajdfdoih3289hxfd'`,
            );
          });
        });

        describe('deserializes | serializes | deserializes', () => {
          const icalLocal = [
            'BEGIN:VEVENT',
            'DTSTART:20101010T000000',
            'RRULE:FREQ=DAILY',
            'RDATE:20101010T000000',
            'END:VEVENT',
          ]
            .join('\n')
            .concat('\n');

          it('local', () => {
            const parsed = parseICal(icalLocal, { dateAdapter: DateAdapter }).vEvents[0] as VEvent<
              typeof DateAdapter
            >;

            const serialized = serializeToICal(parsed);

            expect(serialized).toBe(icalLocal);
          });

          const icalNewYork = [
            'BEGIN:VEVENT',
            'DTSTART;TZID=America/New_York:20101010T000000',
            'RRULE:FREQ=DAILY',
            'RDATE;TZID=America/New_York:20101010T000000',
            'END:VEVENT',
          ]
            .join('\n')
            .concat('\n');

          it('America/New_York', () => {
            if (DateAdapter.hasTimezoneSupport) {
              const parsed = parseICal(icalNewYork, { dateAdapter: DateAdapter })
                .vEvents[0] as VEvent<typeof DateAdapter>;

              const serialized = serializeToICal(parsed);

              expect(serialized).toBe(icalNewYork);
            } else {
              expect(() => parseICal(icalNewYork, { dateAdapter: DateAdapter })).toThrowError();
            }
          });
        });

        it('serializes and deserializes Schedule to VEVENT', () => {
          const now = dateAdapter(2010, 10, 10, 7);

          const schedule = new VEvent({
            start: now,
            rrules: [
              {
                frequency: 'DAILY',
                count: 3,
                byHourOfDay: [7, 16],
              },
            ],
            rdates: [dateAdapter(2010, 10, 11, 0)],
            dateAdapter: DateAdapter,
          });

          const ical = [
            'BEGIN:VEVENT',
            null,
            'RRULE:FREQ=DAILY;COUNT=3;BYHOUR=7,16',
            null,
            'END:VEVENT',
          ];

          if (timezone === 'UTC') {
            ical[1] = 'DTSTART:20101010T070000Z';
            ical[3] = 'RDATE:20101011T000000Z';
          } else if (timezone === null) {
            ical[1] = 'DTSTART:20101010T070000';
            ical[3] = 'RDATE:20101011T000000';
          } else {
            ical[1] = `DTSTART;TZID=${timezone}:20101010T070000`;
            ical[3] = `RDATE;TZID=${timezone}:20101011T000000`;
          }

          const serialized = serializeToICal(schedule);

          expect(serialized).toBe(ical.join('\n').concat('\n'));
        });
      });
    });
  });
});

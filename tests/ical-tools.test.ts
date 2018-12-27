import { parseICalString } from '../packages/ical-tools';

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

describe('parseICalString()', () => {
  it('parses RRULE_STRING', () => {
    expect(parseICalString(RRULE_STRING)).toEqual({
      componentName: 'ROOT',
      DTSTART: [
        {
          propertyName: 'DTSTART',
          propertyValue: '19970902T090000',
          TZID: 'America/New_York',
        },
      ],
      RRULE: [
        {
          propertyName: 'RRULE',
          propertyValue:
            'FREQ=YEARLY;UNTIL=20000131T140000Z;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA',
        },
      ],
    });
  });

  it('parses RRULE_STRING_TWO', () => {
    expect(parseICalString(RRULE_STRING_TWO)).toEqual({
      componentName: 'ROOT',
      DTSTART: [
        {
          propertyName: 'DTSTART',
          propertyValue: '19970902T090000',
        },
      ],
      RRULE: [
        {
          propertyName: 'RRULE',
          propertyValue:
            'FREQ=WEEKLY;UNTIL=19971007T000000Z;WKST=SU;BYDAY=TU,TH',
        },
      ],
      RDATE: [
        {
          propertyName: 'RDATE',
          propertyValue: '19970714T123000Z',
        },
        {
          propertyName: 'RDATE',
          propertyValue: '19970714T123000Z',
        },
      ],
      EXDATE: [
        {
          propertyName: 'EXDATE',
          propertyValue: '19970714T123000Z',
        },
      ],
    });
  });

  it('parses VEVENT_STRING', () => {
    expect(parseICalString(VEVENT_STRING)).toEqual({
      componentName: 'ROOT',
      BEGIN: [
        {
          componentName: 'VEVENT',
          RRULE: [
            {
              propertyName: 'RRULE',
              propertyValue: 'FREQ=DAILY',
            },
          ],
          DTSTART: [
            {
              propertyName: 'DTSTART',
              propertyValue: '20181008T090000',
              TZID: 'Europe/London',
            },
          ],
          DTEND: [
            {
              propertyName: 'DTEND',
              propertyValue: '20181008T093000',
              TZID: 'Europe/London',
            },
          ],
          DTSTAMP: [
            {
              propertyName: 'DTSTAMP',
              propertyValue: '20181010T134444Z',
            },
          ],
          UID: [
            {
              propertyName: 'UID',
              propertyValue: '31k86s3g7aim1hp6og8kvuuvh9@google.com',
            },
          ],
          CREATED: [
            {
              propertyName: 'CREATED',
              propertyValue: '20181008T120947Z',
            },
          ],
          DESCRIPTION: [
            {
              propertyName: 'DESCRIPTION',
              propertyValue: '',
            },
          ],
          'LAST-MODIFIED': [
            {
              propertyName: 'LAST-MODIFIED',
              propertyValue: '20181008T120947Z',
            },
          ],
          LOCATION: [
            {
              propertyName: 'LOCATION',
              propertyValue: '',
            },
          ],
          SEQUENCE: [
            {
              propertyName: 'SEQUENCE',
              propertyValue: '0',
            },
          ],
          STATUS: [
            {
              propertyName: 'STATUS',
              propertyValue: 'CONFIRMED',
            },
          ],
          SUMMARY: [
            {
              propertyName: 'SUMMARY',
              propertyValue: 'Event repeating Daily at 9am',
            },
          ],
          TRANSP: [
            {
              propertyName: 'TRANSP',
              propertyValue: 'OPAQUE',
            },
          ],
        },
      ],
    });
  });

  it('parses VCALENDAR_STRING', () => {
    expect(parseICalString(VCALENDAR_STRING)).toEqual({
      componentName: 'ROOT',
      BEGIN: [
        {
          componentName: 'VCALENDAR',
          PRODID: [
            {
              propertyName: 'PRODID',
              propertyValue: '-//Google Inc//Google Calendar 70.9054//EN',
            },
          ],
          VERSION: [
            {
              propertyName: 'VERSION',
              propertyValue: '2.0',
            },
          ],
          CALSCALE: [
            {
              propertyName: 'CALSCALE',
              propertyValue: 'GREGORIAN',
            },
          ],
          METHOD: [
            {
              propertyName: 'METHOD',
              propertyValue: 'PUBLISH',
            },
          ],
          'X-WR-CALNAME': [
            {
              propertyName: 'X-WR-CALNAME',
              propertyValue: 'ical rrule test',
            },
          ],
          'X-WR-TIMEZONE': [
            {
              propertyName: 'X-WR-TIMEZONE',
              propertyValue: 'Europe/London',
            },
          ],
          'X-WR-CALDESC': [
            {
              propertyName: 'X-WR-CALDESC',
              propertyValue: 'This is to test the rrule settings of a calendar',
            },
          ],
          BEGIN: [
            {
              componentName: 'VTIMEZONE',
              TZID: [
                {
                  propertyName: 'TZID',
                  propertyValue: 'Europe/London',
                },
              ],
              'X-LIC-LOCATION': [
                {
                  propertyName: 'X-LIC-LOCATION',
                  propertyValue: 'Europe/London',
                },
              ],
              BEGIN: [
                {
                  componentName: 'DAYLIGHT',
                  RRULE: [
                    {
                      propertyName: 'RRULE',
                      propertyValue: 'FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
                    },
                  ],
                  TZOFFSETFROM: [
                    {
                      propertyName: 'TZOFFSETFROM',
                      propertyValue: '+0000',
                    },
                  ],
                  TZOFFSETTO: [
                    {
                      propertyName: 'TZOFFSETTO',
                      propertyValue: '+0100',
                    },
                  ],
                  TZNAME: [
                    {
                      propertyName: 'TZNAME',
                      propertyValue: 'BST',
                    },
                  ],
                  DTSTART: [
                    {
                      propertyName: 'DTSTART',
                      propertyValue: '19700329T010000',
                    },
                  ],
                },
                {
                  componentName: 'STANDARD',
                  TZOFFSETFROM: [
                    {
                      propertyName: 'TZOFFSETFROM',
                      propertyValue: '+0100',
                    },
                  ],
                  TZOFFSETTO: [
                    {
                      propertyName: 'TZOFFSETTO',
                      propertyValue: '+0000',
                    },
                  ],
                  TZNAME: [
                    {
                      propertyName: 'TZNAME',
                      propertyValue: 'GMT',
                    },
                  ],
                  DTSTART: [
                    {
                      propertyName: 'DTSTART',
                      propertyValue: '19701025T020000',
                    },
                  ],
                  RRULE: [
                    {
                      propertyName: 'RRULE',
                      propertyValue: 'FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
                    },
                  ],
                },
              ],
            },
            {
              componentName: 'VEVENT',
              DTSTART: [
                {
                  propertyName: 'DTSTART',
                  propertyValue: '20181010T110000',
                  TZID: 'Europe/London',
                },
              ],
              DTEND: [
                {
                  propertyName: 'DTEND',
                  propertyValue: '20181010T113000',
                  TZID: 'Europe/London',
                },
              ],
              DTSTAMP: [
                {
                  propertyName: 'DTSTAMP',
                  propertyValue: '20181010T134444Z',
                },
              ],
              UID: [
                {
                  propertyName: 'UID',
                  propertyValue: '3j14596us9ojbeke2d0mr82mob@google.com',
                },
              ],
              'RECURRENCE-ID': [
                {
                  propertyName: 'RECURRENCE-ID',
                  propertyValue: '20181010T100000',
                  TZID: 'Europe/London',
                },
              ],
              CREATED: [
                {
                  propertyName: 'CREATED',
                  propertyValue: '20181008T121212Z',
                },
              ],
              DESCRIPTION: [
                {
                  propertyName: 'DESCRIPTION',
                  propertyValue: '',
                },
              ],
              'LAST-MODIFIED': [
                {
                  propertyName: 'LAST-MODIFIED',
                  propertyValue: '20181008T121234Z',
                },
              ],
              LOCATION: [
                {
                  propertyName: 'LOCATION',
                  propertyValue: '',
                },
              ],
              SEQUENCE: [
                {
                  propertyName: 'SEQUENCE',
                  propertyValue: '1',
                },
              ],
              SUMMARY: [
                {
                  propertyName: 'SUMMARY',
                  propertyValue:
                    'Event repeating weekly on a Wednesday at 11am',
                },
              ],
              TRANSP: [
                {
                  propertyName: 'TRANSP',
                  propertyValue: 'OPAQUE',
                },
              ],
              STATUS: [
                {
                  propertyName: 'STATUS',
                  propertyValue: 'CONFIRMED',
                },
              ],
            },
            {
              componentName: 'VEVENT',
              DTSTART: [
                {
                  propertyName: 'DTSTART',
                  propertyValue: '20181011T120000Z',
                },
              ],
              DTEND: [
                {
                  propertyName: 'DTEND',
                  propertyValue: '20181011T123000Z',
                },
              ],
              DTSTAMP: [
                {
                  propertyName: 'DTSTAMP',
                  propertyValue: '20181010T134444Z',
                },
              ],
              UID: [
                {
                  propertyName: 'UID',
                  propertyValue: '1402esp2cdk8pq3134vgg4famo@google.com',
                },
              ],
              CREATED: [
                {
                  propertyName: 'CREATED',
                  propertyValue: '20181008T120827Z',
                },
              ],
              DESCRIPTION: [
                {
                  propertyName: 'DESCRIPTION',
                  propertyValue: '',
                },
              ],
              'LAST-MODIFIED': [
                {
                  propertyName: 'LAST-MODIFIED',
                  propertyValue: '20181008T121227Z',
                },
              ],
              LOCATION: [
                {
                  propertyName: 'LOCATION',
                  propertyValue: '',
                },
              ],
              SEQUENCE: [
                {
                  propertyName: 'SEQUENCE',
                  propertyValue: '1',
                },
              ],
              SUMMARY: [
                {
                  propertyName: 'SUMMARY',
                  propertyValue: 'Single event on 11th October',
                },
              ],
              TRANSP: [
                {
                  propertyName: 'TRANSP',
                  propertyValue: 'OPAQUE',
                },
              ],
              STATUS: [
                {
                  propertyName: 'STATUS',
                  propertyValue: 'CONFIRMED',
                },
              ],
            },
            {
              componentName: 'VEVENT',
              DTSTART: [
                {
                  propertyName: 'DTSTART',
                  propertyValue: '20181010T100000',
                  TZID: 'Europe/London',
                },
              ],
              DTEND: [
                {
                  propertyName: 'DTEND',
                  propertyValue: '20181010T103000',
                  TZID: 'Europe/London',
                },
              ],
              RRULE: [
                {
                  propertyName: 'RRULE',
                  propertyValue: 'FREQ=WEEKLY;BYDAY=WE',
                },
              ],
              DTSTAMP: [
                {
                  propertyName: 'DTSTAMP',
                  propertyValue: '20181010T134444Z',
                },
              ],
              UID: [
                {
                  propertyName: 'UID',
                  propertyValue: '3j14596us9ojbeke2d0mr82mob@google.com',
                },
              ],
              CREATED: [
                {
                  propertyName: 'CREATED',
                  propertyValue: '20181008T121212Z',
                },
              ],
              DESCRIPTION: [
                {
                  propertyName: 'DESCRIPTION',
                  propertyValue: '',
                },
              ],
              'LAST-MODIFIED': [
                {
                  propertyName: 'LAST-MODIFIED',
                  propertyValue: '20181008T121212Z',
                },
              ],
              LOCATION: [
                {
                  propertyName: 'LOCATION',
                  propertyValue: '',
                },
              ],
              SEQUENCE: [
                {
                  propertyName: 'SEQUENCE',
                  propertyValue: '0',
                },
              ],
              SUMMARY: [
                {
                  propertyName: 'SUMMARY',
                  propertyValue:
                    'Event repeating weekly on a Wednesday at 11am',
                },
              ],
              TRANSP: [
                {
                  propertyName: 'TRANSP',
                  propertyValue: 'OPAQUE',
                },
              ],
              STATUS: [
                {
                  propertyName: 'STATUS',
                  propertyValue: 'CONFIRMED',
                },
              ],
            },
            {
              componentName: 'VEVENT',
              DTSTART: [
                {
                  propertyName: 'DTSTART',
                  propertyValue: '20181009T100000',
                  TZID: 'Europe/London',
                },
              ],
              DTEND: [
                {
                  propertyName: 'DTEND',
                  propertyValue: '20181009T103000',
                  TZID: 'Europe/London',
                },
              ],
              RRULE: [
                {
                  propertyName: 'RRULE',
                  propertyValue: 'FREQ=MONTHLY;BYDAY=2TU',
                },
              ],
              DTSTAMP: [
                {
                  propertyName: 'DTSTAMP',
                  propertyValue: '20181010T134444Z',
                },
              ],
              UID: [
                {
                  propertyName: 'UID',
                  propertyValue: '608sq47akt79igo6qu3175lb71@google.com',
                },
              ],
              CREATED: [
                {
                  propertyName: 'CREATED',
                  propertyValue: '20181008T121046Z',
                },
              ],
              DESCRIPTION: [
                {
                  propertyName: 'DESCRIPTION',
                  propertyValue: '',
                },
              ],
              'LAST-MODIFIED': [
                {
                  propertyName: 'LAST-MODIFIED',
                  propertyValue: '20181008T121046Z',
                },
              ],
              LOCATION: [
                {
                  propertyName: 'LOCATION',
                  propertyValue: '',
                },
              ],
              SEQUENCE: [
                {
                  propertyName: 'SEQUENCE',
                  propertyValue: '0',
                },
              ],
              SUMMARY: [
                {
                  propertyName: 'SUMMARY',
                  propertyValue:
                    'Event repeating monthly on 2nd tuesday at 10am',
                },
              ],
              TRANSP: [
                {
                  propertyName: 'TRANSP',
                  propertyValue: 'OPAQUE',
                },
              ],
              STATUS: [
                {
                  propertyName: 'STATUS',
                  propertyValue: 'CONFIRMED',
                },
              ],
            },
            {
              componentName: 'VEVENT',
              DTSTART: [
                {
                  propertyName: 'DTSTART',
                  propertyValue: '20181008T100000',
                  TZID: 'Europe/London',
                },
              ],
              DTEND: [
                {
                  propertyName: 'DTEND',
                  propertyValue: '20181008T103000',
                  TZID: 'Europe/London',
                },
              ],
              RRULE: [
                {
                  propertyName: 'RRULE',
                  propertyValue: 'FREQ=WEEKLY;BYDAY=MO',
                },
              ],
              DTSTAMP: [
                {
                  propertyName: 'DTSTAMP',
                  propertyValue: '20181010T134444Z',
                },
              ],
              UID: [
                {
                  propertyName: 'UID',
                  propertyValue: '595ippl4ti0denhj174asq1qn5@google.com',
                },
              ],
              CREATED: [
                {
                  propertyName: 'CREATED',
                  propertyValue: '20181008T121014Z',
                },
              ],
              DESCRIPTION: [
                {
                  propertyName: 'DESCRIPTION',
                  propertyValue: '',
                },
              ],
              'LAST-MODIFIED': [
                {
                  propertyName: 'LAST-MODIFIED',
                  propertyValue: '20181008T121014Z',
                },
              ],
              LOCATION: [
                {
                  propertyName: 'LOCATION',
                  propertyValue: '',
                },
              ],
              SEQUENCE: [
                {
                  propertyName: 'SEQUENCE',
                  propertyValue: '0',
                },
              ],
              SUMMARY: [
                {
                  propertyName: 'SUMMARY',
                  propertyValue: 'Event repeating weekly at 10am on Monday',
                },
              ],
              TRANSP: [
                {
                  propertyName: 'TRANSP',
                  propertyValue: 'OPAQUE',
                },
              ],
              STATUS: [
                {
                  propertyName: 'STATUS',
                  propertyValue: 'CONFIRMED',
                },
              ],
            },
            {
              componentName: 'VEVENT',
              DTSTART: [
                {
                  propertyName: 'DTSTART',
                  propertyValue: '20181008T090000',
                  TZID: 'Europe/London',
                },
              ],
              DTEND: [
                {
                  propertyName: 'DTEND',
                  propertyValue: '20181008T093000',
                  TZID: 'Europe/London',
                },
              ],
              RRULE: [
                {
                  propertyName: 'RRULE',
                  propertyValue: 'FREQ=DAILY',
                },
              ],
              DTSTAMP: [
                {
                  propertyName: 'DTSTAMP',
                  propertyValue: '20181010T134444Z',
                },
              ],
              UID: [
                {
                  propertyName: 'UID',
                  propertyValue: '31k86s3g7aim1hp6og8kvuuvh9@google.com',
                },
              ],
              CREATED: [
                {
                  propertyName: 'CREATED',
                  propertyValue: '20181008T120947Z',
                },
              ],
              DESCRIPTION: [
                {
                  propertyName: 'DESCRIPTION',
                  propertyValue: '',
                },
              ],
              'LAST-MODIFIED': [
                {
                  propertyName: 'LAST-MODIFIED',
                  propertyValue: '20181008T120947Z',
                },
              ],
              LOCATION: [
                {
                  propertyName: 'LOCATION',
                  propertyValue: '',
                },
              ],
              SEQUENCE: [
                {
                  propertyName: 'SEQUENCE',
                  propertyValue: '0',
                },
              ],
              SUMMARY: [
                {
                  propertyName: 'SUMMARY',
                  propertyValue: 'Event repeating Daily at 9am',
                },
              ],
              TRANSP: [
                {
                  propertyName: 'TRANSP',
                  propertyValue: 'OPAQUE',
                },
              ],
              STATUS: [
                {
                  propertyName: 'STATUS',
                  propertyValue: 'CONFIRMED',
                },
              ],
            },
            {
              componentName: 'VEVENT',
              DTSTART: [
                {
                  propertyName: 'DTSTART',
                  propertyValue: '20181007T090000Z',
                },
              ],
              DTEND: [
                {
                  propertyName: 'DTEND',
                  propertyValue: '20181007T093000Z',
                },
              ],
              DTSTAMP: [
                {
                  propertyName: 'DTSTAMP',
                  propertyValue: '20181010T134444Z',
                },
              ],
              UID: [
                {
                  propertyName: 'UID',
                  propertyValue: '7ft0gsg6a9i4u5ukhfo6troduo@google.com',
                },
              ],
              CREATED: [
                {
                  propertyName: 'CREATED',
                  propertyValue: '20181008T120843Z',
                },
              ],
              DESCRIPTION: [
                {
                  propertyName: 'DESCRIPTION',
                  propertyValue: '',
                },
              ],
              'LAST-MODIFIED': [
                {
                  propertyName: 'LAST-MODIFIED',
                  propertyValue: '20181008T120843Z',
                },
              ],
              LOCATION: [
                {
                  propertyName: 'LOCATION',
                  propertyValue: '',
                },
              ],
              SEQUENCE: [
                {
                  propertyName: 'SEQUENCE',
                  propertyValue: '0',
                },
              ],
              SUMMARY: [
                {
                  propertyName: 'SUMMARY',
                  propertyValue: 'Single event on 7th october',
                },
              ],
              TRANSP: [
                {
                  propertyName: 'TRANSP',
                  propertyValue: 'OPAQUE',
                },
              ],
              STATUS: [
                {
                  propertyName: 'STATUS',
                  propertyValue: 'CONFIRMED',
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('handles INVALID_STRING_ONE', () => {
    expect(
      parseICalString(INVALID_STRING_ONE, { ignoreParsingErrors: true }),
    ).toEqual({
      componentName: 'ROOT',
    });
  });

  it('handles INVALID_STRING_TWO', () => {
    expect(
      parseICalString(INVALID_STRING_TWO, { ignoreParsingErrors: true }),
    ).toEqual({
      componentName: 'ROOT',
      DEINT: [
        {
          propertyName: 'DEINT',
          propertyValue: '34dfadlkn;cce',
        },
      ],
    });
  });

  it('handles INVALID_STRING_THREE', () => {
    expect(
      parseICalString(INVALID_STRING_THREE, { ignoreParsingErrors: true }),
    ).toEqual({
      componentName: 'ROOT',
    });
  });

  it('handles INVALID_STRING_FOUR', () => {
    expect(
      parseICalString(INVALID_STRING_FOUR, { ignoreParsingErrors: true }),
    ).toEqual({
      componentName: 'ROOT',
    });
  });

  it('handles INVALID_STRING_FIVE', () => {
    expect(
      parseICalString(INVALID_STRING_FIVE, { ignoreParsingErrors: true }),
    ).toEqual({
      componentName: 'ROOT',
      DTSTART: [
        {
          propertyName: 'DTSTART',
          propertyValue: '19970902T090000',
        },
      ],
    });
  });

  it('handles INVALID_STRING_SIX', () => {
    expect(
      parseICalString(INVALID_STRING_SIX, { ignoreParsingErrors: true }),
    ).toEqual({
      componentName: 'ROOT',
      DTSTART: [
        {
          propertyName: 'DTSTART',
          propertyValue: '19970902T090000',
        },
      ],
      DFADFNK: [
        {
          propertyName: 'DFADFNK',
          propertyValue: 'dfjoiaoice',
        },
      ],
    });
  });

  it('handles INVALID_STRING_ONE', () => {
    expect(() => parseICalString(INVALID_STRING_ONE)).toThrow();
  });

  it('handles INVALID_STRING_TWO', () => {
    expect(() => parseICalString(INVALID_STRING_TWO)).not.toThrow();
  });

  it('handles INVALID_STRING_THREE', () => {
    expect(() => parseICalString(INVALID_STRING_THREE)).not.toThrow();
  });

  it('handles INVALID_STRING_FOUR', () => {
    expect(() => parseICalString(INVALID_STRING_FOUR)).not.toThrow();
  });

  it('handles INVALID_STRING_FIVE', () => {
    expect(() => parseICalString(INVALID_STRING_FIVE)).toThrow();
  });

  it('handles INVALID_STRING_SIX', () => {
    expect(() => parseICalString(INVALID_STRING_SIX)).toThrow();
  });
});

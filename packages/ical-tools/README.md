# ical-tools

Utility functions for parsing iCalendar strings. Potentially useful for any recurring dates library.
Used by [rSchedule](https://gitlab.com/john.carroll.p/rschedule) for iCal support.

### Installation

```bash
yarn add @rschedule/ical-tools

# or

npm install @rschedule/ical-tools
```

## Usage

At the moment, one function is provided: `parseICalString(input: string, options?: {ignoreParsingErrors?: boolean})`. This function receives an iCalendar
string as an argument and returns a `ParsedICalString` object.

The `ParsedICalString` interface:

```typescript
interface ParsedICalString {
  [property: string]: ICalProperty[];
  componentName: string;
  BEGIN?: ParsedICalString[];
}

interface ICalProperty {
  [property: string]: string;
  propertyName: string;
  propertyValue: string;
}
```

In general, the iCAL spec defines an ical string as being divided into lines via linebrakes (`"\n"`).
Each line contains a property with zero or more parameters as well as a value. Properties are case-insensitive
but generally are all uppercase per convention (`parseICalString()` converts properties `toUpperCase()`).
Special `BEGIN` and `END` properties signal the start and end of an iCalendar component. Examples of
components are `"VCALENDAR"` and `"VEVENT"`. Components can have subcomponents. Components can have their
own properties. Usually, each property will only exist once per component, but not always.

`parseICalString()` converts the iCal string into a single nested component object. All top level properties
and components are added to a special `"ROOT"` component. Subcomponents of the root component are added to
a `"BEGIN"` property of the root component. Each property of a component is given an array value. This allows
for multiple properties of the same name to exist on a component (though, usually, all properties will equal an
array of length 1). Each component also has a special `componentName` property
with a single string value. The root component has `componentName: "ROOT"`. A `"VCALENDAR"` component has a
`componentName: "VCALENDAR"`. Etc.

`parseICalString()` does not validate the ICal string being parsed. For instance, the ical spec says that a
`VEVENT` component can only have one `DTSTART` property. If a string is passed to `parseICalString()` which
has a `VEVENT` component with two `DTSTART` properties, no error will be thrown. Instead, the returned
`ParsedICalString` object will have a `DTSTART` property equal to an array of length 2.

## Parsing Examples

```typescript
const ICAL_STRING =
`DTSTART;TZID=America/New_York:19970902T090000
RRULE:FREQ=YEARLY;UNTIL=20000131T140000Z;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA`;

parseICalString(ICAL_STRING) === {
  componentName: 'ROOT',
  DTSTART: [{
    propertyName: 'DTSTART',
    propertyValue: '19970902T090000',
    TZID: 'America/New_York',
  }],
  RRULE: [{
    propertyName: 'RRULE',
    propertyValue: 'FREQ=YEARLY;UNTIL=20000131T140000Z;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA',
  }]
}
```

```typescript
const VEVENT_STRING =
`BEGIN:VEVENT
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

parseICalString(ICAL_STRING) === {
  componentName: 'ROOT',
  BEGIN: [{
    componentName: 'VEVENT',
    RRULE: [{
      propertyName: 'RRULE',
      propertyValue: 'FREQ=DAILY',
    }],
    DTSTART: [{
      propertyName: 'DTSTART',
      propertyValue: '20181008T090000',
      TZID: 'Europe/London',
    }],
    DTEND: [{
      propertyName: 'DTEND',
      propertyValue: '20181008T093000',
      TZID: 'Europe/London',
    }],
    DTSTAMP: [{
      propertyName: 'DTSTAMP',
      propertyValue: '20181010T134444Z',
    }],
    UID: [{
      propertyName: 'UID',
      propertyValue: '31k86s3g7aim1hp6og8kvuuvh9@google.com',
    }],
    CREATED: [{
      propertyName: 'CREATED',
      propertyValue: '20181008T120947Z',
    }],
    DESCRIPTION: [{
      propertyName: 'DESCRIPTION',
      propertyValue: '',
    }],
    "LAST-MODIFIED": [{
      propertyName: 'LAST-MODIFIED',
      propertyValue: '20181008T120947Z',
    }],
    LOCATION: [{
      propertyName: 'LOCATION',
      propertyValue: '',
    }],
    SEQUENCE: [{
      propertyName: 'SEQUENCE',
      propertyValue: '0',
    }],
    STATUS: [{
      propertyName: 'STATUS',
      propertyValue: 'CONFIRMED',
    }],
    SUMMARY: [{
      propertyName: 'SUMMARY',
      propertyValue: 'Event repeating Daily at 9am',
    }],
    TRANSP: [{
      propertyName: 'TRANSP',
      propertyValue: 'OPAQUE',
    }],
  }],
}
```

You can look at the `parseICalString()` unit tests to see some more examples.
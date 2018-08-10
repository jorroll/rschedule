# rSchedule

A javascript library, written in typescript, for working with recurring dates. Rules can be imported / exported in [ICAL](https://tools.ietf.org/html/rfc5545) spec format, and Rule objects themselves adhere to the javascript iterator protocol. Example usage:

```typescript
const rule = new RRule({
  frequency: 'YEARLY',
  byMonthOfYear: [2, 6],
  byDayOfWeek: ['SU', ['MO', 3]],
  start: new StandardDateAdapter(new Date(2010,1,7))
})

let index = 0;
for (const date of rule.occurrences()) {
  date.toISOString()
  index++
  
  if (index > 10) break;
}

rule.occurrences({
  start: new StandardDateAdapter(new Date(2010,5,7)),
  take: 5
})
  .toArray()
  .map(date => date.toISOString())
```

#### Installation

```bash
# To install both the main package and the `DateAdapter` for standrd javascript dates */

yarn add @rschedule/rschedule @rschedule/standard-date-adapter

# or

npm install @rschedule/rschedule @rschedule/standard-date-adapter
```

rSchedule makes use of a fairly simple `DateAdapter` wrapper object which abstracts away from individual date library implementations, making this package date library agnostic.

A `StandardDateAdapter` currently exists which provides a `DateAdapter` complient wrapper for the standard javascript `Date` object. It should be pretty easy for you to create your own `DateAdapter` for your preferred library (allowing you to, for example, support timezones using [momentjs](https://momentjs.com/)). See the DateAdapter section below for more info. If you choose to do so, `DateAdapter` related pull requests will be welcomed.

While `RRule` objects contain the main recurrence logic, you probably won't use them directly. Instead, the friendly `Schedule` object exists which builds an occurrence schedule based off of an arbirary number of RRules, RDates, and EXDates.

Example usage:

```typescript
const schedule = new Schedule({
  rrules: [
    {
      frequency: 'YEARLY',
      byMonthOfYear: [2, 6],
      byDayOfWeek: ['SU', ['MO', 3]],
      start: new StandardDateAdapter(new Date(2010,1,7))
    },
    {
      frequency: 'DAILY',
      byDayOfWeek: ['TU'],
      start: new StandardDateAdapter(new Date(2012,1,7))
    },
  ]
})

schedule.occurrences().toArray()
```

Each `Schedule` object is intended to contain all the recurrence information to iterate through an event of arbitrary complexity. Schedule objects can be bundled together into a `Calendar` object which combines a collection of schedule objects into a recurrence schedule.

Example usage:

```typescript
const scheduleOne = new Schedule()
const scheduleTwo = new Schedule()

const calendar = new Calendar({
  schedules: [scheduleOne, scheduleTwo]
})

calendar.occurrences().toArray()

for (const occurrence of calendar.occurrences({start: new StandardDateAdapter()})) {
  // do stuff
}
```

## Usage

This library has three basic parts:
- `Rule`
- `Schedule`
- `Calendar`

It also has makes use of a `DateAdapter` interface to abstract away from individual date implementations. As mentioned, a `StandardDateAdapter` is included for use with the javascript `Date` object (which only supports local and UTC time).

### RRule class

RRule objects implement the `RRULE` portion of the [iCAL spec](https://tools.ietf.org/html/rfc5545), and hold/process recurrence rules. While they can be used stand-alone, I expect most people to use them inside of `Schedule` objects.

Rule objects are created with a variety of [iCAL spec](https://tools.ietf.org/html/rfc5545) options. If you're not familiar, you can read the [recurrence rule section of the ICAL spec](https://tools.ietf.org/html/rfc5545#section-3.3.10) to familiarize yourself with the concepts (its not long).

Rule objects support:

```typescript
interface ProvidedOptions<T extends DateAdapter<T>> {
  start: T // start date, provided as a DateAdapter object
  frequency: Frequency
  interval?: number
  bySecondOfMinute?: BySecondOfMinute[]
  byMinuteOfHour?: ByMinuteOfHour[]
  byHourOfDay?: ByHourOfDay[]
  byDayOfWeek?: ByDayOfWeek[]
  byDayOfMonth?: ByDayOfMonth[]
  byMonthOfYear?: ByMonthOfYear[]
  until?: T // end date, provided as a DateAdapter object
  count?: number
  weekStart?: DateAdapter.Weekday
}

const options = {
  // choose your options
}

const rule = new RRule(options)
```

Rule objects must be created with a start date and a frequency.

### Schedule class

Schedule objects don't have an *exact* correlary in the iCAL spec, but I think(?) they're similar to `VEVENT` objects. Schedule objects are made up of multiple rule objects, as well as specific dates to include and specific dates to exclude.

Something that rSchedule supports is for each `RRULE` on a schedule to have its own start/end times. Because the ICAL spec doesn't support this, when you serialize a schedule to iCalendar format (`schedule.toICal()`) it is converted into an array of ICAL complient events (one for each `RRULE` and one additional for all `RDATE` and `EXDATE`).

Example usage:

```typescript
const weeklyRule = new Rule({
  frequency: 'WEEKLY',
  start: new StandardDateAdapter(new Date(2012, 5, 24)),
  until: new StandardDateAdapter(new Date(2012, 11, 31))
})

const dailyRule = new Rule({
  frequency: 'DAILY',
  start: new StandardDateAdapter(new Date(2011, 9, 2))
})

const schedule = new Schedule(weeklyRule, dailyRule)

schedule.occurrences().toArray().map(date => date.toISOString())

const scheduleIterator = schedule.occurrences({end: new StandardDateAdapter()})

scheduleIterator.next().toISOString() // 

const occurrences = [];

for (const occurrence of scheduleIterator) {
  if (occurrence.date.getMonth() > new Date().getMonth()) {
    occurrences.push(occurrence)
  }
}

if (schedule.occursOn(new StandardDateAdapter(new Date(2013,5,17)))) {
  // do stuff
}
else if (schedule.occursBefore(new StandardDateAdapter(new Date(2012,2,12))))) {
  // do different stuff
}
```

As a convenience, Schedule objects have a `data` property which can hold arbitrary data.

`Calendar`, `Schedule`, and `Rule` objects each implement the `HasOccurrences` interface

```typescript
interface HasOccurrences<T extends DateAdapter<T>> {
  occurrences(args: {start?: T; end?: T; take?: number): OccurrenceIterator<T>
  occursBetween(start: T, end: T, options: { excludingEnds?: boolean }): boolean
  occursOn(date: T): boolean
  occursAfter(date: T, options: { excludeStart?: boolean }): boolean
  isInfinite: boolean
}
```

### Calendar class

`Calendar` objects support iterating through groups of `Schedule` objects (and `Schedule` objects support iterating through groups of `RRule` objects). Unlike Schedule or RRule objects, Calendar objects allow multiple occurrences happening at the same time (each associated with a different Schedule). As such, Calendar objects have `Calendar#collections()` which groups occurrences into a `Collection` by a specified `granularity` before yielding the `Collection`.

Options are:
- `"INSTANTANIOUSLY"` -- default
- `"SECONDLY"`
  - sets the millisecond value of the `start` time to `0` and then starts iterating
- `"MINUTELY"`
  - sets the second and millisecond values of the `start` time to `0` and then starts iterating
- `"HOURLY"`
  - sets the minute, second, and millisecond values of the `start` time to `0` and then starts iterating
- `"DAILY"`
  - sets the hour, minute, second, and millisecond values of the `start` time to `0` and then starts iterating
- `"WEEKLY"`
  - also requires a `weekStart` param accepting a single string `"SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA"`
  - sets the day to the start of the week and sets the hour, minute, second, and millisecond values of the `start` time to `0` and then starts iterating
- `"MONTHLY"`
  - sets the day to 1 and the hour, minute, second, and millisecond values of the `start` time to `0` and then starts iterating
- `"YEARLY"`
  - sets the month to January and the day to 1 and the hour, minute, second, and millisecond values of the `start` time to `0` and then starts iterating

As you iterate through a Calendar using `collections()`, the object will return `Collection` objects which contain all of the dates in that timespan. The collection object also has `periodStart` and `periodEnd` time properties to let you know the period over which the collection took place.

```typescript
collections(args: {start?: T; end?: T; take?: number; granularity?: Granularity; weekStart?: Options.Weekstart}): CollectionIterator<T>
```

You can create a calendar object by feeding it an array of schedules

```typescript
const calendar = new Calendar({
  schedules: []
})

const args = {
  start: new StandardDateAdapter(),
  granularity: 'MONTHLY',
}

let pageTitle: string

for (const collection of calendar.collections(args)) {
  for (const occurrence of collection.occurrences) {
    const date = occurrence.schedule.date // arbitrary data property for you to use

    data.name // 'My great event'

    if (data.name === 'My horrible event') continue
    else {
      pageTitle = `${format(collection.start.get('month'))} Events!`

      // do stuff
    }
  }
}
```

As a convenience, Calendar objects have a `data` property which can hold arbitrary data.

### DateAdapter interface

The DateAdapter object that this library consumes has the following interface:

```typescript
interface DateAdapter<T> {
  /** Returns a duplicate of original DateAdapter */
  clone(): T

  /** The `Rule` which generated this `DateAdapter` */
  rule: Rule | undefined;
  /** The `Schedule` which generated this `DateAdapter` */
  schedule: Schedule | undefined;
  /** The `Calendar` which generated this `DateAdapter` */
  calendar: Calendar | undefined;

  /** mutates original object */
  add(amount: number, unit: DateAdapter.Unit): T

  /** mutates original object */
  subtract(amount: number, unit: DateAdapter.Unit): T

  // If you're unformiliar, this is a series of typescript overloads
  // for the get() method.
  get(unit: 'year'): number
  get(unit: 'month'): number
  get(unit: 'yearday'): number
  get(unit: 'weekday'): DateAdapter.Weekday
  get(unit: 'day'): number
  get(unit: 'hour'): number
  get(unit: 'minute'): number
  get(unit: 'second'): number
  get(unit: 'ordinal'): number // in milliseconds (equivalent to new Date().valueOf())
  get(unit: 'tzoffset'): number // in seconds
  // if "UTC" then `"UTC"`
  // if local then `undefined`
  // else if a specific timezone, formatted per the ICal spec (e.g. `"America/New_York"`)
  get(unit: 'timezone'): string | undefined

  /** mutates original object */
  set(unit: DateAdapter.Unit, value: number): T
  set(unit: 'timezone', value: string | undefined): T

  /** same format as new Date().toISOString() */
  toISOString(): string

  // date formatted for ical string
  // if `utc` is true, must be formatted as UTC string
  toICal(utc?: boolean): string

  isSameClass(object: any): object is T

  isEqual(object: any): object is T

  isBefore(date: T): boolean
  isBeforeOrEqual(date: T): boolean
  isAfter(date: T): boolean
  isAfterOrEqual(date: T): boolean

  /**
   * If the DateAdapter object is valid, returns `true`.
   * Otherwise, throws `DateAdapter.InvalidDateError`
   */
  assertIsValid(): boolean
}

interface IDateAdapterConstructor<T extends Constructor> {
  new (n: any): InstanceType<T>
  isInstance(object: any): object is InstanceType<T>

  /**
   * This method is used to instantiate new DateAdapter objects (from, for example,
   * an ICAL string)
   */
  fromTimeObject(timeObj: {
    // each datetime has [YYYY, MM, DD, HH, MM, SS] format
    datetimes: [number, number, number, number?, number?, number?][]
    // if "UTC" then `"UTC"`
    // if local then `undefined`
    // else if a specific timezone, formatted per the ICal spec (e.g. `"America/New_York"`)
    timezone?: string
    // the raw ICAL formatted datetime string
    raw: string
  }): InstanceType<T>[]
}


namespace DateAdapter {
  type Unit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'ordinal'

  type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'
}
```

## Contributing

This library is definitely usable in its current form, and the features it does have are backed up by a few hundred tests. Everything described in this readme should be working. This being said, when I get around to implementing a `MomentDateAdapter` and timezone support, I imagine that might involve some breaking changes. So you should consider this library to be still in beta.

This library's rule logic is implemented as a chain of pipes applying validations and transformations to dates. From my perspective, this has several benefits:

1. The rule logic is cleanly seperated for each rule, and it's easier to figure out what's going on. This is important, because recurrence rules can become very complex and susceptible to bugs.
2. If you query a rule for dates starting as some arbitrary point after the rule's start date, the rule actually starts iterating at the given date (which should make rSchedule pretty fast, though I haven't done any comparison testing). Some of the other recurrence libraries I've seen are forced to iterate starting at the rule's start date.
3. Similar to #2, rSchedule doesn't need to iterate through every interval of a rule, but can instead "skip" invalid dates, landing on just the valid ones. For example, say you have a `DAILY` recurrence rule that only happens in January. If you begin on January first, this library will iterate through all the days in january, and then immediately skip to January 1st on the next year. I think some other libraries need to silently iterate through feb-dec, without skipping any intervals.
4. Because every rule is cleanly seperated into it's own pipe class, it shouldn't be too difficult to either fork the library and add custom rule pipes (i.e. custom rules) if needed, or create a PR to upgrade this library to support custom rules.

If you're interested in peeking at this library's source, I'd suggest starting in the `src/pipes` folder. The `PipeController` holds the rule pipes for a rule and organizes the process of iterating through the pipes--so I'd start by looking there.

Feel free to open an issue if you have questions.

## Known Issues / Todo

- Cannot iterate in reverse. Implementing this should be pretty straight forward.
- No provided timezone friendly `DateAdapter`. Personally, I want a `MomentDateAdapter`.
- This library does not support `EXRULE`. I'm, personally, not particularly interested in adding support (it's also deprecated in the spec). This being said, it should be pretty easy to add if you're interested in doing so, and I think I've designed all the interfaces specifically so `EXRULE` can be added in the future (an en `EXRule` object already exists, though it's not exported, in `src/rule/rule.ts`). So all someone would need to do is write the logic to add `EXRule`'s to `Schedule` objects and have them delete occurrences, as appropriate. You'd also need to make sure that the ICAL parsing functions added EXRULE's. But I think `EXRULE` have the same API as `RRULE`, so again, it should be *really easy* for someone else to do this.
- No `BYWEEKNO`, `BYYEARDAY`, or `BYSETPOS` rule support. "By day of year" and "by position in set" should both be pretty straightforward, they're just not something I need so not on my todo list.
  - "By week of year" is different though. I spent a fair bit trying to get it to work and its just SUPER annoying (because it can create a valid date for year A in year B. e.g. the Saturday of the last week of 1998 *is in the year 1999*). Anyway, obviously doable, I have no plans to implement it though.
- Currently, the `count` option of a rule simply counts the number of occurrences you're received and then cuts you off as appropriate. If you pass in a different start date when requesting occurrences though, you'll still receive the same total count of occurrences, they'll just be pushed back in time. This is *probably* not what people want.
  - E.g. If someone creates a daily rule starting on Monday with a count of 3, and iterates over it the occurrence stream will cut off after Wednesday. If you pass a new start date in as an argument though, say show me occurrences for this rule starting on Tuesday, then you'll receive Tuesday, Wednesday, and Thursday. The probem is that the `count` didn't begin on the rule's start date. I don't think there's anything fancy to be done about this. You'd need to start at the beginning and just skip forward to the section you're interested in. For example

```
const rule = new Rule({frequency: 'DAILY', start: new StandardDateAdapter(), count: 3})

rule.occurrences().toArray() // [today, tomorrow, the next day]

rule.occurrences({start: tomorrow}).toArray() // [tomorrow, the next day, the day after that]

const array = []

for (const day of rule.occurrences()) {
  if (day.isBefore(tomorrow)) continue;
  array.push(day)
}

array // [tomorrow, the next day]
```
    

### About

The library, itself, has been created from scratch by me, John Carroll. Most all of the RRULE tests were taken from the excellent [rrule.js](https://github.com/jakubroztocil/rrule) library (which were, themselves, taken from a python library, I believe).

This library was built using the [typescript library starter repo](https://github.com/alexjoverm/typescript-library-starter). My implementation strategy has drawn inspiration from the [Angular Material2](https://github.com/angular/material2) Date Picker component (which makes use of date adapters to support different javascript date libraries), as well as [rrulejs](https://github.com/jakubroztocil/rrule) and [ice_cube](https://github.com/seejohnrun/ice_cube).

I'd like to give a special shout of thanks for both [rrule.js](https://github.com/jakubroztocil/rrule) and [ice_cube](https://github.com/seejohnrun/ice_cube) (a ruby gem) for their excellent RRULE implementations.

*Note: this project is not affiliated with any other projects.*
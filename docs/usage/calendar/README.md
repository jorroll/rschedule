_implements [IOccurrenceGenerator](../#shared-interfaces)_

At a high level, while [`Schedule`](../schedule) objects are intended to represent the schedule of a single complex event, `Calendar` object's exist to make it easier to iterate over a group (calendar) of events (though they are also useful in some other situations). `Calendar` objects support iterating through _the union_ of a group of object's implementing [`IOccurrenceGenerator`](../#shared-interfaces).

In addition to the standard `occurrences()` method, Calendar objects have `collections()` method which groups occurrences into a `Collection` by a specified `granularity` before yielding the `Collection`. [More on this method is below](#iterating-collections-with-calendarcollections). This method is useful when displaying dates on a calendar.

Unlike Schedule or RRule objects, Calendar objects allow multiple occurrences happening at the same time (each associated with a different object). Because `Calendar` objects are constructed from objects which implement the [`IOccurrenceGenerator` interface](../#shared-interfaces), you can construct calendars out of other Calendars, out of Schedules, Rules, etc.

Example:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdapter;

const calendar = new Calendar({
  schedules: [new Schedule(), new Calendar()],
  data: 'Holds anything I want',
});

for (const collection of calendar.collections({ grandularity: 'MONTHLY' })) {
  for (const date of collection.dates) {
    const schedule = date.generators[1]; // see generators property on IDateAdapter

    const data = schedule.data; // see data property on IOccurrenceGenerator

    if (data.scheduleName === 'My horrible event') continue;

    // do stuff
  }
}
```

## Iterating Collections with `Calendar#collections()`

`Calendar#collections(args?: CollectionsArgs)` iterates over the calendar's occurrences and bundles them into collections with a specified granularity (default is `"INSTANTANIOUS"`). Make sure to read about each option & combination of options below.

`CollectionsArgs` options object:

- start?: DateAdapter | DateProp
- end?: DateAdapter | DateProp
- take?: number
- reverse?: NOT SUPPORTED
- granularity?: CollectionsGranularity
- weekStart?: DateAdapter.Weekday
- incrementLinearly?: boolean

Returned `Collection` object:

- `dates` property containing an array of DateAdapter objects.
- `granularity` property containing the granularity.
  - `CollectionsGranularity` type extends rule options `Frequency` type by adding
    `"INSTANTANIOUS"`.
- `periodStart` property containing a DateAdapter equal to the period's
  start time.
- `periodEnd` property containing a DateAdapter equal to the period's
  end time.

#### Details:

`collections(args?: CollectionsArgs)` always returns full periods. This means that the `start` option is transformed to be the start of whatever period the `start` option is in, and the `end` option is transformed to be the end of whatever period the `end` option is in.

- Example: with granularity `"YEARLY"`, the `start` argument will be transformed to be the start of the year passed in the `start` argument, and the `end` argument will be transformed to be the end of the year passed in the `end` argument.

By default, the `periodStart` value of `Collection` objects produced by this method does not necessarily increment linearly. A collection will _always_ contain at least one date, so the `periodStart` from one collection to the next can "jump". This can be changed by passing the `incrementLinearly: true` option. With this argument, `collections()` will return `Collection` objects for each period in linear succession, even if a collection object has no dates associated with it, so long as the `Calendar` object still has upcoming occurrences.

- Example 1: With `incrementLinearly: false` (the default), if your granularity is `"DAILY"` and you start January 1st, but the earliest a schedule outputs a date is February 1st, the first Collection produced will have a `periodStart` in February.
- Example 2: With `incrementLinearly: true`, if your granularity is `"DAILY"` and you start January 1st, but the earliest a schedule outputs a date is February 1st, the first collection produced will have a `Collection#periodStart` of January 1st and have `Collection#dates === []`. Similarly, the next 30 collections produced (Jan 2nd - 31st) will all contain an empty array for the `dates` property. The February 1st Collection will return dates though (i.e. `Collection#dates.length > 0)`.

When giving a `take` argument to `collections()`, you are specifying the number of `Collection` objects to return (rather than occurrences).

When choosing a granularity of `"WEEKLY"`, the `weekStart` option is required.

When choosing a granularity of `"MONTHLY"`:

- If the `weekStart` option _is not_ present, will generate collections with
  the `periodStart` and `periodEnd` at the beginning and end of each month.

- If the `weekStart` option _is_ present, will generate collections with the `periodStart` equal to the start of the first week of the month, and the `periodEnd` equal to the end of the last week of the month. This behavior could be desired when rendering opportunities in a calendar view, where the calendar renders full weeks (which may result in the calendar displaying dates in the previous or next months).

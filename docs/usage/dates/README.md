# Dates class

[**`Dates implements IOccurrenceGenerator`**](../#ioccurrencegenerator-interface)

The `Dates` class provides a `IOccurrenceGenerator` wrapper for an array of dates. As with other rSchedule objects, `Dates` is immutable.

Example usage:

```typescript
RScheduleConfig.defaultDateAdapter = StandardDateAdatper;

const dates = new Dates({
  dates: [new Date(2000), new Date(2001), new Date(2002)],
});

for (const date of dates.occurrences({ start: new Date(2000, 5) })) {
  // do stuff
}

dates.occursOn({ date: new Date(2003) }); // false
```

### Constructor

`Dates` has the following constructor.

```typescript
class Dates<T extends typeof DateAdapter, D = any> {
  static isDates(object: unknown): object is Dates<any>;

  data: D;
  readonly length: number;
  readonly adapters: readonly InstanceType<T>[];
  readonly firstDate: InstanceType<T> | null;
  readonly lastDate: InstanceType<T> | null
  readonly isInfinite = false;
  readonly hasDuration: boolean;
  readonly maxDuration: number;
  readonly timezone: string | null;

  constructor(args: {
    timezone?: string | null;
    duration?: number;
    dates?: Array<DateInput<T>>;
    // The data property holds arbitrary data associated with the `Dates`.
    // The data property is also the one exception to rSchedule's immutability:
    // the data property is mutable.
    //
    // When iterating through a Dates, you can access a list of the generator objects (i.e. this Dates)
    // which generated any yielded date by accessing the `IDateAdapter#generators` property.
    // In this way, for a given, yielded date, you can access the object which generated
    // the date (in this case, this Dates) as well as the arbitrary data associated with that object (this data).
    data?: D;
    dateAdapter?: T;
  });

  add(value: DateInput<T>): Dates<T>;
  remove(value: DateInput<T>): Dates<T>;

  /**
   * Dates are immutable. This allows you to create a new `Dates` with the
   * specified property changed.
   *
   * ### Important!
   *
   * When updating `Dates#timezone`, this does not actually change the timezone of the
   * underlying date objects wrapped by this `Dates` instance. Instead, when this `Dates`
   * object is iterated and a specific date is found to be
   * valid, only then is that date converted to the timezone you specify here and returned to
   * you.
   *
   * This distinction might matter when viewing the timezone associated with
   * `Dates#adapters`. If you wish to update the timezone associated with the `date` objects
   * this `Dates` is wrapping, you must update the individual dates themselves by setting
   * the `dates` property.
   *
   */
  set(prop: 'timezone', value: string | null, options?: { keepLocalTime?: boolean }): Dates<T, D>;
  /**
   * Dates are immutable. This allows you to create a new `Dates` with new date objects.
   */
  set(prop: 'dates', value: DateInput<T>[]): Dates<T, D>;
  /**
   * Dates are immutable. This allows you to create a new `Dates` with all of the underlying
   * date objects set to have the specified `duration`. Duration is a length of time,
   * expressed in milliseconds.
   */
  set(prop: 'duration', value: number | undefined): Dates<T, D>;
}
```

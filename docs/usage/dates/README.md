# Dates class

[**`Dates implements IOccurrenceGenerator`**](../#IOccurrenceGenerator-Interface)

The `Dates` class provides a `IOccurrenceGenerator` wrapper for an array of dates.

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
  constructor(args: {
    timezone?: string | null;
    dates?: Array<DateInput<T>>;
    // The data property holds arbitrary data associated with the `Dates` object.
    // When iterating through an occurrence generator, you can access a list of the objects
    // which generated any given date by accessing the `IDateAdapter#generators` property.
    // In this way, for a given, generated date, you can access the object which generated
    // the date as well as the arbitrary data associated with that object.
    data?: D;
    dateAdapter?: T;
  });
}
```

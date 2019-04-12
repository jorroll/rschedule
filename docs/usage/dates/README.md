_implements [IOccurrenceGenerator](../#shared-interfaces)_

The `Dates` class (and `RDates` / `EXDates` subclasses) provides a `IOccurrenceGenerator` wrapper for an array of dates.

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

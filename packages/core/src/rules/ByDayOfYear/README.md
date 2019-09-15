This rule is still a WIP. I believe the rule itself is fine. The problem is that when byDayOfMonth and byDayOfYear are both present, the ical spec specifies that they should both _expand_ the set of occurrences. I.e. if `byDayOfMonth === 1`, `byDayOfYear === 1` and `frequency === 'YEARLY'` results in the first day of every month (rather than simply january 1st).

Currently, `byDayOfMonth` would need updates to support this. Separately, I don't think I want to make this change.

## Contributing

Please contribute if you find an issue! Though, I definitely suggest you open an issue first.

This library's rule logic is implemented as a chain of pipes applying validations and transformations to dates. From my perspective, this has several benefits:

1. The rule logic is cleanly seperated for each rule, and it's easier to figure out what's going on. This is important, because recurrence rules can become very complex and susceptible to bugs.
2. If you query a rule for dates starting as some arbitrary point after the rule's start date, the rule actually starts iterating at the given date.
3. Similar to #2, rSchedule doesn't need to iterate through every interval of a rule, but can instead "skip" invalid dates, landing on just the valid ones. For example, say you have a `DAILY` recurrence rule that only happens in January. If you begin on January first, this library will iterate through all the days in january, and then immediately skip to January 1st on the next year. I think some other libraries need to silently iterate through feb-dec, without skipping any intervals (not 100% sure though).
4. Because every rule is seperated into it's own pipe class, it shouldn't be too difficult to either fork the library and add custom rule pipes (i.e. custom rules) if needed, or create a PR to upgrade this library to support custom rules.

If you're interested in peeking at this library's source, I'd suggest starting by reading the `README` in the `src/rule/pipes` folder.

Feel free to open an issue if you have questions.

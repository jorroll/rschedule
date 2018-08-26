# Pipes Folder Overview

The pipes folder contains the main recurrence processing logic of the rSchedule library. In rSchedule, a rule is processed as a series of transformations to a `DateAdapter` object. The transoformations are defined by the options a rule is created with. Each type of recurrence option has it's logic encapsulated in a pipe class.

*The order of the pipes is defined by the [ICAL spec](https://tools.ietf.org/html/rfc5545#section-3.3.10)*

- `01` FrequencyPipe
- `02` ByDayOfYearPipe
- `05` ByDayOfMonthPipe
- `06` ByDayOfWeekPipe
- `07` ByHourOfDayPipe
- `08` ByMinuteOfHourPipe
- `09` BySecondOfMinutePipe
- `11` ResultPipe
  - The `ResultPipe` doesn't correspond to anything in the spec, and is just an implementation detail of this library. It always comes last.

When iterating in reverse, the "reverse" version of each pipe is used. i.e. `FrequencyReversePipe`.

When someone wishes to iterate through an RRule, the iteration arguments and rule options object are used to instantiate a `PipeController` object which, itself, instantiates pipe objects for each rule option. The PipeController also manages which pipes currently have `focus` (more on that later).

When the pipe controller's `_run()` method is called, it passes the starting date to the `FrequencyPipe`, the frequency pipe applies its transformations to the date, then passes the date to the next pipe in the chain. That pipe applies its transformations and then passes the date to the next pipe in the chain and so on. The chain ends at the `ResultPipe`. If one of the pipes in the chain has marked the date as invalid, then the ResultPipe will pass the date back to the FrequencyPipe which will increment the date and run through the pipe chain again. If the date is not marked as invalid, then the ResultPipe will return the date to the PipeController, which will yield it. If an "end" time is configered for the iteration (either because the `end` argument was passed or because the rule as an `until` time), then the first thing the ResultPipe will do is check the date to see if it is passed the end date. If so, the ResultPipe will return `null`, which is the signal to the PipeController to halt iteration.

Each pipe adheres to an `IPipeRule` interface (defined in `./interfaces.ts`). The main part of the interface is a `run()` function. When one pipe passes a date to the next pipe in the chain, the way it does this is it queries the `PipeController` for "what is the next pipe", and then it calls that pipe's `run()` function.

Each pipe's implementation is a bit different, with the `ByDayOfWeek` pipe being, by far the most complicated (this is because the speck shoves a bunch of disperate functionality into the `BYDAY` rule). In general though, each pipe will operate in one of two modes: `expanding` or `filtering`. The speck also explains this a bit, but here's an example to help explain: if you're iterating with a `YEARLY` frequency and no other rule options, you'll produce one occurrence a year. If you had two `ByMonthOfYear` rules, say for January and March, then the rule will occur twice in a year. In this way, the `ByMonthOfYear` rule is *expanding* the number of `YEARLY` occurrences. On the other hand, if you have a `DAILY` rule, this will happen 365 times in a year (excluding leap year). If you add a `ByMonthOfYear` rule and limit occurrences to January, then you'll only have 31 occurrences in a year. In this way the `ByMonthOfYear` rule filters if the frequency is `DAILY`. 

When you look at a pipe class, you'll see that the `run()` function generally delegates to either a `filter()` or `expand()` function, depending on the other options presend in the rule and the rule's frequency. The actual desired behavior of each rule is defined in the spec. 

As a pipe processes a date, if it determines that the date is invalid, it will pass an `invalidDate: true` argument to the next pipe in the chain. When a pipe receives a date marked invalid, it knows to skip processing the date and simply forward it on down the line until it reaches the `ResultPipe`.

## Expanding Mode

When a date is passed to a pipe, and that pipe is in expanding mode, that pipe gets to build new dates using the date it received as a template. In general, the way this library handles this scenerio is the following:

- When an expanding pipe receives a date for the first time, it calculates all the upcoming valid dates in that frequency interval for that rule.
- It then tells the PipeController that it should have focus.
- It then takes the next upcoming valid date, from the list of valid dates it calculated and cached, and sends it to the next pipe in the chain. That pipe does its own stuff and eventually the date makes its way to the ResultPipe.
- When the ResultPipe will either yield the date, if it is valid, or trigger another iteration of the pipe chain. What I didn't quite tell you before, was that when the ResultPipe triggers another iteration of the chain, it doesn't actually send the date directly to the `FrequencyPipe` instead it sends the date to whatever pipe has focus. So, while a pipe is expanding, it gains focus and iterates through all the upcoming dates in its cache, ignoring the pipes above it in the chain. When the expanding pipe's cache is empty, it removes focus from itself.

## Filtering Mode

When a date is passed to a pipe, and that pipe is in filtering mode, that pipe checks to see if it considers the date valid. If it does, great! It passes the date to the next pipe in the chain. If it doesn't, then it calculates when the next date that it would consider valid is. It then passes the current date on to the next pipe with two additional arguments.

- The first additional argument is `invalidDate: true`, marking the current date as invalid.
- The second argument is `skipToDate:`. The skipToDate argument contains the next valid date that the pipe calculated. The next valid date may be far in the future. At this point, we know that, at minimum, we can skip ahead to this next valid date, because no dates inbetween the next valid date and the current date can possibly be valid. So the arguments are passed down the line to the ResultPipe, which passes the arguments to the FrequencyPipe. The frequency pipe sees the `skipToDate:` argument and knows that it should not simply increment the date normally. Instead, it finds the next valid frequency interval that either includes the `skipToDate` or is *past* the `skipToDate`.
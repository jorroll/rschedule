# Pipes Folder Overview

The pipes folder contains the main recurrence processing logic of the rSchedule library. In rSchedule, a rule is processed as a series of transformations to a `DateTime` object. The transoformations are defined by the options a rule is created with. Each type of recurrence option has it's logic encapsulated in a pipe class.

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

When iterating in reverse, the "reverse" version of each pipe is used (unless the rule specifies a `count` property). i.e. `RevFrequencyPipe`.

When someone wishes to iterate through a Rule, the iteration arguments and rule options object are used to instantiate a `PipeController` object which, itself, instantiates pipe objects for each rule option.

When the pipe controller's `_run()` method is called, it passes the starting date to the `FrequencyPipe`, the frequency pipe applies its transformations to the date, then passes the date to the next pipe in the chain. That pipe applies its transformations and then passes the date to the next pipe in the chain and so on. The chain ends at the `ResultPipe`. If one of the pipes in the chain has marked the date as invalid, then the `ResultPipe` will pass the date back to the FrequencyPipe which will increment the date and run through the pipe chain again. If the date is not marked as invalid, then the `ResultPipe` will return the date to the PipeController, which will yield it. If an "end" time is configered for the iteration (either because the `end` argument was passed or because the rule as an `end` time), then the first thing the `ResultPipe` will do is check the date to see if it is passed the end date. If so, the `ResultPipe` will return `null`, which is the signal to the PipeController to halt iteration.

Each pipe adheres to an `IPipeRule` interface (defined in `./interfaces.ts`). The main part of the interface is a `run()` function. When one pipe is done processing a `DateTime`, it calls the next pipe's `run()` function and passes the `DateTime` to it.

Each pipe's implementation is a bit different, with the `ByDayOfWeek` pipe being by far the most complicated (this is because the speck shoves a bunch of disperate functionality into the `BYDAY` rule). 

As a pipe processes a date, if it determines that the date is invalid, it will pass an `invalidDate: true` argument to the next pipe in the chain. When a pipe receives a date marked invalid, it knows to skip processing the date and simply forward it on down the line until it reaches the `ResultPipe`.

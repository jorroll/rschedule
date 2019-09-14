import { DateInput } from '@rschedule/core';
import { Calendar, Dates, intersection, Rule, Schedule, unique } from '@rschedule/core/generators';

import { Pattern, RecurrencePattern } from './interfaces';

import { buildRecurrencePattern, isRecurrencePattern } from './rule';

/**
 * Checks to see if a `schedule` contains the `OccurrencePattern` or `RecurrencePattern`
 * on the given `date`.
 *
 * - Pass the `ignoreStart: true` option to ignore the `start` time of the
 *   rules being checked (this means that the provided `date` can be before
 *   the rule's `start` time).
 *
 * - Pass the `ignoreEnd: true` option to ignore the `end` time of the
 *   rules being checked (this means that the provided `date` can be after
 *   the rule's `end` time).
 *
 *
 *  _See the `rule-tools` docs for more information on available `OccurrencePattern`_
 * _and `RecurrencePatterns`._
 */
export function scheduleHasPattern(args: {
  pattern: Pattern;
  date: DateInput;
  schedule: Schedule<any>;
  ignoreStart?: boolean | undefined;
  ignoreEnd?: boolean | undefined;
}): boolean {
  const pattern = args.pattern;

  if (pattern === 'date') {
    return args.schedule.rdates.occursOn({ date: args.date });
  }

  return args.schedule.rrules.some(rule => isRecurrencePattern({ ...args, pattern, rule }));
}

/**
 * Adds the `OccurrencePattern` or `RecurrencePattern` to the `schedule` on the provided `date`.
 *
 *  _See the `rule-tools` docs for more information on available `OccurrencePattern`_
 * _and `RecurrencePatterns`._
 */
export function addSchedulePattern<S extends Schedule>(
  pattern: Pattern,
  date: DateInput,
  schedule: S,
): S {
  if (pattern === 'date') {
    return schedule.add('rdate', date) as S;
  }

  return schedule.add('rrule', new Rule<any>(buildRecurrencePattern(pattern, date))) as S;
}

/**
 * End any matching `RecurrencePatterns` the `schedule` has on the provided `date`.
 *
 * - Pass the `cleanEXDates: true` option to also remove any `exdates` which
 *   no longer intersect with the `schedule`.
 *
 * _See the `rule-tools` docs for more information on available RecurrencePatterns._
 */
export function endScheduleRecurrencePattern<S extends Schedule>(args: {
  pattern: RecurrencePattern;
  date: DateInput;
  schedule: S;
  cleanEXDates?: boolean;
}): S {
  let schedule = args.schedule.set('rrules', args.schedule.rrules.map(rule =>
    isRecurrencePattern({ ...args, rule }) ? rule.set('end', args.date) : rule,
  ) as Rule[]) as S;

  if (args.cleanEXDates) {
    schedule = cleanScheduleEXDates(schedule);
  }

  return schedule;
}

/**
 * Remove any matching `OccurrencePatterns` or `RecurrencePatterns` the `schedule`
 * has on the provided `date`.
 *
 * - Pass the `cleanEXDates: true` option to also remove any `exdates` which
 *   no longer intersect with the `schedule`.
 *
 *  _See the `rule-tools` docs for more information on available `OccurrencePattern`_
 * _and `RecurrencePatterns`._
 */
export function removeSchedulePattern<S extends Schedule>(args: {
  pattern: Pattern;
  date: DateInput;
  schedule: S;
  cleanEXDates?: boolean;
}): S {
  let schedule: S;

  if (args.pattern === 'date') {
    schedule = args.schedule.remove('rdate', args.date) as S;
  } else {
    schedule = args.schedule.set(
      'rrules',
      args.schedule.rrules.filter(rule => !isRecurrencePattern({ ...args, rule } as any)),
    ) as S;
  }

  // Remove any exdates that are no longer needed
  if (args.cleanEXDates) {
    schedule = cleanScheduleEXDates(schedule);
  }

  return schedule;
}

/**
 * Remove all of the schedule's `exdates` which do not intersect the schedule's
 * occurrences.
 */
export function cleanScheduleEXDates<S extends Schedule>(schedule: S): S {
  const options = { timezone: schedule.timezone };

  const intersectingExDates = new Calendar({
    schedules: schedule.set('exdates', new Dates(options)),
    ...options,
  })
    .pipe(
      intersection({
        streams: [schedule.exdates],
      }),
      unique(),
    )
    .occurrences()
    .toArray();

  return schedule.set('exdates', schedule.exdates.set('dates', intersectingExDates)) as S;
}

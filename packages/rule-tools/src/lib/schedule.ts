import {
  Calendar,
  DateAdapter,
  DateAdapterFor,
  DateInput,
  Dates,
  intersection,
  IScheduleLike,
  Rule,
  unique,
} from '@rschedule/rschedule';
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
export function scheduleHasPattern<S extends IScheduleLike<any>>(
  pattern: Pattern,
  date: DateInput<DateAdapterFor<S>>,
  schedule: S,
  options: {
    dateAdapter?: DateAdapterFor<S> | undefined;
    ignoreStart?: boolean | undefined;
    ignoreEnd?: boolean | undefined;
  } = {},
): boolean {
  if (pattern === 'date') {
    return schedule.rdates.occursOn({ date });
  }

  return schedule.rrules.some(rule => isRecurrencePattern(pattern, date, rule, options));
}

/**
 * Adds the `OccurrencePattern` or `RecurrencePattern` to the `schedule` on the provided `date`.
 *
 *  _See the `rule-tools` docs for more information on available `OccurrencePattern`_
 * _and `RecurrencePatterns`._
 */
export function addSchedulePattern<S extends IScheduleLike<any>>(
  pattern: Pattern,
  date: DateInput<DateAdapterFor<S>>,
  schedule: S,
  options: { dateAdapter?: DateAdapterFor<S> } = {},
): S {
  if (pattern === 'date') {
    return schedule.add('rdate', date) as S;
  }

  return schedule.add(
    'rrule',
    new Rule<any>(buildRecurrencePattern(pattern, date, options), options),
  ) as S;
}

/**
 * End any matching `RecurrencePatterns` the `schedule` has on the provided `date`.
 *
 * - Pass the `cleanEXDates: true` option to also remove any `exdates` which
 *   no longer intersect with the `schedule`.
 *
 * _See the `rule-tools` docs for more information on available RecurrencePatterns._
 */
export function endScheduleRecurrencePattern<S extends IScheduleLike<any>>(
  pattern: RecurrencePattern,
  date: DateInput<DateAdapterFor<S>>,
  schedule: S,
  options: { dateAdapter?: DateAdapterFor<S>; cleanEXDates?: boolean } = {},
): S {
  schedule = schedule.set(
    'rrules',
    schedule.rrules.map(rule =>
      isRecurrencePattern(pattern, date, rule, options) ? rule.set('end', date) : rule,
    ),
  ) as S;

  if (options.cleanEXDates) {
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
export function removeSchedulePattern<S extends IScheduleLike<any>>(
  pattern: Pattern,
  date: DateInput<DateAdapterFor<S>>,
  schedule: S,
  options: { dateAdapter?: DateAdapterFor<S>; cleanEXDates?: boolean } = {},
): S {
  if (pattern === 'date') {
    schedule = schedule.remove('rdate', date) as S;
  } else {
    schedule = schedule.set(
      'rrules',
      schedule.rrules.filter(rule => !isRecurrencePattern(pattern, date, rule, options)),
    ) as S;
  }

  // Remove any exdates that are no longer needed
  if (options.cleanEXDates) {
    schedule = cleanScheduleEXDates(schedule);
  }

  return schedule;
}

/**
 * Remove all of the schedule's `exdates` which do not intersect the schedule's
 * occurrences.
 */
export function cleanScheduleEXDates<S extends IScheduleLike<any>>(schedule: S): S {
  const options = {
    dateAdapter: schedule.dateAdapter as typeof DateAdapter,
    timezone: schedule.timezone,
  };

  const intersectingExDates = new Calendar<typeof DateAdapter>({
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

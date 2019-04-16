import {
  Calendar,
  DateAdapter,
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
export function scheduleHasPattern<T extends typeof DateAdapter>(
  type: Pattern,
  date: DateInput<T>,
  schedule: IScheduleLike<T>,
  options: {
    dateAdapter?: T | undefined;
    ignoreStart?: boolean | undefined;
    ignoreEnd?: boolean | undefined;
  } = {},
): boolean {
  if (type === 'date') {
    return schedule.rdates.occursOn({ date });
  }

  return schedule.rrules.some(rule => isRecurrencePattern(type, date, rule, options));
}

/**
 * Adds the `OccurrencePattern` or `RecurrencePattern` to the `schedule` on the provided `date`.
 *
 *  _See the `rule-tools` docs for more information on available `OccurrencePattern`_
 * _and `RecurrencePatterns`._
 */
export function addSchedulePattern<
  T extends typeof DateAdapter,
  // use of `any` is needed because of https://github.com/Microsoft/TypeScript/issues/30975
  R extends IScheduleLike<any> = IScheduleLike<any>
>(pattern: Pattern, date: DateInput<T>, schedule: R, options: { dateAdapter?: T } = {}): R {
  if (pattern === 'date') {
    return schedule.add('rdate', date) as R;
  }

  return schedule.add(
    'rrule',
    new Rule(buildRecurrencePattern(pattern, date, options), options),
  ) as R;
}

/**
 * End any matching `RecurrencePatterns` the `schedule` has on the provided `date`.
 *
 * - Pass the `cleanEXDates: true` option to also remove any `exdates` which
 *   no longer intersect with the `schedule`.
 *
 * _See the `rule-tools` docs for more information on available RecurrencePatterns._
 */
export function endScheduleRecurrencePattern<
  T extends typeof DateAdapter,
  // use of `any` is needed because of https://github.com/Microsoft/TypeScript/issues/30975
  R extends IScheduleLike<any> = IScheduleLike<any>
>(
  type: RecurrencePattern,
  date: DateInput<T>,
  schedule: R,
  options: { dateAdapter?: T; cleanEXDates?: boolean } = {},
): R {
  schedule = schedule.set(
    'rrules',
    schedule.rrules.map(rule =>
      isRecurrencePattern(type, date, rule, options) ? rule.set('end', date) : rule,
    ),
  ) as R;

  if (options.cleanEXDates) {
    schedule = cleanScheduleEXDates(schedule as any);
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
export function removeSchedulePattern<
  T extends typeof DateAdapter,
  // use of `any` is needed because of https://github.com/Microsoft/TypeScript/issues/30975
  R extends IScheduleLike<any> = IScheduleLike<any>
>(
  pattern: Pattern,
  date: DateInput<T>,
  schedule: R,
  options: { dateAdapter?: T; cleanEXDates?: boolean } = {},
): R {
  if (pattern === 'date') {
    schedule = schedule.remove('rdate', date) as R;
  } else {
    schedule = schedule.set(
      'rrules',
      schedule.rrules.filter(rule => !isRecurrencePattern(pattern, date, rule, options)),
    ) as R;
  }

  // Remove any exdates that are no longer needed
  if (options.cleanEXDates) {
    schedule = cleanScheduleEXDates(schedule as any);
  }

  return schedule;
}

/**
 * Remove all of the schedule's `exdates` which do not intersect the schedule's
 * occurrences.
 */
export function cleanScheduleEXDates<
  T extends typeof DateAdapter,
  // use of `any` is needed because of https://github.com/Microsoft/TypeScript/issues/30975
  R extends IScheduleLike<any> = IScheduleLike<any>
>(schedule: R): R {
  const options = {
    dateAdapter: schedule.dateAdapter,
    timezone: schedule.timezone,
  };

  const intersectingExDates = new Calendar<T>({
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

  return schedule.set('exdates', schedule.exdates.set('dates', intersectingExDates)) as R;
}

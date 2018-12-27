import {
  DateAdapter,
  DateAdapterBase,
  DateAdapterConstructor,
  DateProp,
  IDateAdapter,
  IDateAdapterConstructor,
} from '../date-adapter';
import { DateTime } from '../date-time';

/**
 * This function performs validation checks on the provided rule options and retuns
 * a cloned validated options object.
 */
export function buildValidatedRuleOptions<T extends DateAdapterConstructor>(
  dateAdapterConstructor: T,
  options: Options.ProvidedOptions<T>,
): Options.ProcessedOptions<T> {
  // hack to trick typescript into inferring the correct types
  const dateAdapter: IDateAdapterConstructor<T> = dateAdapterConstructor as any;

  const start = DateAdapterBase.isInstance(options.start)
    ? options.start
    : new dateAdapter(options.start);

  let until: DateAdapter<T> | undefined;

  if (options.until) {
    until = DateAdapterBase.isInstance(options.until)
      ? options.until.set('timezone', start.get('timezone'))
      : new dateAdapter(options.until).set('timezone', start.get('timezone'));
  }

  if (options.interval !== undefined && options.interval < 1) {
    throw new RuleValidationError('"interval" cannot be less than 1');
  }
  if (
    options.bySecondOfMinute !== undefined &&
    options.bySecondOfMinute.some(num => num < 0 || num > 60)
  ) {
    throw new RuleValidationError(
      '"bySecondOfMinute" values must be >= 0 && <= 60',
    );
  }
  if (
    options.byMinuteOfHour !== undefined &&
    options.byMinuteOfHour.some(num => num < 0 || num > 59)
  ) {
    throw new RuleValidationError(
      '"byMinuteOfHour" values must be >= 0 && <= 59',
    );
  }
  if (
    options.byHourOfDay !== undefined &&
    options.byHourOfDay.some(num => num < 0 || num > 23)
  ) {
    throw new RuleValidationError('"byHourOfDay" values must be >= 0 && <= 23');
  }
  if (
    !['YEARLY', 'MONTHLY'].includes(options.frequency) &&
    options.byDayOfWeek !== undefined &&
    options.byDayOfWeek.some(weekday => Array.isArray(weekday))
  ) {
    throw new RuleValidationError(
      '"byDayOfWeek" can only include a numeric value when the "frequency" is ' +
        'either "MONTHLY" or "YEARLY"',
    );
  }
  if (
    options.frequency === 'MONTHLY' &&
    options.byDayOfWeek !== undefined &&
    options.byDayOfWeek.some(
      weekday =>
        Array.isArray(weekday) &&
        (weekday[1] < -31 || weekday[1] === 0 || weekday[1] > 31),
    )
  ) {
    throw new RuleValidationError(
      'when "frequency" is "MONTHLY", each "byDayOfWeek" can optionally only' +
        ' have a numeric value >= -31 and <= 31 and !== 0',
    );
  }
  if (
    options.frequency === 'YEARLY' &&
    options.byDayOfWeek !== undefined &&
    options.byDayOfWeek.some(
      weekday =>
        Array.isArray(weekday) &&
        (weekday[1] < -366 || weekday[1] === 0 || weekday[1] > 366),
    )
  ) {
    throw new RuleValidationError(
      'when "frequency" is "YEARLY", each "byDayOfWeek" can optionally only' +
        ' have a numeric value >= -366 and <= 366 and !== 0',
    );
  }
  if (options.frequency === 'WEEKLY' && options.byDayOfMonth !== undefined) {
    throw new RuleValidationError(
      'when "frequency" is "WEEKLY", "byDayOfMonth" cannot be present',
    );
  }
  if (options.until !== undefined && options.count !== undefined) {
    throw new RuleValidationError('"until" and "count" cannot both be present');
  }
  // if (options.until !== undefined && !options.until!.isSameClass(start)) {
  //   throw new RuleValidationError(
  //     '"until" and "start" must both be of the same class'
  //   )
  // }

  if (options.byMonthOfYear) {
    options.byMonthOfYear.sort((a, b) => {
      if (a > b) {
        return 1;
      } else if (b > a) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  if (options.byHourOfDay) {
    options.byHourOfDay.sort((a, b) => {
      if (a > b) {
        return 1;
      } else if (b > a) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  if (options.byMinuteOfHour) {
    options.byMinuteOfHour.sort((a, b) => {
      if (a > b) {
        return 1;
      } else if (b > a) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  if (options.bySecondOfMinute) {
    options.bySecondOfMinute.sort((a, b) => {
      if (a > b) {
        return 1;
      } else if (b > a) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  const defaultOptions: any = {
    timezone: start.get('timezone'),
    frequency: options.frequency,
    interval: 1,
    weekStart: 'MO',
  };

  if (!(options.byDayOfMonth || options.byDayOfWeek)) {
    switch (options.frequency) {
      case 'YEARLY':
        defaultOptions.byMonthOfYear = [
          start.get('month'),
        ] as Options.ByMonthOfYear[];
      case 'MONTHLY':
        defaultOptions.byDayOfMonth = [
          start.get('day'),
        ] as Options.ByDayOfMonth[];
        break;
      case 'WEEKLY':
        defaultOptions.byDayOfWeek = [
          start.get('weekday'),
        ] as Options.ByDayOfWeek[];
        break;
    }
  }

  switch (options.frequency) {
    case 'YEARLY':
    case 'MONTHLY':
    case 'WEEKLY':
    case 'DAILY':
      defaultOptions.byHourOfDay = [start.get('hour')] as Options.ByHourOfDay[];
    case 'HOURLY':
      defaultOptions.byMinuteOfHour = [
        start.get('minute'),
      ] as Options.ByMinuteOfHour[];
    case 'MINUTELY':
      defaultOptions.bySecondOfMinute = [
        start.get('second'),
      ] as Options.BySecondOfMinute[];
  }

  return {
    ...defaultOptions,
    ...options,
    start,
    until,
  };
}

class RuleValidationError extends Error {}

export namespace Options {
  export type Frequency =
    | 'SECONDLY'
    | 'MINUTELY'
    | 'HOURLY'
    | 'DAILY'
    | 'WEEKLY'
    | 'MONTHLY'
    | 'YEARLY';

  /**
   * The ByDayOfWeek type corresponds to either a two letter string for the weekday
   * (i.e. 'SU', 'MO', etc) or an array of length two containing a weekday string
   * and a number, in that order. The number describes the position of the weekday
   * in the month / year (depending on other rules). It's explained pretty well
   * in the [ICAL spec](https://tools.ietf.org/html/rfc5545#section-3.3.10).
   * If the number is negative, it is calculated from the end of
   * the month / year.
   */
  export type ByDayOfWeek =
    | IDateAdapter.Weekday
    | [IDateAdapter.Weekday, number];

  export interface ProvidedOptions<T extends DateAdapterConstructor> {
    start: DateProp<T> | DateAdapter<T>;
    frequency: Frequency;
    interval?: number;
    bySecondOfMinute?: BySecondOfMinute[];
    byMinuteOfHour?: ByMinuteOfHour[];
    byHourOfDay?: ByHourOfDay[];
    byDayOfWeek?: ByDayOfWeek[];
    byDayOfMonth?: ByDayOfMonth[];
    byMonthOfYear?: ByMonthOfYear[];
    until?: DateProp<T> | DateAdapter<T>;
    count?: number;
    weekStart?: IDateAdapter.Weekday;
  }

  export interface ProcessedOptions<T extends DateAdapterConstructor> {
    frequency: Frequency;
    interval: number;
    start: DateAdapter<T>;
    until?: DateAdapter<T>;
    count?: number;
    weekStart: DateTime.Weekday;
    byMonthOfYear?: ByMonthOfYear[];
    byDayOfMonth?: ByDayOfMonth[];
    byDayOfWeek?: ByDayOfWeek[];
    byHourOfDay: ByHourOfDay[];
    byMinuteOfHour: ByMinuteOfHour[];
    bySecondOfMinute: BySecondOfMinute[];
  }

  export type BySecondOfMinute = ByMinuteOfHour | 60;

  export type ByMonthOfYear = IDateAdapter.IMonth;

  // >= 0 && <= 59
  export type ByMinuteOfHour =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
    | 24
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31
    | 32
    | 33
    | 34
    | 35
    | 36
    | 37
    | 38
    | 39
    | 40
    | 41
    | 42
    | 43
    | 44
    | 45
    | 46
    | 47
    | 48
    | 49
    | 50
    | 51
    | 52
    | 53
    | 54
    | 55
    | 56
    | 57
    | 58
    | 59;

  export type ByHourOfDay =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23;

  // >= -31 && <= 31 && !== 0
  export type ByDayOfMonth =
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
    | 24
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31
    | -1
    | -2
    | -3
    | -4
    | -5
    | -6
    | -7
    | -8
    | -9
    | -10
    | -11
    | -12
    | -13
    | -14
    | -15
    | -16
    | -17
    | -18
    | -19
    | -20
    | -21
    | -22
    | -23
    | -24
    | -25
    | -26
    | -27
    | -28
    | -29
    | -30
    | -31;

  export type ByWeekOfMonth = 1 | 2 | 3 | 4 | 5 | -1 | -2 | -3 | -4;
}

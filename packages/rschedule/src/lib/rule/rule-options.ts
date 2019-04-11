import { DateAdapter } from '../date-adapter';
import { DateTime, IDateAdapter } from '../date-time';
import { cloneJSON, ConstructorReturnType, numberSortComparer } from '../utilities';

/**
 * This function performs validation checks on the provided rule options and retuns
 * a cloned validated options object.
 */
export function normalizeRuleOptions<T extends typeof DateAdapter>(
  dateAdapterConstructor: T,
  options: IProvidedRuleOptions<T>,
): INormalizedRuleOptions {
  let start: DateTime;

  if (dateAdapterConstructor.isInstance(options.start)) {
    start = options.start.toDateTime();
  } else if (dateAdapterConstructor.isDate(options.start)) {
    start = new dateAdapterConstructor(options.start).toDateTime();
  } else {
    throw new RuleValidationError(
      '"start" must be either a `DateAdapter` instance or an instance of the ' +
        'date a DateAdapter is wrapping (e.g. `StandardDateAdapter` wraps a `Date`)',
    );
  }

  let end: DateTime | undefined;

  if (options.end) {
    if (dateAdapterConstructor.isInstance(options.end)) {
      end = options.end.toDateTime();
    } else if (dateAdapterConstructor.isDate(options.end)) {
      end = new dateAdapterConstructor(options.end).toDateTime();
    } else {
      throw new RuleValidationError(
        '"end" must be either be `undefined`, a `DateAdapter` instance, or an instance of the ' +
          'date a DateAdapter is wrapping (e.g. `StandardDateAdapter` wraps a `Date`)',
      );
    }
  }

  if (options.interval !== undefined && options.interval < 1) {
    throw new RuleValidationError('"interval" cannot be less than 1');
  }

  if (options.duration !== undefined && options.duration <= 0) {
    throw new RuleValidationError('"duration" must be greater than 0');
  }

  if (
    options.bySecondOfMinute !== undefined &&
    options.bySecondOfMinute.some(num => num < 0 || num > 60)
  ) {
    throw new RuleValidationError('"bySecondOfMinute" values must be >= 0 && <= 60');
  }

  if (
    options.byMinuteOfHour !== undefined &&
    options.byMinuteOfHour.some(num => num < 0 || num > 59)
  ) {
    throw new RuleValidationError('"byMinuteOfHour" values must be >= 0 && <= 59');
  }

  if (options.byHourOfDay !== undefined && options.byHourOfDay.some(num => num < 0 || num > 23)) {
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
        Array.isArray(weekday) && (weekday[1] < -31 || weekday[1] === 0 || weekday[1] > 31),
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
        Array.isArray(weekday) && (weekday[1] < -366 || weekday[1] === 0 || weekday[1] > 366),
    )
  ) {
    throw new RuleValidationError(
      'when "frequency" is "YEARLY", each "byDayOfWeek" can optionally only' +
        ' have a numeric value >= -366 and <= 366 and !== 0',
    );
  }

  if (options.frequency === 'WEEKLY' && options.byDayOfMonth !== undefined) {
    throw new RuleValidationError('when "frequency" is "WEEKLY", "byDayOfMonth" cannot be present');
  }

  if (options.end !== undefined && options.count !== undefined) {
    throw new RuleValidationError('"end" and "count" cannot both be present');
  }

  if (options.byMonthOfYear) {
    options.byMonthOfYear.sort(numberSortComparer);
  }

  if (options.byHourOfDay) {
    options.byHourOfDay.sort(numberSortComparer);
  }

  if (options.byMinuteOfHour) {
    options.byMinuteOfHour.sort(numberSortComparer);
  }

  if (options.bySecondOfMinute) {
    options.bySecondOfMinute.sort(numberSortComparer);
  }

  const normalizedOptions: INormalizedRuleOptions = {
    ...options,
    start,
    end,
    count: options.count,
    frequency: options.frequency,
    interval: options.interval || 1,
    weekStart: options.weekStart || 'MO',
  };

  if (!(options.byDayOfMonth || options.byDayOfWeek)) {
    switch (options.frequency) {
      case 'YEARLY': {
        if (!options.byMonthOfYear) {
          normalizedOptions.byMonthOfYear = [start.get('month')] as RuleOption.ByMonthOfYear[];
        }
      }
      case 'MONTHLY':
        normalizedOptions.byDayOfMonth = [start.get('day')] as RuleOption.ByDayOfMonth[];
        break;
      case 'WEEKLY':
        normalizedOptions.byDayOfWeek = [start.get('weekday')] as RuleOption.ByDayOfWeek[];
        break;
    }
  }

  switch (options.frequency) {
    case 'YEARLY':
    case 'MONTHLY':
    case 'WEEKLY':
    case 'DAILY': {
      if (!options.byHourOfDay) {
        normalizedOptions.byHourOfDay = [start.get('hour')] as RuleOption.ByHourOfDay[];
      }
    }
    case 'HOURLY': {
      if (!options.byMinuteOfHour) {
        normalizedOptions.byMinuteOfHour = [start.get('minute')] as RuleOption.ByMinuteOfHour[];
      }
    }
    case 'MINUTELY': {
      if (!options.bySecondOfMinute) {
        normalizedOptions.bySecondOfMinute = [start.get('second')] as RuleOption.BySecondOfMinute[];
      }
    }
    case 'SECONDLY': {
      normalizedOptions.byMillisecondOfSecond = [
        start.get('millisecond'),
      ] as RuleOption.ByMillisecondOfSecond[];
    }
  }

  return normalizedOptions;
}

export function normalizeDateInput<T extends typeof DateAdapter>(
  input: T['date'] | ConstructorReturnType<T> | IDateAdapter.JSON,
  dateAdapter: T,
) {
  return DateAdapter.isInstance(input)
    ? input.toDateTime()
    : dateAdapter.isDate(input)
    ? new dateAdapter(input).toDateTime()
    : dateAdapter.fromJSON(input as IDateAdapter.JSON).toDateTime();
}

export function cloneRuleOptions<
  T extends typeof DateAdapter,
  O extends IProvidedRuleOptions<T> | INormalizedRuleOptions
>(options: O): O {
  const obj = { ...options };
  delete obj.start;
  delete obj.end;
  const clone = cloneJSON(obj);
  clone.start = options.start;
  clone.end = options.end;
  return clone;
}

export class RuleValidationError extends Error {}

export interface IProvidedRuleOptions<T extends typeof DateAdapter> {
  start: RuleOption.Start<T>;
  end?: RuleOption.End<T>;
  duration?: RuleOption.Duration;
  frequency: RuleOption.Frequency;
  interval?: RuleOption.Interval;
  count?: RuleOption.Count;
  weekStart?: RuleOption.WeekStart;
  bySecondOfMinute?: RuleOption.BySecondOfMinute[];
  byMinuteOfHour?: RuleOption.ByMinuteOfHour[];
  byHourOfDay?: RuleOption.ByHourOfDay[];
  byDayOfWeek?: RuleOption.ByDayOfWeek[];
  byDayOfMonth?: RuleOption.ByDayOfMonth[];
  byMonthOfYear?: RuleOption.ByMonthOfYear[];
}

export interface INormalizedRuleOptions {
  start: DateTime;
  end?: DateTime;
  duration?: number;
  frequency: RuleOption.Frequency;
  interval: RuleOption.Interval;
  count?: RuleOption.Count;
  weekStart: RuleOption.WeekStart;
  byMillisecondOfSecond?: RuleOption.ByMillisecondOfSecond[];
  bySecondOfMinute?: RuleOption.BySecondOfMinute[];
  byMinuteOfHour?: RuleOption.ByMinuteOfHour[];
  byHourOfDay?: RuleOption.ByHourOfDay[];
  byDayOfWeek?: RuleOption.ByDayOfWeek[];
  byDayOfMonth?: RuleOption.ByDayOfMonth[];
  byMonthOfYear?: RuleOption.ByMonthOfYear[];
}

export namespace RuleOption {
  export type Start<T extends typeof DateAdapter> = T['date'] | ConstructorReturnType<T>;

  export type End<T extends typeof DateAdapter> = Start<T>;

  export type Duration = number;

  export type Interval = number;

  export type Count = number;

  export type WeekStart = IDateAdapter.Weekday;

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
  export type ByDayOfWeek = IDateAdapter.Weekday | [IDateAdapter.Weekday, number];

  export type ByMillisecondOfSecond = number;

  export type BySecondOfMinute = ByMinuteOfHour | 60;

  export type ByMonthOfYear = IDateAdapter.Month;

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

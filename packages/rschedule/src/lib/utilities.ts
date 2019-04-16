import { ArgumentError, ConstructorReturnType } from './basic-utilities';
import { DateAdapter } from './date-adapter';
import { DateTime } from './date-time';
import { RScheduleConfig } from './rschedule-config';

export type DateInput<T extends typeof DateAdapter> =
  | T['date']
  | ConstructorReturnType<T>
  | DateTime;

export function dateInputToDateAdapter<T extends typeof DateAdapter>(
  date: DateInput<T>,
  dateAdapter?: T,
): ConstructorReturnType<T> {
  dateAdapter = dateAdapter || (RScheduleConfig.defaultDateAdapter as T | undefined);

  if (!dateAdapter) {
    throw new ArgumentError(
      'No `dateAdapter` option provided and `RScheduleConfig.defaultDateAdapter` not set.',
    );
  }

  if (DateTime.isInstance(date)) {
    return dateAdapter.fromDateTime(date) as ConstructorReturnType<T>;
  }

  return DateAdapter.isInstance(date) ? date : (new dateAdapter(date) as ConstructorReturnType<T>);
}

export function dateInputToDateTime<T extends typeof DateAdapter>(
  date: DateInput<T>,
  timezone: string | null,
  dateAdapter?: T,
): DateTime {
  dateAdapter = dateAdapter || (RScheduleConfig.defaultDateAdapter as T | undefined);

  if (!dateAdapter) {
    throw new ArgumentError(
      'No `dateAdapter` option provided and `RScheduleConfig.defaultDateAdapter` not set.',
    );
  }

  if (DateTime.isInstance(date)) {
    if (date.timezone !== timezone) {
      return dateAdapter
        .fromDateTime(date)
        .set('timezone', timezone)
        .toDateTime();
    }

    return date;
  }

  return DateAdapter.isInstance(date)
    ? date.set('timezone', timezone).toDateTime()
    : new dateAdapter(date).set('timezone', timezone).toDateTime();
}

export function normalizeDateTimeTimezone<T extends typeof DateAdapter>(
  date: DateTime,
  timezone: string | null,
  dateAdapter?: T,
): DateTime {
  dateAdapter = dateAdapter || (RScheduleConfig.defaultDateAdapter as T | undefined);

  if (!dateAdapter) {
    throw new ArgumentError(
      'No `dateAdapter` option provided and `RScheduleConfig.defaultDateAdapter` not set.',
    );
  }

  if (date.timezone !== timezone) {
    return dateAdapter
      .fromDateTime(date)
      .set('timezone', timezone)
      .toDateTime();
  }

  return date;
}

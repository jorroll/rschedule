import { ArgumentError } from './basic-utilities';
import { DateAdapter } from './date-adapter';
import { DateTime } from './date-time';
import { RScheduleConfig } from './rschedule-config';

export type DateInput<T extends typeof DateAdapter> = T['date'] | InstanceType<T> | DateTime;

// tslint:disable-next-line: no-empty-interface
interface ITypedWithDateAdapter<T extends typeof DateAdapter> {}

// tslint:disable-next-line: no-empty-interface
interface ITypedWithDateAdapterAndData<T extends typeof DateAdapter, D = any> {}

export type DateAdapterFor<O> = O extends ITypedWithDateAdapter<infer A> ? A : never;

export type DataFor<O> = O extends ITypedWithDateAdapterAndData<any, infer D> ? D : never;

export function dateInputToDateAdapter<T extends typeof DateAdapter>(
  date: DateInput<T>,
  dateAdapter?: T,
): InstanceType<T> {
  dateAdapter = dateAdapter || (RScheduleConfig.defaultDateAdapter as T | undefined);

  if (!dateAdapter) {
    throw new ArgumentError(
      'No `dateAdapter` option provided and `RScheduleConfig.defaultDateAdapter` not set.',
    );
  }

  if (DateTime.isInstance(date)) {
    return dateAdapter.fromDateTime(date) as InstanceType<T>;
  }

  return DateAdapter.isInstance(date) ? date : (new dateAdapter(date) as InstanceType<T>);
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

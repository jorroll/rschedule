import { DateAdapter, DateTime } from '@rschedule/core';
import getNextWeekday from './get-next-weekday';

export default function getNthWeekdayOfMonth(
  date: DateTime,
  weekday: DateAdapter.Weekday,
  nth: number,
): DateTime {
  let base = date.set('day', 1);

  if (nth < 0) {
    base = base.add(1, 'month');
  }

  base = getNextWeekday(base, weekday);

  // when nth is negative, adding it will act as subtraction
  return nth < 0 ? base.add(nth, 'week') : base.add(nth - 1, 'week');
}

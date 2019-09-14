import { DateAdapter, DateTime } from '@rschedule/core';
import getNextWeekday from './get-next-weekday';

export default function getNthWeekdayOfYear(
  date: DateTime,
  weekday: DateAdapter.Weekday,
  nth: number,
) {
  let base = date.set('month', 1).set('day', 1);

  if (nth < 0) {
    base = base.add(1, 'year');
  }

  base = getNextWeekday(base, weekday);

  // when nth is negative, adding it will act as subtraction
  return nth < 0 ? base.add(nth, 'week') : base.add(nth - 1, 'week');
}

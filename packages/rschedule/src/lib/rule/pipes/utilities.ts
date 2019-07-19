import { DateTime, IDateAdapter, WEEKDAYS } from '../../date-time';

export function getDifferenceBetweenWeekdays(x: IDateAdapter.Weekday, y: IDateAdapter.Weekday) {
  if (x === y) return 0;

  const result = WEEKDAYS.indexOf(x) - WEEKDAYS.indexOf(y);

  return result > 0 ? 7 - result : Math.abs(result);
}

export function getNextWeekday(date: DateTime, weekday: IDateAdapter.Weekday) {
  return date.add(getDifferenceBetweenWeekdays(date.get('weekday'), weekday), 'day');
}

export function getPreviousWeekday(date: DateTime, weekday: IDateAdapter.Weekday) {
  const diff = getDifferenceBetweenWeekdays(date.get('weekday'), weekday);

  return date.subtract(diff === 0 ? 0 : 7 - diff, 'day');
}

export function getNthWeekdayOfMonth(date: DateTime, weekday: IDateAdapter.Weekday, nth: number) {
  let base = date.set('day', 1);

  if (nth < 0) {
    base = base.add(1, 'month');
  }

  base = getNextWeekday(base, weekday);

  // when nth is negative, adding it will act as subtraction
  return nth < 0 ? base.add(nth, 'week') : base.add(nth - 1, 'week');
}

export function getNthWeekdayOfYear(date: DateTime, weekday: IDateAdapter.Weekday, nth: number) {
  let base = date.set('month', 1).set('day', 1);

  if (nth < 0) {
    base = base.add(1, 'year');
  }

  base = getNextWeekday(base, weekday);

  // when nth is negative, adding it will act as subtraction
  return nth < 0 ? base.add(nth, 'week') : base.add(nth - 1, 'week');
}

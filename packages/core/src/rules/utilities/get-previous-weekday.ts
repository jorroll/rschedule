import { DateAdapter, DateTime, getDifferenceBetweenWeekdays } from '@rschedule/core';

export function getPreviousWeekday(date: DateTime, weekday: DateAdapter.Weekday): DateTime {
  const diff = getDifferenceBetweenWeekdays(date.get('weekday'), weekday);

  return date.subtract(diff === 0 ? 0 : 7 - diff, 'day');
}

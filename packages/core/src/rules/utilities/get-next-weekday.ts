import { DateAdapter, DateTime, getDifferenceBetweenWeekdays } from '@rschedule/core';

export default function getNextWeekday(date: DateTime, weekday: DateAdapter.Weekday) {
  return date.add(getDifferenceBetweenWeekdays(date.get('weekday'), weekday), 'day');
}

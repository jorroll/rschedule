export type RecurrencePattern =
  | 'every [WEEKDAY]'
  | 'the [MONTH_WEEKNO] [WEEKDAY] of every month'
  | 'the [MONTH_DAYNO] of every month'
  | 'the last [WEEKDAY] of every month';

export type OccurrencePattern = 'date';

export type Pattern = OccurrencePattern | RecurrencePattern;

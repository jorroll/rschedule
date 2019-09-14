import {
  DateTime,
  IRecurrenceRule,
  IRecurrenceRulesIterator,
  RecurrenceRuleResult,
} from '@rschedule/core';

export abstract class RecurrenceRule<T> implements IRecurrenceRule {
  start: DateTime;
  end?: DateTime;
  options: T;

  constructor(protected processor: IRecurrenceRulesIterator<T>) {
    this.start = processor.start;
    this.end = processor.end;
    this.options = processor.options;
  }

  abstract run(date: DateTime): RecurrenceRuleResult;
}

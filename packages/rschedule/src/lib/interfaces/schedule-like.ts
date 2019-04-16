import { DateAdapter } from '../date-adapter';
import { Dates } from '../dates';
import { Rule } from '../rule';
import { DateInput } from '../utilities';
import { IOccurrenceGenerator } from './occurrence-generator';

export interface IScheduleLike<T extends typeof DateAdapter> extends IOccurrenceGenerator<T> {
  readonly rrules: ReadonlyArray<Rule<T>>;
  readonly exrules: ReadonlyArray<Rule<T>>;
  readonly rdates: Dates<T>;
  readonly exdates: Dates<T>;

  add(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): IScheduleLike<T>;
  add(prop: 'rdate' | 'exdate', value: DateInput<T>): IScheduleLike<T>;

  remove(prop: 'rrule' | 'exrule', value: Rule<T, unknown>): IScheduleLike<T>;
  remove(prop: 'rdate' | 'exdate', value: DateInput<T>): IScheduleLike<T>;

  set(prop: 'timezone', value: string | null): IScheduleLike<T>;
  set(prop: 'rrules' | 'exrules', value: Rule<T, unknown>[]): IScheduleLike<T>;
  set(prop: 'rdates' | 'exdates', value: Dates<T, unknown>): IScheduleLike<T>;
}

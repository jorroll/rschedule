import {
  DateAdapter,
  DateTime,
  InvalidDateTime,
  RecurrenceRuleResult,
  ValidDateTime,
} from '@rschedule/core';
import { INormFrequencyRuleOptions } from '../Frequency';
import { RecurrenceRuleBase } from './recurrence-rule-base';

/**
 * Contains shared logic for ByHourOfDay, ByMinuteOfHour,
 * BySecondOfMinute, and ByMillisecondOfSecond rule pipes
 */
export default abstract class ByTimeOfUnitRule<
  T extends INormFrequencyRuleOptions
> extends RecurrenceRuleBase<T> {
  protected abstract readonly baseGranularity: DateAdapter.TimeUnit;
  protected abstract readonly granularity: DateAdapter.TimeUnit;
  protected abstract readonly option: number[];

  run(date: DateTime): RecurrenceRuleResult {
    // e.g. const currentTime = date.get('hour');
    const currentTime = date.get(this.granularity as any);

    // e.g. for (const time of this.options.byHourOfDay) {
    for (const time of this.option) {
      if (currentTime > time) continue;

      if (currentTime === time) {
        return this.validateDate(new ValidDateTime(date));
      }

      // e.g. return this.nextValidDate(args, date.granularity('day').set('hour', time));
      return this.validateDate(
        new InvalidDateTime(date.granularity(this.baseGranularity).set(this.granularity, time)),
      );
    }

    return this.validateDate(
      new InvalidDateTime(
        date
          // e.g. .granularity('day')
          .granularity(this.baseGranularity)
          // e.g. .add(1, 'day')
          .add(1, this.baseGranularity)
          // e.g. .set('hour', this.options.byHourOfDay[0]);
          .set(this.granularity, this.option[0]),
      ),
    );
  }
}

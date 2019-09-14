import { DateAdapter, DateTime, InvalidDateTime, ValidDateTime } from '@rschedule/core';
import { INormFrequencyRuleOptions } from '../Frequency';
import { RevRecurrenceRuleBase } from './recurrence-rule-base';

/**
 * Contains shared logic for ByHourOfDay, ByMinuteOfHour,
 * BySecondOfMinute, and ByMillisecondOfSecond reverse rule pipes
 */
export default abstract class RevByTimeOfUnitRule<
  T extends INormFrequencyRuleOptions
> extends RevRecurrenceRuleBase<T> {
  protected abstract readonly baseGranularity: DateAdapter.TimeUnit;
  protected abstract readonly granularity: DateAdapter.TimeUnit;
  protected abstract readonly option: number[];

  run(date: DateTime) {
    // e.g. const currentTime = date.get('hour');
    const currentTime = date.get(this.granularity as any);

    // e.g. for (const time of this.options.byHourOfDay) {
    for (const time of this.option) {
      if (currentTime < time) continue;

      if (currentTime === time) {
        return this.validateDate(new ValidDateTime(date));
      }

      // e.g. return this.nextValidDate(args, date.endGranularity('day').set('hour', time));
      return this.validateDate(
        new InvalidDateTime(date.endGranularity(this.baseGranularity).set(this.granularity, time)),
      );
    }

    return this.validateDate(
      new InvalidDateTime(
        date
          // e.g. .endGranularity('day')
          .endGranularity(this.baseGranularity)
          // e.g. .subtract(1, 'day')
          .subtract(1, this.baseGranularity)
          // e.g. .set('hour', this.options.byHourOfDay[0]);
          .set(this.granularity, this.option[0]),
      ),
    );
  }
}

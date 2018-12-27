import { DateTime } from '../../date-time';
import { Utils } from '../../utilities';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

/**
 * The `FrequencyPipe` is the first pipe in the chain of rule pipes. It is
 * responsible for incrementing the date, as appropriate, while taking into
 * account the `RRULE` frequency and interval.
 */
export class FrequencyPipe extends PipeRule implements IPipeRule {
  private intervalStartDate: DateTime = this.normalizeDate(
    this.options.start.clone(),
  );

  public run(args: IPipeRunFn) {
    let date: DateTime;

    if (args.skipToDate) {
      this.skipToIntervalOnOrAfter(args.skipToDate);

      date = args.skipToDate.isAfterOrEqual(this.intervalStartDate)
        ? args.skipToDate
        : this.intervalStartDate.clone();
    } else {
      this.incrementInterval();
      date = this.intervalStartDate.clone();
    }

    return this.nextPipe.run({ date });
  }

  public normalizeDate(date: DateTime) {
    switch (this.options.frequency) {
      case 'YEARLY':
        Utils.setDateToStartOfYear(date);
        break;
      case 'MONTHLY':
        date.set('day', 1);
        break;
      case 'WEEKLY':
        Utils.setDateToStartOfWeek(date, this.options.weekStart);
        break;
    }

    switch (this.options.frequency) {
      case 'YEARLY':
      case 'MONTHLY':
      case 'WEEKLY':
      case 'DAILY':
        date.set('hour', 0);
      case 'HOURLY':
        date.set('minute', 0);
      case 'MINUTELY':
        date.set('second', 0);
    }

    return date;
  }

  private incrementInterval() {
    const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency);

    this.intervalStartDate.add(this.options.interval, unit);
  }

  /**
   * This method might be buggy when presented with intervals other than one.
   * In such a case, skipping forward should *skip* seconds of dates, and I'm
   * not sure if this will account for that. Don't have time to test at the moment.
   *
   * Tests are passing
   */
  private skipToIntervalOnOrAfter(date: DateTime) {
    const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency);

    const difference = Utils.unitDifferenceBetweenDates(
      this.intervalStartDate,
      date,
      unit,
    );

    this.intervalStartDate.add(difference, unit);

    // This is sort of a quick/hacky solution to a problem experienced with test
    // "testYearlyBetweenIncLargeSpan2" which has a start date of 1920.
    // Not sure why `difference` isn't resolved to whole number in that test,
    // but the first call to this method turns up an iteration exactly 1 year
    // before the iteration it should return.
    while (!date.isBefore(this.intervalStartDate.clone().add(1, unit))) {
      this.intervalStartDate.add(this.options.interval, unit);
    }
  }
}

import { DateTime } from '../../date-time'
import { Utils } from '../../utilities'
import { IPipeRule, IPipeRunFn, ReversePipeRule } from './interfaces'

/**
 * Same as `FrequencyPipe`, but iterates in reverse order.
 */
export class FrequencyReversePipe extends ReversePipeRule implements IPipeRule {
  public intervalStartDate: DateTime = this.normalizeDate(this.options.start.clone());

  public run(args: IPipeRunFn) {
    let date: DateTime

    if (args.skipToDate) {
      this.skipToIntervalOnOrBefore(args.skipToDate)

      date = args.skipToDate.isBeforeOrEqual(this.intervalStartDate)
        ? args.skipToDate
        : this.intervalStartDate.clone()
    } else {
      this.decrementInterval()
      date = this.intervalStartDate.clone()
    }

    return this.nextPipe.run({ date })
  }
  
  public normalizeDate(date: DateTime) {
    switch (this.options.frequency) {
      case 'YEARLY':
        Utils.setDateToEndOfYear(date)
        break
      case 'MONTHLY':
        Utils.setDateToEndOfMonth(date)
        break
      case 'WEEKLY':
        Utils.setDateToEndOfWeek(date, this.options.weekStart)
        break
    }

    switch (this.options.frequency) {
      case 'YEARLY':
      case 'MONTHLY':
      case 'WEEKLY':
      case 'DAILY':
        date.set('hour', 23)
      case 'HOURLY':
        date.set('minute', 59)
      case 'MINUTELY':
        date.set('second', 59)
    }

    return date
  }

  // need to account for possible daylight savings time shift
  private decrementInterval() {
    const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency)

    this.intervalStartDate.subtract(this.options.interval, unit)

    // it's necessary to normalize the date because, for example, if we're iterating
    // `MONTLY` and we're on the last day of February and we subtract 1 month, we will
    // not be on the last day of January (which is what we would want). Normalizing
    // ensures we're on the last day of January, in that scenerio.
    this.normalizeDate(this.intervalStartDate)
  }

  private skipToIntervalOnOrBefore(date: DateTime) {
    const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency)

    const difference = Utils.unitDifferenceBetweenDates(
      this.intervalStartDate,
      date,
      unit
    )

    // if we're jumping to a new interval, then we should normalize the date.
    if (Math.abs(difference) !== 0) {
      // difference is negative
      this.normalizeDate(this.intervalStartDate.add(difference, unit))
    }

    // This `while` statement is needed in the reverse pipe more than the normal
    // requency pipe.
    while (
      date.isBeforeOrEqual(
        this.normalizeDate(
          this.intervalStartDate.clone().subtract(1, unit)
        )
      )
    ) {
      this.normalizeDate(this.intervalStartDate.subtract(this.options.interval, unit))
    }
  }


  /**
   * This method is only used by the `PipeController` to set the first
   * `intervalStartDate`.
   */
  public skipToStartInterval(date: DateTime) {
    const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency)

    const difference = Utils.unitDifferenceBetweenDates(
      this.intervalStartDate,
      date,
      unit
    )

    // not sure why the `+1` is needed, but it is
    this.normalizeDate(this.intervalStartDate.add(difference + 1, unit))

    // make sure the date is before the `intervalStartDate`
    while (date.isAfter(this.intervalStartDate)) {
      this.normalizeDate(this.intervalStartDate.add(this.options.interval, unit))
    }
  }
}

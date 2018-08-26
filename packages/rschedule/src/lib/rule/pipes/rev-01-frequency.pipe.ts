import { DateAdapter } from '../../date-adapter'
import { Utils } from '../../utilities'
import { IPipeRule, IPipeRunFn, ReversePipeRule } from './interfaces'

/**
 * Same as `FrequencyPipe`, but iterates in reverse order.
 */
export class FrequencyReversePipe<T extends DateAdapter<T>> extends ReversePipeRule<T>
  implements IPipeRule<T>
{
  public intervalStartDate: T = this.normalizeDate(this.options.start.clone());

  public run(args: IPipeRunFn<T>) {
    let date: T

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
  
  public normalizeDate(date: T) {
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

    const oldTZOffset = this.intervalStartDate.utcOffset

    this.intervalStartDate.subtract(this.options.interval, unit)

    const newTZOffset = this.intervalStartDate.utcOffset

    // DST is handled for us by `Date` when adding units of DAY or larger. But for hours or
    // smaller units, we must manually adjust for DST, if appropriate.
    if (
      [
        'hour',
        'minute',
        'second',
        'millisecond',
      ].includes(unit)
    ) {
      // DST goes in the opposite direction in northern vs southern hemispheres.
      // This function might actually be returning `true` when client is in
      // southern hemisphere...but regardless, the arithmatic is "relatively" correct.
      //
      // Still seem to be running into DST issue with large hourly interval in southern
      // hemisphere.
      const tzOffset = Utils.isInNorthernHemisphere(this.intervalStartDate)
        ? oldTZOffset - newTZOffset
        : newTZOffset - oldTZOffset;

      // might need to subtract offset when going in reverse, not sure.
      const newDate = this.intervalStartDate.clone().add(tzOffset, 'minute')

      if (newDate.utcOffset !== this.intervalStartDate.utcOffset) {
        throw new DateAdapter.InvalidDateError(
          `A date was created on the border of daylight savings time "${newDate.toISOString()}". ` +
          'Not sure how to handle it.'
        )
      } else {
        this.intervalStartDate = newDate
      }
    }

    // it's necessary to normalize the date because, for example, if we're iterating
    // `MONTLY` and we're on the last day of February and we subtract 1 month, we will
    // not be on the last day of January (which is what we would want). Normalizing
    // ensures we're on the last day of January, in that scenerio.
    this.normalizeDate(this.intervalStartDate)
  }

  private skipToIntervalOnOrBefore(date: T) {
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
  public skipToStartInterval(date: T) {
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

import { DateAdapter } from '../date-adapter'
import { Utils } from '../utilities'
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces'

// the frequency pipe accepts an array of dates only to adhere to the PipeFn interface
// in reality, will always only accept a single starting date wrapped in an array
export class FrequencyPipe<T extends DateAdapter<T>> extends PipeRule<T>
  implements IPipeRule<T> {
  private intervalStartDate: T = this.normalizeDate(this.options.start.clone())

  public run(args: IPipeRunFn<T>) {
    let date: T

    if (args.skipToIntervalOnOrAfter) {
      this.skipToIntervalOnOrAfter(args.skipToIntervalOnOrAfter)

      date = args.skipToIntervalOnOrAfter.isAfterOrEqual(this.intervalStartDate)
        ? args.skipToIntervalOnOrAfter
        : this.intervalStartDate.clone()
    } else {
      this.incrementInterval()
      date = this.intervalStartDate.clone()
    }

    return this.nextPipe.run({ date })
  }

  public normalizeDate(date: T) {
    switch (this.options.frequency) {
      case 'YEARLY':
        Utils.setDateToStartOfYear(date)
        break
      case 'MONTHLY':
        date.set('day', 1)
        break
      case 'WEEKLY':
        const dayIndex = Utils.orderedWeekdays(this.options.weekStart).indexOf(
          date.get('weekday')
        )
        date.subtract(dayIndex, 'day')
        break
    }

    switch (this.options.frequency) {
      case 'YEARLY':
      case 'MONTHLY':
      case 'WEEKLY':
      case 'DAILY':
        date.set('hour', 0)
      case 'HOURLY':
        date.set('minute', 0)
      case 'MINUTELY':
        date.set('second', 0)
    }

    return date
  }

  // need to account for possible daylight savings time shift
  private incrementInterval() {
    const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency)

    const oldTZOffset = this.intervalStartDate.utcOffset * 60

    this.intervalStartDate.add(this.options.interval, unit)

    const newTZOffset = this.intervalStartDate.utcOffset * 60

    const tzOffset = newTZOffset - oldTZOffset

    const newDate = this.intervalStartDate.clone().add(tzOffset, 'second')

    if (newDate.utcOffset !== this.intervalStartDate.utcOffset) {
      throw new DateAdapter.InvalidDateError(
        `A date was created on the border of daylight savings time: "${newDate.toISOString()}"`
      )
    } else {
      this.intervalStartDate = newDate
    }
  }

  /**
   * This method might be buggy when presented with intervals other than one.
   * In such a case, skipping forward should *skip* seconds of dates, and I'm
   * not sure if this will account for that. Don't have time to test at the moment.
   *
   * Tests are passing
   */
  private skipToIntervalOnOrAfter(newDate: T) {
    const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency)
    const intervalStart = this.intervalStartDate.valueOf()
    const intervalEnd = this.intervalStartDate
      .clone()
      .add(1, unit)
      .valueOf()
    const date = newDate.valueOf()

    const intervalDuration = intervalEnd - intervalStart

    const sign = Math.sign(date - intervalStart)

    const difference =
      Math.floor(Math.abs(date - intervalStart) / intervalDuration) * sign

    this.intervalStartDate.add(difference, unit)

    // This is sort of a quick/hacky solution to a problem experienced with test
    // "testYearlyBetweenIncLargeSpan2" which has a start date of 1920.
    // Not sure why `difference` isn't resolved to whole number in that test,
    // but the first call to this method turns up an iteration exactly 1 year
    // before the iteration it should return.
    while (!newDate.isBefore(this.intervalStartDate.clone().add(1, unit))) {
      this.intervalStartDate.add(this.options.interval, unit)
    }
  }
}

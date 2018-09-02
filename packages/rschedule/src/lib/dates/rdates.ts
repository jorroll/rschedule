import { DateAdapterConstructor } from '../date-adapter'
import { datesToIcalString } from '../ical'
import { Dates } from './dates'

/**
 * RDates object for holding RDATEs but providing a `HasOccurrences` api
 */

const RDATES_ID = Symbol.for('10c93605-2fb8-4ab5-ba54-635f19cd81f4')

export class RDates<T extends DateAdapterConstructor, D=any> extends Dates<T, D> {
  public readonly [RDATES_ID] = true

  /**
   * Similar to `Array.isArray()`, `isRDates()` provides a surefire method
   * of determining if an object is a `RDates` by checking against the
   * global symbol registry.
   */
  public static isRDates(object: any): object is RDates<any> {
    return !!(object && object[Symbol.for('10c93605-2fb8-4ab5-ba54-635f19cd81f4')])
  }

  /**
   * Returns a clone of the RDates object.
   */
  public clone() {
    const dates = this.dates.map(date => new this.dateAdapter(date))
    const dateAdapter: T = this.dateAdapter as any

    return new RDates<T>({dates, data: this.data, dateAdapter})
  }

  public toICal() {
    const dates = this.dates.map(date => new this.dateAdapter(date))

    return datesToIcalString(dates, 'RDATE')
  }
}

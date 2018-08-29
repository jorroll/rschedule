import { DateAdapter } from '../date-adapter'
import { Dates } from './dates'
import { datesToIcalString } from '../ical'

/**
 * EXDates object for holding EXDATEs but providing a `HasOccurrences` api
 */

const EXDATES_ID = Symbol.for('3c83a9bf-13dc-4045-8361-0d55744427e7')

export class EXDates<T extends DateAdapter<T>, D=any> extends Dates<T, D> {
  public readonly [EXDATES_ID] = true

  /**
   * Similar to `Array.isArray()`, `isEXDates()` provides a surefire method
   * of determining if an object is a `EXDates` by checking against the
   * global symbol registry.
   */
  public static isEXDates(object: any): object is EXDates<any> {
    return !!(object && object[Symbol.for('3c83a9bf-13dc-4045-8361-0d55744427e7')])
  }

  /**
   * Returns a clone of the EXDates object.
   */
  public clone() {
    return new EXDates<T>({dates: this.dates.map(date => date.clone()), data: this.data})
  }

  public toICal() {
    return datesToIcalString(this.dates, 'EXDATE')
  }
}

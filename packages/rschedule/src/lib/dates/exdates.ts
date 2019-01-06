import { DateAdapterConstructor } from '../date-adapter';
import { Dates } from './dates';

const EXDATES_ID = Symbol.for('3c83a9bf-13dc-4045-8361-0d55744427e7');

/**
 * EXDates object for holding EXDATEs but providing a `HasOccurrences` api
 */

export class EXDates<T extends DateAdapterConstructor, D = any> extends Dates<
  T,
  D
> {
  /**
   * Similar to `Array.isArray()`, `isEXDates()` provides a surefire method
   * of determining if an object is a `EXDates` by checking against the
   * global symbol registry.
   */
  public static isEXDates(object: any): object is EXDates<any> {
    return !!(object && object[EXDATES_ID] && super.isDates(object));
  }
  // @ts-ignore used by static method
  private readonly [EXDATES_ID] = true;

  /**
   * Returns a clone of the EXDates object.
   */
  public clone() {
    const dates = this.dates.map(date => new this.dateAdapter(date));
    const dateAdapter: T = this.dateAdapter as any;

    return new EXDates<T>({ dates, data: this.data, dateAdapter });
  }
}

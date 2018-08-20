import { DateAdapter } from '../date-adapter'
import { ruleOptionsToIcalString } from '../ical'
import cloneDeep from 'lodash.clonedeep'
import { Rule } from './rule'

const RRULE_ID = Symbol.for('d0f27de8-adee-49d4-8d56-3eb3a8d631f4')

export class RRule<T extends DateAdapter<T>, D = any> extends Rule<T, D> {
  public readonly [RRULE_ID] = true

  /**
   * Similar to `Array.isArray()`, `isRRule()` provides a surefire method
   * of determining if an object is a `RRule` by checking against the
   * global symbol registry.
   */
  public static isRRule(object: any): object is RRule<any> {
    return !!(object && object[Symbol.for('d0f27de8-adee-49d4-8d56-3eb3a8d631f4')])
  }

  /**
   * Returns a clone of the RRule object but does not clone the data property
   * (instead, the original data property is included as the data property of the
   * new RRule).
   */
  public clone() {
    return new RRule<T, D>(cloneDeep(this.options), {data: this.data})
  }

  public toICal() {
    return ruleOptionsToIcalString(this.options, 'RRULE')
  }
}

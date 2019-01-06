import cloneDeep from 'lodash.clonedeep';
import { DateAdapterConstructor } from '../date-adapter';
import { Rule } from './rule';

const EXRULE_ID = Symbol.for('73912d70-7a9b-41d7-926d-19ef5745a4ea');

export class EXRule<T extends DateAdapterConstructor, D = any> extends Rule<
  T,
  D
> {
  /**
   * Similar to `Array.isArray()`, `isEXRule()` provides a surefire method
   * of determining if an object is a `EXRule` by checking against the
   * global symbol registry.
   */
  public static isEXRule(object: any): object is EXRule<any> {
    return !!(object && object[EXRULE_ID] && super.isRule(object));
  }
  // @ts-ignore used by static method
  private readonly [EXRULE_ID] = true;

  /**
   * Returns a clone of the EXRule object but does not clone the data property
   * (instead, the original data property is included as the data property of the
   * new EXRule).
   */
  public clone() {
    const dateAdapter: T = this.dateAdapter as any;
    return new EXRule<T, D>(cloneDeep(this.options), {
      data: this.data,
      dateAdapter,
    });
  }
}

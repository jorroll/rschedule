import { DateTime } from '../date-time'
import { Utils } from '../utilities'
import { IDateAdapter } from './date-adapter'

const DATE_ADAPTER_ID = Symbol.for('9d2c0b75-7a72-4f24-b57f-c27e131e37b2')

export abstract class DateAdapterBase<D={}> implements IDateAdapter<D> {
  /** Returns the date object this IDateAdapter is wrapping */
  abstract date: D

  // returns the underlying date ordinal. The value in milliseconds.
  abstract valueOf(): number

  abstract get(unit: 'weekday'): IDateAdapter.Weekday
  abstract get(unit: 'timezone'): string | undefined
  abstract get(unit: IDateAdapter.Unit | 'yearday'): number

  // abstract set(unit: 'timezone', value: string | undefined, options?: {keepLocalTime?: boolean}): this

  abstract clone(): IDateAdapter

  /**
   * If the IDateAdapter object is valid, returns `true`.
   * Otherwise, throws `IDateAdapter.InvalidDateError`
   */
  abstract assertIsValid(): boolean

  // @ts-ignore used by static method
  private readonly [DATE_ADAPTER_ID] = true

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `IDateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: any): object is IDateAdapter {
    return !!(object && object[DATE_ADAPTER_ID])
  }
  
  static readonly hasTimezoneSupport: boolean = false;

  generators: any[] = []

  isEqual(object?: {valueOf: () => number}): boolean {
    return !!object && object.valueOf() === this.valueOf()
  }
  isBefore(object: {valueOf: () => number}): boolean {
    return this.valueOf() < object.valueOf()
  }
  isBeforeOrEqual(object: {valueOf: () => number}): boolean {
    return this.valueOf() <= object.valueOf()
  }
  isAfter(object: {valueOf: () => number}): boolean {
    return this.valueOf() > object.valueOf()
  }
  isAfterOrEqual(object: {valueOf: () => number}): boolean {
    return this.valueOf() >= object.valueOf()
  }

  toISOString() {
    return new Date(this.valueOf() as number).toISOString()
  }

  add(amount: number, unit: DateTime.Unit | 'week'): this {
    const datetime = new DateTime(this)

    datetime.add(amount, unit)

    this.date = (this.constructor as any).fromTimeObject(
      datetime.toTimeObject()
    )[0].date

    return this
  }

  subtract(amount: number, unit: DateTime.Unit | 'week'): this {
    const datetime = new DateTime(this)

    datetime.subtract(amount, unit)

    this.date = (this.constructor as any).fromTimeObject(
      datetime.toTimeObject()
    )[0].date

    return this
  }

  set(
    unit: DateTime.Unit | 'timezone', 
    value: number | string | undefined
  ): this {
    const datetime = new DateTime(this)

    datetime.set(unit as DateTime.Unit, value as number)

    this.date = (this.constructor as any).fromTimeObject(
      datetime.toTimeObject()
    )[0].date

    return this
  }
  
  toICal(options: {format?: string} = {}): string {
    const format = options.format || this.get('timezone');

    if (format === 'UTC') {
      const date = this.clone().set('timezone', 'UTC')
      return `${Utils.dateToStandardizedString(date)}Z`
    }
    else if (format === 'local') {
      const date = this.clone().set('timezone', undefined)
      return Utils.dateToStandardizedString(date)
    }
    else if (format) {
      const date = this.clone().set('timezone', undefined)
      return `TZID=${format}:${Utils.dateToStandardizedString(date)}`
    }
    else {
      const date = this.clone().set('timezone', undefined)
      return Utils.dateToStandardizedString(date)
    }
  }

  toDateTime(): DateTime {
    return new DateTime(this)
  }
}

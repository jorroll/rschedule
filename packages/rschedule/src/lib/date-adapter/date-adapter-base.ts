import { DateTime } from '../date-time';
import { Utils } from '../utilities';
import { IDateAdapter } from './date-adapter';

const DATE_ADAPTER_ID = Symbol.for('9d2c0b75-7a72-4f24-b57f-c27e131e37b2');

export abstract class DateAdapterBase<D = {}> implements IDateAdapter<D> {

  public static readonly hasTimezoneSupport: boolean = false;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `IDateAdapter` by checking against the
   * global symbol registry.
   */
  public static isInstance(object: any): object is IDateAdapter {
    return !!(object && object[DATE_ADAPTER_ID]);
  }
  /** Returns the date object this IDateAdapter is wrapping */
  public abstract date: D;

  public generators: any[] = [];

  // @ts-ignore used by static method
  private readonly [DATE_ADAPTER_ID] = true;

  // returns the underlying date ordinal. The value in milliseconds.
  public abstract valueOf(): number;

  public abstract get(unit: 'weekday'): IDateAdapter.Weekday;
  public abstract get(unit: 'timezone'): string | undefined;
  public abstract get(unit: IDateAdapter.Unit | 'yearday'): number;

  // abstract set(unit: 'timezone', value: string | undefined, options?: {keepLocalTime?: boolean}): this

  public abstract clone(): IDateAdapter;

  /**
   * If the IDateAdapter object is valid, returns `true`.
   * Otherwise, throws `IDateAdapter.InvalidDateError`
   */
  public abstract assertIsValid(): boolean;

  public isEqual(object?: { valueOf: () => number }): boolean {
    return !!object && object.valueOf() === this.valueOf();
  }
  public isBefore(object: { valueOf: () => number }): boolean {
    return this.valueOf() < object.valueOf();
  }
  public isBeforeOrEqual(object: { valueOf: () => number }): boolean {
    return this.valueOf() <= object.valueOf();
  }
  public isAfter(object: { valueOf: () => number }): boolean {
    return this.valueOf() > object.valueOf();
  }
  public isAfterOrEqual(object: { valueOf: () => number }): boolean {
    return this.valueOf() >= object.valueOf();
  }

  public toISOString() {
    return new Date(this.valueOf() as number).toISOString();
  }

  public add(amount: number, unit: DateTime.Unit | 'week'): this {
    const datetime = new DateTime(this);

    datetime.add(amount, unit);

    this.date = (this.constructor as any).fromTimeObject(
      datetime.toTimeObject(),
    )[0].date;

    return this;
  }

  public subtract(amount: number, unit: DateTime.Unit | 'week'): this {
    const datetime = new DateTime(this);

    datetime.subtract(amount, unit);

    this.date = (this.constructor as any).fromTimeObject(
      datetime.toTimeObject(),
    )[0].date;

    return this;
  }

  public set(
    unit: DateTime.Unit | 'timezone',
    value: number | string | undefined,
  ): this {
    const datetime = new DateTime(this);

    datetime.set(unit as DateTime.Unit, value as number);

    this.date = (this.constructor as any).fromTimeObject(
      datetime.toTimeObject(),
    )[0].date;

    return this;
  }

  public toICal(options: { format?: string } = {}): string {
    const format = options.format || this.get('timezone');

    if (format === 'UTC') {
      const date = this.clone().set('timezone', 'UTC');
      return `${Utils.dateToStandardizedString(date)}Z`;
    } else if (format === 'local') {
      const date = this.clone().set('timezone', undefined);
      return Utils.dateToStandardizedString(date);
    } else if (format) {
      const date = this.clone().set('timezone', undefined);
      return `TZID=${format}:${Utils.dateToStandardizedString(date)}`;
    } else {
      const date = this.clone().set('timezone', undefined);
      return Utils.dateToStandardizedString(date);
    }
  }

  public toDateTime(): DateTime {
    return new DateTime(this);
  }
}

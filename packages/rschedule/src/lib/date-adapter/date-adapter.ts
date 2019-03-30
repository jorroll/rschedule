import { DateTime, IDateAdapter } from '../date-time';

export class InvalidDateAdapterError extends Error {}

const DATE_ADAPTER_ID = Symbol.for('9d2c0b75-7a72-4f24-b57f-c27e131e37b2');

export class DateAdapter implements IDateAdapter<unknown> {
  static readonly date: unknown;
  static readonly hasTimezoneSupport: boolean = false;

  /**
   * Similar to `Array.isArray()`, `isInstance()` provides a surefire method
   * of determining if an object is a `DateAdapter` by checking against the
   * global symbol registry.
   */
  static isInstance(object: unknown): object is DateAdapter {
    return !!(object && typeof object === 'object' && (object as any)[DATE_ADAPTER_ID]);
  }

  static isDate(_: unknown): boolean {
    throw new Error('DateAdapter is an abstract class');
  }

  static fromJSON(_: IDateAdapter.JSON): DateAdapter {
    throw new Error('DateAdapter is an abstract class');
  }

  readonly date!: unknown;
  readonly timezone: string | undefined;
  readonly duration: number | undefined;

  readonly generators: unknown[] = [];

  protected readonly [DATE_ADAPTER_ID] = true;

  constructor(_: unknown, options?: unknown) {}

  set(prop: 'timezone', value: string | undefined): DateAdapter {
    throw new Error('DateAdapter is an abstract class');
  }

  valueOf(): number {
    throw new Error('DateAdapter is an abstract class');
  }

  toISOString(): string {
    throw new Error('DateAdapter is an abstract class');
  }

  isEqual(object?: DateAdapter): boolean {
    return !!object && this.valueOf() === object.valueOf();
  }

  isBefore(object: DateAdapter): boolean {
    return this.valueOf() < object.valueOf();
  }

  isBeforeOrEqual(object: DateAdapter): boolean {
    return this.valueOf() <= object.valueOf();
  }

  isAfter(object: DateAdapter): boolean {
    return this.valueOf() > object.valueOf();
  }

  isAfterOrEqual(object: DateAdapter): boolean {
    return this.valueOf() >= object.valueOf();
  }

  toDateTime(): DateTime {
    throw new Error('DateAdapter is an abstract class');
  }

  toJSON(): IDateAdapter.JSON {
    throw new Error('DateAdapter is an abstract class');
  }

  assertIsValid(): boolean {
    throw new Error('DateAdapter is an abstract class');
  }
}

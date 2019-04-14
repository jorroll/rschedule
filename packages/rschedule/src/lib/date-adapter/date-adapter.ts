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
    throw unimplementedError('isDate()');
  }

  static fromJSON(_: IDateAdapter.JSON): DateAdapter {
    throw unimplementedError('fromJSON()');
  }

  static fromDateTime(_: DateTime): DateAdapter {
    throw unimplementedError('fromDateTime()');
  }

  readonly date!: unknown;
  readonly timezone!: string | null;
  readonly duration: number | undefined;

  readonly generators: unknown[] = [];

  protected readonly [DATE_ADAPTER_ID] = true;

  constructor(_: unknown, options?: unknown) {}

  set(prop: 'timezone', value: string | null): DateAdapter {
    throw unimplementedError('set()');
  }

  valueOf(): number {
    throw unimplementedError('valueOf()');
  }

  toISOString(): string {
    throw unimplementedError('toISOString()');
  }

  toDateTime(): DateTime {
    throw unimplementedError('toDateTime()');
  }

  toJSON(): IDateAdapter.JSON {
    throw unimplementedError('toJSON()');
  }

  assertIsValid(): boolean {
    throw unimplementedError('assertIsValid()');
  }
}

function unimplementedError(name: string) {
  return new Error(`You must implement the "${name}" method for this DateAdapter class`);
}

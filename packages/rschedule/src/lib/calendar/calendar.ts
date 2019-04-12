import { DateAdapter } from '../date-adapter';
import { DateTime } from '../date-time';
import { IOccurrenceGenerator, OccurrenceGenerator } from '../interfaces';
import { ICollectionsRunArgs } from '../iterators';
import { add, OccurrenceStream, pipeFn } from '../operators';

const CALENDAR_ID = Symbol.for('5e83caab-8318-43d9-bf3d-cb24fe152246');

export class Calendar<T extends typeof DateAdapter, D = any> extends OccurrenceGenerator<T> {
  /**
   * Similar to `Array.isArray()`, `isCalendar()` provides a surefire method
   * of determining if an object is a `Calendar` by checking against the
   * global symbol registry.
   */
  static isCalendar(object: any): object is Calendar<any, any> {
    return !!(object && typeof object === 'object' && (object as any)[CALENDAR_ID]);
  }

  readonly schedules: ReadonlyArray<IOccurrenceGenerator<T>> = [];

  /** Convenience property for holding arbitrary data */
  data!: D;

  pipe = pipeFn(this);

  readonly isInfinite: boolean;
  readonly hasDuration: boolean;

  protected readonly [CALENDAR_ID] = true;

  constructor(
    args: {
      schedules?: ReadonlyArray<IOccurrenceGenerator<T>> | IOccurrenceGenerator<T>;
      data?: D;
      dateAdapter?: T;
      timezone?: string | null;
    } = {},
  ) {
    super(args);

    this.data = args.data as D;

    if (args.schedules) {
      this.schedules = Array.isArray(args.schedules) ? args.schedules : [args.schedules];
      this.schedules = this.schedules.map(schedule => schedule.set('timezone', this.timezone));
    }

    this.isInfinite = this.schedules.some(schedule => schedule.isInfinite);
    this.hasDuration = this.schedules.every(schedule => schedule.hasDuration);
  }

  set(_: 'timezone', value: string | null) {
    return new Calendar({
      schedules: this.schedules.map(schedule => schedule.set('timezone', value)),
      data: this.data,
      dateAdapter: this.dateAdapter,
      timezone: value,
    });
  }

  /**  @private use collections() instead */
  *_run(args: ICollectionsRunArgs = {}): IterableIterator<DateTime> {
    const count = args.take;

    delete args.take;

    let iterator: IterableIterator<DateTime>;

    switch (this.schedules.length) {
      case 0:
        return;
      case 1:
        iterator = this.schedules[0]._run(args);
        break;
      default:
        iterator = new OccurrenceStream({
          operators: [add<T>(...this.schedules)],
          dateAdapter: this.dateAdapter,
          timezone: this.timezone,
        })._run(args);
        break;
    }

    let date = iterator.next().value;
    let index = 0;

    while (date && (count === undefined || count > index)) {
      date.generators.push(this);

      const yieldArgs = yield this.normalizeRunOutput(date);

      date = iterator.next(yieldArgs).value;

      index++;
    }
  }
}

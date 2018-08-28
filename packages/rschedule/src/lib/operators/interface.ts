import { DateAdapter } from '../date-adapter'
import { RunnableIterator } from '../interfaces'

export interface IOperator<T extends DateAdapter<T>> extends RunnableIterator<T> {}

abstract class Operator<T extends DateAdapter<T>> {
  public get startDate(): T | null {
    return (this as any)._run().next().value || null
  }

  public get endDate(): T | null {
    if ((this as any).isInfinite) return null;

    return (this as any)._run({reverse: true}).next().value
  }
}

export abstract class StreamsOperator<T extends DateAdapter<T>> extends Operator<T> {
  public get isInfinite() {
    return this.streams.some(stream => stream.isInfinite)
  }

  constructor(
    protected streams: RunnableIterator<T>[] = []
  ) { super() }
}

export abstract class StreamOperator<T extends DateAdapter<T>> extends Operator<T> {
  public get isInfinite() {
    return this.stream.isInfinite
  }

  constructor(
    protected stream: RunnableIterator<T>
  ) { super() }
}

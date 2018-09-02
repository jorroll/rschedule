import { DateAdapterConstructor, DateAdapter } from '../date-adapter'
import { RunArgs } from '../interfaces'

export interface OperatorObject<T extends DateAdapterConstructor> {
  isInfinite: boolean
  setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}): void
  clone(): any
  _run: (args?: RunArgs<T>) => IterableIterator<DateAdapter<T>>
}

export type OperatorInput<T extends DateAdapterConstructor> = OperatorObject<T>
export type OperatorOutput<T extends DateAdapterConstructor> =
  (base?: IterableIterator<DateAdapter<T>>, baseIsInfinite?: boolean) => OperatorObject<T>

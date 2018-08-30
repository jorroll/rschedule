import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs } from '../interfaces'

export interface OperatorObject<T extends DateAdapter<T>> {
  isInfinite: boolean
  setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}): void
  clone(): any
  _run: (args?: OccurrencesArgs<T>) => IterableIterator<T>
}

export type OperatorInput<T extends DateAdapter<T>> = OperatorObject<T>
export type OperatorOutput<T extends DateAdapter<T>> =
  (base?: IterableIterator<T>, baseIsInfinite?: boolean) => OperatorObject<T>

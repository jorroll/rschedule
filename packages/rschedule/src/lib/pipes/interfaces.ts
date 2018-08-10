import { DateAdapter } from '../date-adapter'
import { Options } from '../rule/rule-options'

export interface IPipeRunFn<T extends DateAdapter<T>> {
  date: T
  invalidDate?: boolean
  skipToIntervalOnOrAfter?: T
}

export interface IPipeRule<T extends DateAdapter<T>> {
  nextPipe: IPipeRule<T> | null
  controller: IPipeController<T>

  run(args: IPipeRunFn<T>): T | null
}

export interface IPipeController<T extends DateAdapter<T>> {
  start: T
  end?: T
  count?: number
  isIteratingInReverseOrder: boolean
  options: Options.ProcessedOptions<T>
  invalid: boolean

  expandingPipes: Array<IPipeRule<T>>
  focusedPipe: IPipeRule<T>
}

export abstract class PipeRule<T extends DateAdapter<T>> {
  public nextPipe!: IPipeRule<T>

  constructor(public controller: IPipeController<T>) {}

  get options() {
    return this.controller.options
  }
  get start() {
    return this.controller.start
  }
  get end() {
    return this.controller.end
  }
  get count() {
    return this.controller.count
  }
  get isIteratingInReverseOrder() {
    return this.controller.isIteratingInReverseOrder
  }
  get expandingPipes() {
    return this.controller.expandingPipes
  }
  get focusedPipe() {
    return this.controller.focusedPipe
  }

  protected cloneDateWithGranularity(
    date: T,
    granularity: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
  ) {
    date = date.clone()

    switch (granularity) {
      case 'year':
        date.set('month', 1)
      case 'month':
        date.set('day', 1)
      case 'day':
        date.set('hour', 0)
      case 'hour':
        date.set('minute', 0)
      case 'minute':
        date.set('second', 0)
      case 'second':
        return date
      default:
        throw new Error('Woops! the PipeController somehow has invalid options...')
    }
  }
}

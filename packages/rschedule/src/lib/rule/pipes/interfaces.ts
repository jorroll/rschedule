import { DateAdapter } from '../../date-adapter'
import { Options } from '../rule-options'
import { Utils } from '../../utilities'

export class PipeError extends Error {}

export interface IPipeRunFn<T extends DateAdapter<T>> {
  /**
   * The current date to be evaluated by the rule pipe.
   */
  date: T

  /**
   * This argument is added by a pipe to indicate that the current date
   * is invalid.
   */
  invalidDate?: boolean

  /**
   * If present, contains the next potentially valid date 
   * from the perspective of the Pipe which adds the `skipToDate`
   * argument. It serves as a way of skipping potentially large blocks of
   * dates that will be invalid.
   * 
   * The date contained in `skipToDate` will either be in the future or
   * the past, depending on if `isIteratingInReverseOrder`. The `FrequencyPipe` will
   * either skip to the date in `skipToDate`, if the date is a valid one
   * given the rule's `frequency`, `interval`, and `start` options, or it will
   * skip to the first valid date after the `skipToDate` date.
   */
  skipToDate?: T
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
  reverse: boolean
  options: Options.ProcessedOptions<T>
  invalid: boolean

  expandingPipes: Array<IPipeRule<T>>
  focusedPipe: IPipeRule<T>
}

export abstract class PipeRuleBase<T extends DateAdapter<T>> {
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
  get expandingPipes() {
    return this.controller.expandingPipes
  }
  get focusedPipe() {
    return this.controller.focusedPipe
  }
}


export abstract class PipeRule<T extends DateAdapter<T>> extends PipeRuleBase<T> {
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

export abstract class ReversePipeRule<T extends DateAdapter<T>> extends PipeRuleBase<T> {
  protected cloneDateWithGranularity(
    date: T,
    granularity: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
  ) {
    date = date.clone()

    switch (granularity) {
      case 'year':
        date.set('month', 12)
      case 'month':
        Utils.setDateToEndOfMonth(date)
      case 'day':
        date.set('hour', 23)
      case 'hour':
        date.set('minute', 59)
      case 'minute':
        date.set('second', 59)
      case 'second':
        return date
      default:
        throw new Error('Woops! the PipeController somehow has invalid options...')
    }
  }
}

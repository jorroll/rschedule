import { DateAdapter } from "../date-adapter";
import { OperatorOutput, OperatorObject } from "./interface";
import { OccurrencesArgs } from "../interfaces";
import cloneDeep from 'lodash.clonedeep';

/**
 * This function allows you to build a new, complex recurrance schedule by
 * combining the output of other schedules using various operator
 * functions. You can then feed the result into a `Calendar` object
 * as input.
 * 
 * ### Example
 ```
 const includeDatesFromTheseSchedules = [new Schedule()]

 const excludeDatesFromTheseSchedules = [
   new Schedule(),
   new EXRule()
  ]

 const includeTheseSpecificDates = new RDates()
 const excludeTheseSpecificDates = new EXDates()

 const customSchedule = buildIterator(
    add(...includeDatesFromTheseSchedules),
    subtract(...excludeDatesFromTheseSchedules),
    add(includeTheseSpecificDates),
    subtract(excludeTheseSpecificDates),
    unique(),
  )

 new Calendar({
   schedules: customSchedule
 })
 ```
 * This function works similarly to the `pipe()` method in rxjs, in that
 * it receives an arbitrary number of `operator()` functions as arguments
 * and uses the functions to create a new, single stream of occurrences.
 * 
 * Internally, it uses the result of one operator function as the input for
 * the next operator function, meaning that the order of functions matters.
 * 
 * @param operators a spread of operator functions
 */
export function buildIterator<T extends DateAdapter<T>>(...operators: OperatorOutput<T>[]) {
  let _run: (args?: OccurrencesArgs<T>) => IterableIterator<T>
  let first: OperatorObject<T>

  switch (operators.length) {
    case 0:
      _run = () => ({[Symbol.iterator]: (() => {}) as any, next: () => ({value: undefined as any, done: true} as IteratorResult<T>)})
      break
    case 1:
      first = operators.shift()!()
      _run = (args: OccurrencesArgs<T>={}) => first._run(args)
      break
    default:
      first = operators.shift()!()
      _run = (args: OccurrencesArgs<T>={}) => operators.reduce((prev, curr) => curr(prev)._run(args), first._run(args))
      break
  }

  return {
    _run,

    get isInfinite() {
      if (!first || !first.isInfinite) return false;

      try {
        operators.reduce((prev, curr) => {
          const isInfinite = curr(undefined, prev).isInfinite

          if (!isInfinite) {
            throw ''
          }

          return isInfinite
        }, first.isInfinite)
      }
      catch (e) {
        return false
      }

      return true
    },

    clone() {
      return buildIterator(...cloneDeep(operators))
    },

    setTimezone(timezone: string | undefined, options?: {keepLocalTime?: boolean}) {
      operators.forEach(operator => operator().setTimezone(timezone, options))
    },
  }
}

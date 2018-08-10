// @ts-ignore
import { StandardDateAdapter } from '@rschedule/standard-date-adapter'

// This function allows me to use the test's name as a
// variable inside the test
export function test(name: string, fn: (name: string) => any) {
  return it(name, () => fn(name))
}

// This function allows me to use the describe block's name as a
// variable inside tests
export function context(name: string, fn: (name: string) => any) {
  return describe(name, () => fn(name))
}

export function datetime(...args) {
  args[1] = args[1] - 1

  // @ts-ignore
  return new Date(...args)
}

export function isoString(...args) {
  return datetime(...args).toISOString()
}

export function dateAdapter(...args) {
  return new StandardDateAdapter(datetime(...args))
}

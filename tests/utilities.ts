import { StandardDateAdapter } from '@rschedule/standard-date-adapter'

// This function allows me to use the test's name as a
// variable inside the test
export function test<T extends string>(name: T, fn: (name: T) => any) {
  return it(name, () => fn(name))
}

// This function allows me to use the describe block's name as a
// variable inside tests
export function context<T>(name: T, fn: (name: T) => any) {
  if (typeof name === 'string')
    return describe(name, () => fn(name))
  else if (Array.isArray(name))
    return describe(name[0], () => fn(name))
  else
    throw new Error('unexpected')
}

// This function allows me to test multiple, disperate objects with the 
// same test suite
export function environment<T>(object: T, fn: (object: T) => any) {
  return describe(object.constructor.name, () => fn(object))
}

export function datetime(): Date
export function datetime(a: number): Date
export function datetime(a: number, b: number): Date
export function datetime(a: number, b: number, c: number): Date
export function datetime(a: number, b: number, c: number, d: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number, f: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number, f: number, g: number): Date
export function datetime(a: number, b: number, c: number, d: number, e: number, f: number, g: number, timezone: string): Date
export function datetime(...args: (number|string)[]) {
  if (args.length > 1) args[1] = (args[1] as number) - 1

  if (args.length === 8) {
    // @ts-ignore
    return args.pop() === 'UTC' ? new Date(Date.UTC(...args)) : new Date(...args)
  }
  // @ts-ignore
  else return new Date(...args)
}

export function isoString(): string
export function isoString(a: number): string
export function isoString(a: number, b: number): string
export function isoString(a: number, b: number, c: number): string
export function isoString(a: number, b: number, c: number, d: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number, f: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number, f: number, g: number): string
export function isoString(a: number, b: number, c: number, d: number, e: number, f: number, g: number,  timezone: string): string
export function isoString(...args: (number|string)[]) {
  // @ts-ignore
  return datetime(...args).toISOString()
}

export function dateAdapter(): StandardDateAdapter
export function dateAdapter(a: number): StandardDateAdapter
export function dateAdapter(a: number, b: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number, f: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number, f: number, g: number): StandardDateAdapter
export function dateAdapter(a: number, b: number, c: number, d: number, e: number, f: number, g: number,  timezone: string): StandardDateAdapter
export function dateAdapter(...args: (number|string)[]) {
  // @ts-ignore
  return new StandardDateAdapter(datetime(...args))
}

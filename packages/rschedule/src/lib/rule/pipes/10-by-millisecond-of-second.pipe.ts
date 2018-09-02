// import { Options } from '../rule-options'
// import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces'

// export class ByMillisecondOfSecondPipe extends PipeRule implements IPipeRule {

//   public run(args: IPipeRunFn) {
//     if (args.invalidDate) { return this.nextPipe.run(args) }

//     return this.expand(args)
//   }

//   private upcomingMilliseconds: Options.ByMillisecondOfSecond[] = []

//   public expand(args: IPipeRunFn) {
//     const date = args.date

//     if (this.upcomingMilliseconds.length === 0) {
//       this.upcomingMilliseconds = this.options.byMillisecondOfSecond!.filter(
//         millisecond => date.get('millisecond') <= millisecond
//       )

//       if (this.upcomingMilliseconds.length === 0) {
//         return this.nextPipe.run({ date, invalidDate: true })
//       }

//       this.expandingPipes.push(this)
//     }

//     const nextMillisecond = this.upcomingMilliseconds.shift()!

//     date.set('millisecond', nextMillisecond)

//     if (this.upcomingMilliseconds.length === 0) { this.expandingPipes.pop() }

//     return this.nextPipe.run({ date })
//   }
// }

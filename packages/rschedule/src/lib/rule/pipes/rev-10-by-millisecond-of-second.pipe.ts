import { IByMillisecondOfSecondRuleOptions } from './10-by-millisecond-of-second.pipe';
import { IPipeRule } from './interfaces';
import { RevByTimePipe } from './rev-by-time.pipe';

export class RevByMillisecondOfSecondPipe extends RevByTimePipe<IByMillisecondOfSecondRuleOptions>
  implements IPipeRule<IByMillisecondOfSecondRuleOptions> {
  run = this.runFn('second', 'millisecond', 'byMillisecondOfSecond');
}

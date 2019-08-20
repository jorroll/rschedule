import { RuleOption } from '../rule-options';
import { ByTimePipe } from './by-time.pipe';
import { IPipeRule } from './interfaces';

export interface IByMillisecondOfSecondRuleOptions {
  byMillisecondOfSecond: RuleOption.ByMillisecondOfSecond[];
}

export class ByMillisecondOfSecondPipe extends ByTimePipe<IByMillisecondOfSecondRuleOptions>
  implements IPipeRule<IByMillisecondOfSecondRuleOptions> {
  run = this.runFn('second', 'millisecond', 'byMillisecondOfSecond');
}

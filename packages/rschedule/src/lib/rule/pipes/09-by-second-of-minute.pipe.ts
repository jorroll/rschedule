import { RuleOption } from '../rule-options';
import { ByTimePipe } from './by-time.pipe';
import { IPipeRule } from './interfaces';

export interface IBySecondOfMinuteRuleOptions {
  bySecondOfMinute: RuleOption.BySecondOfMinute[];
}

export class BySecondOfMinutePipe extends ByTimePipe<IBySecondOfMinuteRuleOptions>
  implements IPipeRule<IBySecondOfMinuteRuleOptions> {
  run = this.runFn('minute', 'second', 'bySecondOfMinute');
}

import { IBySecondOfMinuteRuleOptions } from './09-by-second-of-minute.pipe';
import { IPipeRule } from './interfaces';
import { RevByTimePipe } from './rev-by-time.pipe';

export class RevBySecondOfMinutePipe extends RevByTimePipe<IBySecondOfMinuteRuleOptions>
  implements IPipeRule<IBySecondOfMinuteRuleOptions> {
  run = this.runFn('minute', 'second', 'bySecondOfMinute');
}

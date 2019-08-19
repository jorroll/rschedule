import { RuleOption } from '../rule-options';
import { ByTimePipe } from './by-time.pipe';
import { IPipeRule } from './interfaces';

export interface IByMinuteOfHourRulePipe {
  byMinuteOfHour: RuleOption.ByMinuteOfHour[];
}

export class ByMinuteOfHourPipe extends ByTimePipe<IByMinuteOfHourRulePipe>
  implements IPipeRule<IByMinuteOfHourRulePipe> {
  run = this.runFn('hour', 'minute', 'byMinuteOfHour');
}

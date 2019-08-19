import { IByMinuteOfHourRulePipe } from './08-by-minute-of-hour.pipe';
import { IPipeRule } from './interfaces';
import { RevByTimePipe } from './rev-by-time.pipe';

export class RevByMinuteOfHourPipe extends RevByTimePipe<IByMinuteOfHourRulePipe>
  implements IPipeRule<IByMinuteOfHourRulePipe> {
  run = this.runFn('hour', 'minute', 'byMinuteOfHour');
}

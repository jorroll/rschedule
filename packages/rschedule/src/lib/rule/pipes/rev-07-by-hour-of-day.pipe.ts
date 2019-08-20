import { IByHourOfDayRuleOptions } from './07-by-hour-of-day.pipe';
import { IPipeRule } from './interfaces';
import { RevByTimePipe } from './rev-by-time.pipe';

export class RevByHourOfDayPipe extends RevByTimePipe<IByHourOfDayRuleOptions>
  implements IPipeRule<IByHourOfDayRuleOptions> {
  run = this.runFn('day', 'hour', 'byHourOfDay');
}

import { IDateAdapter } from '../../date-time';
import { RuleOption } from '../rule-options';
import { ByTimePipe } from './by-time.pipe';
import { IPipeRule, IPipeRunFn, PipeRule } from './interfaces';

export interface IByHourOfDayRuleOptions {
  byHourOfDay: RuleOption.ByHourOfDay[];
}

export class ByHourOfDayPipe extends ByTimePipe<IByHourOfDayRuleOptions>
  implements IPipeRule<IByHourOfDayRuleOptions> {
  run = this.runFn('day', 'hour', 'byHourOfDay');
}

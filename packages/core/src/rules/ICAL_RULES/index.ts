import { DateInput, DateTime } from '@rschedule/core';
import {
  ByDayOfMonthRuleModule,
  IByDayOfMonthRuleOptions,
  INormByDayOfMonthRuleOptions,
} from '../ByDayOfMonth';
import {
  ByDayOfWeekRuleModule,
  IByDayOfWeekRuleOptions,
  INormByDayOfWeekRuleOptions,
} from '../ByDayOfWeek';
import {
  ByHourOfDayRuleModule,
  IByHourOfDayRuleRuleOptions,
  INormByHourOfDayRuleRuleOptions,
} from '../ByHourOfDay';
import {
  ByMillisecondOfSecondRuleModule,
  IByMillisecondOfSecondRuleOptions,
  INormByMillisecondOfSecondRuleOptions,
} from '../ByMillisecondOfSecond';
import {
  ByMinuteOfHourRuleModule,
  IByMinuteOfHourRuleRuleOptions,
  INormByMinuteOfHourRuleRuleOptions,
} from '../ByMinuteOfHour';
import {
  ByMonthOfYearRuleModule,
  IByMonthOfYearRuleOptions,
  INormByMonthOfYearRuleOptions,
} from '../ByMonthOfYear';
import {
  BySecondOfMinuteRuleModule,
  IBySecondOfMinuteRuleOptions,
  INormBySecondOfMinuteRuleOptions,
} from '../BySecondOfMinute';
import {
  FrequencyRuleModule,
  IFrequencyRuleOptions,
  INormFrequencyRuleOptions,
} from '../Frequency';

export type ICalRuleFrequency =
  | 'SECONDLY'
  | 'MINUTELY'
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY';

interface IRRuleOptionsBase
  extends IFrequencyRuleOptions,
    IByMonthOfYearRuleOptions,
    IByDayOfMonthRuleOptions,
    IByDayOfWeekRuleOptions,
    IByHourOfDayRuleRuleOptions,
    IByMinuteOfHourRuleRuleOptions,
    IBySecondOfMinuteRuleOptions,
    IByMillisecondOfSecondRuleOptions {}

interface INormRRuleOptionsBase
  extends INormFrequencyRuleOptions,
    INormByMonthOfYearRuleOptions,
    INormByDayOfMonthRuleOptions,
    INormByDayOfWeekRuleOptions,
    INormByHourOfDayRuleRuleOptions,
    INormByMinuteOfHourRuleRuleOptions,
    INormBySecondOfMinuteRuleOptions,
    INormByMillisecondOfSecondRuleOptions {}

export type IRRuleOptions = Omit<IRRuleOptionsBase, 'frequency'> & {
  start: DateInput;
  end?: DateInput;
  count?: number;
  frequency: ICalRuleFrequency;
};

export type INormRRuleOptions = Omit<INormRRuleOptionsBase, 'frequency'> & {
  start: DateTime;
  end?: DateTime;
  count?: number;
  frequency: ICalRuleFrequency;
};

export const ICAL_RULES = [
  FrequencyRuleModule,
  ByMonthOfYearRuleModule,
  ByDayOfMonthRuleModule,
  ByDayOfWeekRuleModule,
  ByHourOfDayRuleModule,
  ByMinuteOfHourRuleModule,
  BySecondOfMinuteRuleModule,
  ByMillisecondOfSecondRuleModule,
] as const;

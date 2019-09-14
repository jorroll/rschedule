import { IRecurrenceRuleModule } from '@rschedule/core';
import { ByDayOfMonthRuleModule } from '@rschedule/core/rules/ByDayOfMonth';
import { ByHourOfDayRuleModule } from '@rschedule/core/rules/ByHourOfDay';
import { ByMillisecondOfSecondRuleModule } from '@rschedule/core/rules/ByMillisecondOfSecond';
import { ByMinuteOfHourRuleModule } from '@rschedule/core/rules/ByMinuteOfHour';
import { ByMonthOfYearRuleModule } from '@rschedule/core/rules/ByMonthOfYear';
import { BySecondOfMinuteRuleModule } from '@rschedule/core/rules/BySecondOfMinute';
import { FrequencyRuleModule } from '@rschedule/core/rules/Frequency';

import { resolveRecurrenceRules } from './resolve-recurrence-rules';

describe('resolveRecurrenceRules', () => {
  it('FrequencyRuleModule', () => {
    const modules = resolveRecurrenceRules([FrequencyRuleModule]);

    expect(modules).toEqual([FrequencyRuleModule]);
  });

  it('ByMillisecondOfSecondRuleModule', () => {
    const modules = resolveRecurrenceRules([ByMillisecondOfSecondRuleModule]);

    expect(modules).toEqual([FrequencyRuleModule, ByMillisecondOfSecondRuleModule]);
  });

  it('BySecondOfMinuteRuleModule', () => {
    const modules = resolveRecurrenceRules([BySecondOfMinuteRuleModule]);

    expect(modules).toEqual([
      FrequencyRuleModule,
      BySecondOfMinuteRuleModule,
      ByMillisecondOfSecondRuleModule,
    ]);
  });

  it('ByMinuteOfHourRuleModule', () => {
    const modules = resolveRecurrenceRules([ByMinuteOfHourRuleModule]);

    expect(modules).toEqual([
      FrequencyRuleModule,
      ByMinuteOfHourRuleModule,
      BySecondOfMinuteRuleModule,
      ByMillisecondOfSecondRuleModule,
    ]);
  });

  it('ByHourOfDayRuleModule', () => {
    const modules = resolveRecurrenceRules([ByHourOfDayRuleModule]);

    expect(modules).toEqual([
      FrequencyRuleModule,
      ByHourOfDayRuleModule,
      ByMinuteOfHourRuleModule,
      BySecondOfMinuteRuleModule,
      ByMillisecondOfSecondRuleModule,
    ]);
  });

  it('ByDayOfMonthRuleModule', () => {
    const modules = resolveRecurrenceRules([ByDayOfMonthRuleModule]);

    expect(modules).toEqual([
      FrequencyRuleModule,
      ByDayOfMonthRuleModule,
      ByHourOfDayRuleModule,
      ByMinuteOfHourRuleModule,
      BySecondOfMinuteRuleModule,
      ByMillisecondOfSecondRuleModule,
    ]);
  });

  it('ByMonthOfYearRuleModule', () => {
    const modules = resolveRecurrenceRules([ByMonthOfYearRuleModule]);

    expect(modules).toEqual([
      FrequencyRuleModule,
      ByMonthOfYearRuleModule,
      ByDayOfMonthRuleModule,
      ByHourOfDayRuleModule,
      ByMinuteOfHourRuleModule,
      BySecondOfMinuteRuleModule,
      ByMillisecondOfSecondRuleModule,
    ]);
  });

  it('ByMinuteOfHourRuleModule,ByMonthOfYearRuleModule', () => {
    const modules = resolveRecurrenceRules([ByMinuteOfHourRuleModule, ByMonthOfYearRuleModule]);

    expect(modules).toEqual([
      FrequencyRuleModule,
      ByMonthOfYearRuleModule,
      ByDayOfMonthRuleModule,
      ByHourOfDayRuleModule,
      ByMinuteOfHourRuleModule,
      BySecondOfMinuteRuleModule,
      ByMillisecondOfSecondRuleModule,
    ]);
  });

  it('ByMinuteOfHourRuleModule,ByMonthOfYearRuleModule', () => {
    const a: IRecurrenceRuleModule<any, any> = {
      name: 'a',
      get: () => null,
      normalizeOptions: () => ({}),
      deps: () => [a],
    };

    const b: IRecurrenceRuleModule<any, any> = {
      name: 'b',
      get: () => null,
      normalizeOptions: () => ({}),
      deps: () => [b],
    };

    const c: IRecurrenceRuleModule<any, any> = {
      name: 'c',
      get: () => null,
      normalizeOptions: () => ({}),
      deps: () => [c, a],
    };

    const d: IRecurrenceRuleModule<any, any> = {
      name: 'd',
      get: () => null,
      normalizeOptions: () => ({}),
      deps: () => [b, d],
    };

    const e: IRecurrenceRuleModule<any, any> = {
      name: 'e',
      get: () => null,
      normalizeOptions: () => ({}),
      deps: () => [d, e, c],
    };

    const modules = resolveRecurrenceRules([a, c, b, e, d]);

    expect(modules).toEqual([b, d, e, c, a]);
  });
});

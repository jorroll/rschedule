/**
 * Credit:
 * The vast majority of these tests were taken from
 * [rrulejs](https://github.com/jakubroztocil/rrule),
 * which itself credits the python library `dateutil.rrule`
 * for first creating the tests.
 */

import { context } from '@local-tests/utilities';
import {
  DateTime,
  INormRuleOptions,
  IRuleOptions,
  normalizeRuleOptions as _normalizeRuleOptions,
  RecurrenceRulesIterator,
  recurrenceRulesReducer,
  RuleOption,
} from '@rschedule/core';
import { ByDayOfMonthRuleModule } from './rules/ByDayOfMonth';
import { ByDayOfWeekRuleModule } from './rules/ByDayOfWeek';
import { ByHourOfDayRuleModule } from './rules/ByHourOfDay';
import { ByMillisecondOfSecondRuleModule } from './rules/ByMillisecondOfSecond';
import { ByMinuteOfHourRuleModule } from './rules/ByMinuteOfHour';
import { ByMonthOfYearRuleModule } from './rules/ByMonthOfYear';
import { BySecondOfMinuteRuleModule } from './rules/BySecondOfMinute';
import { FrequencyRuleModule } from './rules/Frequency';
import { dateTime } from './rules/test-utilities';

/**
 * Some helper functions are defined at bottom of this file
 */

function testIteration(args: { name: string; rules: IRuleOptions; result: DateTime[] }) {
  describe(args.name, () => {
    const optionVariations: [string, IRuleOptions, DateTime[]][] = [
      ['default', args.rules, args.result],
      [
        'duration',
        { ...args.rules, duration: 100 },
        args.result.map(date => date.set('duration', 100)),
      ],
    ];

    if (args.rules.count !== undefined) {
      const endVariation = { ...args.rules, end: args.result[args.result.length - 1] };
      delete endVariation.count;
      optionVariations.push(['end instead of count', endVariation, args.result]);
    }

    optionVariations.forEach(([name, ruleVariation, resultsVariation]) => {
      describe(name, () => {
        let controller: RecurrenceRulesIterator<INormRuleOptions>;
        let rules: INormRuleOptions;
        let options: { start?: DateTime; end?: DateTime; reverse?: boolean };
        let result: DateTime[];

        beforeEach(() => {
          rules = normalizeRuleOptions(ruleVariation);
          options = {};
          result = resultsVariation.slice();
        });

        it('', () => {
          controller = build(rules, options);
          expect(Array.from(controller)).toEqual(result);
        });

        describe('options', () => {
          if (args.result.length > 1) {
            it('start', () => {
              options.start = result.shift()!.add(1, 'millisecond');
              controller = build(rules, options);

              const items = Array.from(controller);

              expect(items).toEqual(result);
            });

            it('end', () => {
              options.end = result.pop()!.subtract(1, 'millisecond');
              controller = build(rules, options);

              expect(Array.from(controller)).toEqual(result);
            });
          }

          if (args.result.length > 2) {
            it('start,end', () => {
              options.start = result.shift()!.add(1, 'millisecond');
              options.end = result.pop()!.subtract(1, 'millisecond');
              controller = build(rules, options);

              expect(Array.from(controller)).toEqual(result);
            });
          }

          it('reverse', () => {
            options.reverse = true;
            controller = build(rules, options);

            const items = Array.from(controller);

            expect(items).toEqual(result.reverse());
          });

          if (args.result.length > 1) {
            it('reverse,start', () => {
              options.reverse = true;
              options.start = result.shift()!.add(1, 'millisecond');
              controller = build(rules, options);

              expect(Array.from(controller)).toEqual(result.reverse());
            });

            it('reverse,end', () => {
              options.reverse = true;
              options.end = result.pop()!.subtract(1, 'millisecond');
              controller = build(rules, options);

              expect(Array.from(controller)).toEqual(result.reverse());
            });
          }

          if (args.result.length > 2) {
            it('reverse,start,end', () => {
              options.reverse = true;
              options.start = result.shift()!.add(1, 'millisecond');
              options.end = result.pop()!.subtract(1, 'millisecond');
              controller = build(rules, options);

              expect(Array.from(controller)).toEqual(result.reverse());
            });
          }
        });

        it('allows skipping iterations', () => {
          if (result.length < 3) return;

          controller = build(rules, options);

          let date = controller.next().value;

          expect(date!.toISOString()).toBe(result[0].toISOString());

          date = controller.next({ skipToDate: result[2] }).value;

          expect(date && date.toISOString()).toBe(result[2].toISOString());
        });

        it('allows skipping iterations in reverse', () => {
          if (result.length !== 3) return;

          options.reverse = true;
          controller = build(rules, options);

          let date = controller.next().value;

          expect(date!.toISOString()).toBe(result[2].toISOString());

          date = controller.next({ skipToDate: result[0] }).value;

          expect(date!.toISOString()).toBe(result[0].toISOString());
        });
      });
    });
  });
}

describe('RecurrenceRulesIterator', () => {
  describe('init', () => {
    let options: INormRuleOptions;

    beforeEach(() => {
      options = {
        start: dateTime(2019),
        frequency: 'YEARLY',
        interval: 1,
        weekStart: 'MO',
        byDayOfMonth: [1],
        byDayOfWeek: ['TU'] as RuleOption.ByDayOfWeek[],
      };
    });

    it('1', () => {
      const controller = build(options);

      expect(controller).toBeInstanceOf(RecurrenceRulesIterator);
      expect(controller.start).toEqual(dateTime(2019));
      expect(controller.end).toEqual(undefined);
      expect(controller.reverse).toEqual(false);
      expect(controller.isInfinite).toEqual(true);
      expect(controller.hasDuration).toEqual(false);
    });

    it('2', () => {
      const controller = build(options, {
        start: dateTime(2018),
        end: dateTime(2020),
        reverse: true,
      });

      expect(controller).toBeInstanceOf(RecurrenceRulesIterator);
      expect(controller.start).toEqual(dateTime(2019));
      expect(controller.end).toEqual(dateTime(2020));
      expect(controller.reverse).toEqual(true);
      expect(controller.isInfinite).toEqual(false);
      expect(controller.hasDuration).toEqual(false);
    });

    it('3', () => {
      const controller = build(options, {
        start: dateTime(2020),
        end: dateTime(2020),
      });

      expect(controller.start).toEqual(dateTime(2020));
      expect(controller.end).toEqual(dateTime(2020));
    });

    it('4', () => {
      options.count = 10;
      const controller = build(options, {
        start: dateTime(2020),
        end: dateTime(2021),
        reverse: true,
      });

      expect(controller).toBeInstanceOf(RecurrenceRulesIterator);
      expect(controller.start).toEqual(dateTime(2019));
      expect(controller.end).toEqual(dateTime(2021));
      expect(controller.reverse).toEqual(false);
      expect(controller.isInfinite).toEqual(false);
      expect(controller.hasDuration).toEqual(false);
    });

    it('5', () => {
      options.count = 10;
      const controller = build(options);

      expect(controller).toBeInstanceOf(RecurrenceRulesIterator);
      expect(controller.start).toEqual(dateTime(2019));
      expect(controller.end).toEqual(undefined);
      expect(controller.reverse).toEqual(false);
      expect(controller.isInfinite).toEqual(false);
      expect(controller.hasDuration).toEqual(false);
    });

    it('6', () => {
      options.duration = 10;
      options.count = 10;
      const controller = build(options);

      expect(controller).toBeInstanceOf(RecurrenceRulesIterator);
      expect(controller.start).toEqual(dateTime(2019));
      expect(controller.end).toEqual(undefined);
      expect(controller.reverse).toEqual(false);
      expect(controller.isInfinite).toEqual(false);
      expect(controller.hasDuration).toEqual(true);
    });
  });

  describe('_run()', () => {
    it('testMaxYear', () => {
      const controller = build({
        frequency: 'YEARLY',
        count: 3,
        byMonthOfYear: [2],
        byDayOfMonth: [31],
        start: parse('99970902T090000'),
        interval: 1,
        weekStart: 'MO',
      });

      expect(() => {
        Array.from(controller);
      }).toThrowError();
    });

    context<RuleOption.Frequency>('YEARLY', frequency => {
      testIteration({
        name: 'testYearly',
        rules: {
          frequency,
          start: dateTime(1997, 9, 2, 9),
          count: 3,
        },
        result: [dateTime(1997, 9, 2, 9), dateTime(1998, 9, 2, 9), dateTime(1999, 9, 2, 9)],
      });

      testIteration({
        name: 'testYearlyInterval',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          interval: 2,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1999, 9, 2, 9, 0),
          dateTime(2001, 9, 2, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyIntervalLarge',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          interval: 100,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(2097, 9, 2, 9, 0),
          dateTime(2197, 9, 2, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonth',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMonthOfYear: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 2, 9, 0),
          dateTime(1998, 3, 2, 9, 0),
          dateTime(1999, 1, 2, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonthDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byDayOfMonth: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 3, 9, 0),
          dateTime(1997, 10, 1, 9, 0),
          dateTime(1997, 10, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonthAndMonthDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [5, 7],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 5, 9, 0),
          dateTime(1998, 1, 7, 9, 0),
          dateTime(1998, 3, 5, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByWeekDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 4, 9, 0),
          dateTime(1997, 9, 9, 9, 0),
          // dateTime(1997, 9, 12, 9, 0),
          // dateTime(1997, 9, 16, 9, 0),
          // dateTime(1997, 9, 18, 9, 0),
          // dateTime(1997, 9, 23, 9, 0),
          // dateTime(1997, 9, 25, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByNWeekDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byDayOfWeek: [['TU', 1], ['TH', -1]] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 12, 25, 9, 0),
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 12, 31, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByNWeekDayLarge',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byDayOfWeek: [['TU', 3], ['TH', -3]] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 12, 11, 9, 0),
          dateTime(1998, 1, 20, 9, 0),
          dateTime(1998, 12, 17, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonthAndWeekDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 1, 8, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonthAndNWeekDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: [['TU', 1], ['TH', -1]] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 1, 29, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonthAndNWeekDayLarge',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: [['TU', 3], ['TH', -3]] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 15, 9, 0),
          dateTime(1998, 1, 20, 9, 0),
          dateTime(1998, 3, 12, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonthDayAndWeekDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 2, 3, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMonthAndMonthDayAndWeekDay',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
          dateTime(2001, 3, 1, 9, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByHour',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byHourOfDay: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0),
          dateTime(1998, 9, 2, 6, 0),
          dateTime(1998, 9, 2, 18, 0),
        ],
      });

      testIteration({
        name: 'testYearlyByMinute',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6),
          dateTime(1997, 9, 2, 9, 18),
          dateTime(1998, 9, 2, 9, 6),
        ],
      });

      testIteration({
        name: 'testYearlyBySecond',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 6),
          dateTime(1997, 9, 2, 9, 0, 18),
          dateTime(1998, 9, 2, 9, 0, 6),
        ],
      });

      testIteration({
        name: 'testYearlyByHourAndMinute',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6),
          dateTime(1997, 9, 2, 18, 18),
          dateTime(1998, 9, 2, 6, 6),
        ],
      });

      testIteration({
        name: 'testYearlyByHourAndSecond',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byHourOfDay: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 6),
          dateTime(1997, 9, 2, 18, 0, 18),
          dateTime(1998, 9, 2, 6, 0, 6),
        ],
      });

      testIteration({
        name: 'testYearlyByMinuteAndSecond',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 6),
          dateTime(1997, 9, 2, 9, 6, 18),
          dateTime(1997, 9, 2, 9, 18, 6),
        ],
      });

      testIteration({
        name: 'testYearlyByHourAndMinuteAndSecond',
        rules: {
          frequency: 'YEARLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 6),
          dateTime(1997, 9, 2, 18, 6, 18),
          dateTime(1997, 9, 2, 18, 18, 6),
        ],
      });
    });

    describe('MONTHLY', () => {
      testIteration({
        name: 'testMonthly',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 10, 2, 9, 0),
          dateTime(1997, 11, 2, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyInterval',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          interval: 2,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 11, 2, 9, 0),
          dateTime(1998, 1, 2, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyIntervalLarge',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          interval: 18,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1999, 3, 2, 9, 0),
          dateTime(2000, 9, 2, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonth',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMonthOfYear: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 2, 9, 0),
          dateTime(1998, 3, 2, 9, 0),
          dateTime(1999, 1, 2, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonthDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byDayOfMonth: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 3, 9, 0),
          dateTime(1997, 10, 1, 9, 0),
          dateTime(1997, 10, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonthAndMonthDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [5, 7],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 5, 9, 0),
          dateTime(1998, 1, 7, 9, 0),
          dateTime(1998, 3, 5, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByWeekDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 4, 9, 0),
          dateTime(1997, 9, 9, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByNWeekDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byDayOfWeek: [['TU', 1], ['TH', -1]] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 25, 9, 0),
          dateTime(1997, 10, 7, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByNWeekDayLarge',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byDayOfWeek: [['TU', 3], ['TH', -3]] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 11, 9, 0),
          dateTime(1997, 9, 16, 9, 0),
          dateTime(1997, 10, 16, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonthAndWeekDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 1, 8, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonthAndNWeekDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: [['TU', 1], ['TH', -1]] as RuleOption.ByDayOfWeek[],
          start: dateTime(1997, 9, 2, 9),
        },
        result: [
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 1, 29, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonthAndNWeekDayLarge',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: [['TU', 3], ['TH', -3]] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 15, 9, 0),
          dateTime(1998, 1, 20, 9, 0),
          dateTime(1998, 3, 12, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonthDayAndWeekDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 2, 3, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMonthAndMonthDayAndWeekDay',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
          dateTime(2001, 3, 1, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByHour',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byHourOfDay: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0),
          dateTime(1997, 10, 2, 6, 0),
          dateTime(1997, 10, 2, 18, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyByMinute',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6),
          dateTime(1997, 9, 2, 9, 18),
          dateTime(1997, 10, 2, 9, 6),
        ],
      });

      testIteration({
        name: 'testMonthlyBySecond',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 6),
          dateTime(1997, 9, 2, 9, 0, 18),
          dateTime(1997, 10, 2, 9, 0, 6),
        ],
      });

      testIteration({
        name: 'testMonthlyByHourAndMinute',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6),
          dateTime(1997, 9, 2, 18, 18),
          dateTime(1997, 10, 2, 6, 6),
        ],
      });

      testIteration({
        name: 'testMonthlyByHourAndSecond',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byHourOfDay: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 6),
          dateTime(1997, 9, 2, 18, 0, 18),
          dateTime(1997, 10, 2, 6, 0, 6),
        ],
      });

      testIteration({
        name: 'testMonthlyByMinuteAndSecond',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 6),
          dateTime(1997, 9, 2, 9, 6, 18),
          dateTime(1997, 9, 2, 9, 18, 6),
        ],
      });

      testIteration({
        name: 'testMonthlyByHourAndMinuteAndSecond',
        rules: {
          frequency: 'MONTHLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 6),
          dateTime(1997, 9, 2, 18, 6, 18),
          dateTime(1997, 9, 2, 18, 18, 6),
        ],
      });

      testIteration({
        name: 'testMonthlyNegByMonthDayJanFebForNonLeapYear',
        rules: {
          frequency: 'MONTHLY',
          count: 4,
          byDayOfMonth: [-1],
          start: parse('20131201T0900000'),
        },
        result: [
          dateTime(2013, 12, 31, 9, 0),
          dateTime(2014, 1, 31, 9, 0),
          dateTime(2014, 2, 28, 9, 0),
          dateTime(2014, 3, 31, 9, 0),
        ],
      });

      testIteration({
        name: 'testMonthlyNegByMonthDayJanFebForLeapYear',
        rules: {
          frequency: 'MONTHLY',
          count: 4,
          byDayOfMonth: [-1],
          start: parse('20151201T0900000'),
        },
        result: [
          dateTime(2015, 12, 31, 9, 0),
          dateTime(2016, 1, 31, 9, 0),
          dateTime(2016, 2, 29, 9, 0),
          dateTime(2016, 3, 31, 9, 0),
        ],
      });
    });

    describe('WEEKLY', () => {
      testIteration({
        name: 'testWeekly',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 9, 9, 0),
          dateTime(1997, 9, 16, 9, 0),
        ],
      });

      testIteration({
        name: 'testWeeklyInterval',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          interval: 2,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 16, 9, 0),
          dateTime(1997, 9, 30, 9, 0),
        ],
      });

      testIteration({
        name: 'testWeeklyIntervalLarge',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          interval: 20,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1998, 1, 20, 9, 0),
          dateTime(1998, 6, 9, 9, 0),
        ],
      });

      testIteration({
        name: 'testWeeklyByMonth',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byMonthOfYear: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 1, 13, 9, 0),
          dateTime(1998, 1, 20, 9, 0),
        ],
      });

      testIteration({
        name: 'testWeeklyByWeekDay',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 4, 9, 0),
          dateTime(1997, 9, 9, 9, 0),
        ],
      });

      testIteration({
        name: 'testWeeklyByMonthAndWeekDay',
        // This test is interesting, because it crosses the year
        // boundary in a weekly period to find day '1' as a
        // valid recurrence.
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 1, 8, 9, 0),
        ],
      });

      testIteration({
        name: 'testWeeklyByHour',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byHourOfDay: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0),
          dateTime(1997, 9, 9, 6, 0),
          dateTime(1997, 9, 9, 18, 0),
        ],
      });

      testIteration({
        name: 'testWeeklyByMinute',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6),
          dateTime(1997, 9, 2, 9, 18),
          dateTime(1997, 9, 9, 9, 6),
        ],
      });

      testIteration({
        name: 'testWeeklyBySecond',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 6),
          dateTime(1997, 9, 2, 9, 0, 18),
          dateTime(1997, 9, 9, 9, 0, 6),
        ],
      });

      testIteration({
        name: 'testWeeklyByHourAndMinute',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6),
          dateTime(1997, 9, 2, 18, 18),
          dateTime(1997, 9, 9, 6, 6),
        ],
      });

      testIteration({
        name: 'testWeeklyByHourAndSecond',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byHourOfDay: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 6),
          dateTime(1997, 9, 2, 18, 0, 18),
          dateTime(1997, 9, 9, 6, 0, 6),
        ],
      });

      testIteration({
        name: 'testWeeklyByMinuteAndSecond',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 6),
          dateTime(1997, 9, 2, 9, 6, 18),
          dateTime(1997, 9, 2, 9, 18, 6),
        ],
      });

      testIteration({
        name: 'testWeeklyByHourAndMinuteAndSecond',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 6),
          dateTime(1997, 9, 2, 18, 6, 18),
          dateTime(1997, 9, 2, 18, 18, 6),
        ],
      });

      testIteration({
        name: 'calculates weekly recurrences correctly across DST boundaries',
        rules: {
          frequency: 'WEEKLY',
          start: parse('20181031T180000'),
          end: parse('20181115T050000'),
        },
        result: [dateTime(2018, 10, 31, 18), dateTime(2018, 11, 7, 18), dateTime(2018, 11, 14, 18)],
      });

      testIteration({
        name: 'calculates byweekday recurrences correctly across DST boundaries',
        rules: {
          frequency: 'WEEKLY',
          start: parse('20181001T000000'),
          end: parse('20181009T000000'),
          byDayOfWeek: ['SU', 'WE'] as RuleOption.ByDayOfWeek[],
        },
        result: [dateTime(2018, 10, 3), dateTime(2018, 10, 7)],
      });

      testIteration({
        name: 'testWkStIntervalMO',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          interval: 2,
          byDayOfWeek: ['TU', 'SU'] as RuleOption.ByDayOfWeek[],
          weekStart: 'MO',
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 7, 9, 0),
          dateTime(1997, 9, 16, 9, 0),
        ],
      });

      testIteration({
        name: 'testWkStIntervalSU',
        rules: {
          frequency: 'WEEKLY',
          count: 3,
          interval: 2,
          byDayOfWeek: ['TU', 'SU'] as RuleOption.ByDayOfWeek[],
          weekStart: 'SU',
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 14, 9, 0),
          dateTime(1997, 9, 16, 9, 0),
        ],
      });
    });

    describe('DAILY', () => {
      testIteration({
        name: 'testDaily',
        rules: {
          frequency: 'DAILY',
          count: 3,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 3, 9, 0),
          dateTime(1997, 9, 4, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyInterval',
        rules: {
          frequency: 'DAILY',
          count: 3,
          interval: 2,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 4, 9, 0),
          dateTime(1997, 9, 6, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyIntervalLarge',
        rules: {
          frequency: 'DAILY',
          count: 3,
          interval: 92,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 12, 3, 9, 0),
          dateTime(1998, 3, 5, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByMonth',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byMonthOfYear: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 1, 2, 9, 0),
          dateTime(1998, 1, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByMonthDay',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byDayOfMonth: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 3, 9, 0),
          dateTime(1997, 10, 1, 9, 0),
          dateTime(1997, 10, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByMonthAndMonthDay',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [5, 7],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 5, 9, 0),
          dateTime(1998, 1, 7, 9, 0),
          dateTime(1998, 3, 5, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByWeekDay',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 4, 9, 0),
          dateTime(1997, 9, 9, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByMonthAndWeekDay',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 1, 6, 9, 0),
          dateTime(1998, 1, 8, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByMonthDayAndWeekDay',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 2, 3, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByMonthAndMonthDayAndWeekDay',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 9, 0),
          dateTime(1998, 3, 3, 9, 0),
          dateTime(2001, 3, 1, 9, 0),
        ],
      });

      testIteration({
        name: 'testDailyByHour',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byHourOfDay: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0),
          dateTime(1997, 9, 3, 6, 0),
          dateTime(1997, 9, 3, 18, 0),
        ],
      });

      testIteration({
        name: 'testDailyByMinute',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6),
          dateTime(1997, 9, 2, 9, 18),
          dateTime(1997, 9, 3, 9, 6),
        ],
      });

      testIteration({
        name: 'testDailyBySecond',
        rules: {
          frequency: 'DAILY',
          count: 3,
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 6),
          dateTime(1997, 9, 2, 9, 0, 18),
          dateTime(1997, 9, 3, 9, 0, 6),
        ],
      });

      testIteration({
        name: 'testDailyByHourAndMinute',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6),
          dateTime(1997, 9, 2, 18, 18),
          dateTime(1997, 9, 3, 6, 6),
        ],
      });

      testIteration({
        name: 'testDailyByHourAndSecond',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byHourOfDay: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 6),
          dateTime(1997, 9, 2, 18, 0, 18),
          dateTime(1997, 9, 3, 6, 0, 6),
        ],
      });

      testIteration({
        name: 'testDailyByMinuteAndSecond',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 6),
          dateTime(1997, 9, 2, 9, 6, 18),
          dateTime(1997, 9, 2, 9, 18, 6),
        ],
      });

      testIteration({
        name: 'testDailyByHourAndMinuteAndSecond',
        rules: {
          frequency: 'DAILY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 6),
          dateTime(1997, 9, 2, 18, 6, 18),
          dateTime(1997, 9, 2, 18, 18, 6),
        ],
      });

      testIteration({
        name: 'calculates daily recurrences correctly across DST boundaries',
        rules: {
          frequency: 'DAILY',
          start: parse('20181101T110000'),
          end: parse('20181106T110000'),
        },
        result: [
          dateTime(2018, 11, 1, 11),
          dateTime(2018, 11, 2, 11),
          dateTime(2018, 11, 3, 11),
          dateTime(2018, 11, 4, 11),
          dateTime(2018, 11, 5, 11),
          dateTime(2018, 11, 6, 11),
        ],
      });
    });

    describe('HOURLY', () => {
      testIteration({
        name: 'testHourly',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 2, 10, 0),
          dateTime(1997, 9, 2, 11, 0),
        ],
      });

      testIteration({
        name: 'testHourlyInterval',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          interval: 2,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 2, 11, 0),
          dateTime(1997, 9, 2, 13, 0),
        ],
      });

      testIteration({
        name: 'testHourlyIntervalLarge',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          interval: 769,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 10, 4, 10, 0),
          dateTime(1997, 11, 5, 11, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByMonth',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byMonthOfYear: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 1, 0),
          dateTime(1998, 1, 1, 2, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByMonthDay',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byDayOfMonth: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 3, 0, 0),
          dateTime(1997, 9, 3, 1, 0),
          dateTime(1997, 9, 3, 2, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByMonthAndMonthDay',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [5, 7],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 5, 0, 0),
          dateTime(1998, 1, 5, 1, 0),
          dateTime(1998, 1, 5, 2, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByWeekDay',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 2, 10, 0),
          dateTime(1997, 9, 2, 11, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByMonthAndWeekDay',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 1, 0),
          dateTime(1998, 1, 1, 2, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByMonthDayAndWeekDay',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 1, 0),
          dateTime(1998, 1, 1, 2, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByMonthAndMonthDayAndWeekDay',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 1, 0),
          dateTime(1998, 1, 1, 2, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByHour',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byHourOfDay: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0),
          dateTime(1997, 9, 3, 6, 0),
          dateTime(1997, 9, 3, 18, 0),
        ],
      });

      testIteration({
        name: 'testHourlyByMinute',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6),
          dateTime(1997, 9, 2, 9, 18),
          dateTime(1997, 9, 2, 10, 6),
        ],
      });

      testIteration({
        name: 'testHourlyBySecond',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 6),
          dateTime(1997, 9, 2, 9, 0, 18),
          dateTime(1997, 9, 2, 10, 0, 6),
        ],
      });

      testIteration({
        name: 'testHourlyByHourAndMinute',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6),
          dateTime(1997, 9, 2, 18, 18),
          dateTime(1997, 9, 3, 6, 6),
        ],
      });

      testIteration({
        name: 'testHourlyByHourAndSecond',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byHourOfDay: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 6),
          dateTime(1997, 9, 2, 18, 0, 18),
          dateTime(1997, 9, 3, 6, 0, 6),
        ],
      });

      testIteration({
        name: 'testHourlyByMinuteAndSecond',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 6),
          dateTime(1997, 9, 2, 9, 6, 18),
          dateTime(1997, 9, 2, 9, 18, 6),
        ],
      });

      testIteration({
        name: 'testHourlyByHourAndMinuteAndSecond',
        rules: {
          frequency: 'HOURLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 6),
          dateTime(1997, 9, 2, 18, 6, 18),
          dateTime(1997, 9, 2, 18, 18, 6),
        ],
      });
    });

    describe('MINUTELY', () => {
      testIteration({
        name: 'testMinutely',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 2, 9, 1),
          dateTime(1997, 9, 2, 9, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyInterval',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          interval: 2,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 2, 9, 2),
          dateTime(1997, 9, 2, 9, 4),
        ],
      });

      testIteration({
        name: 'testMinutelyIntervalLarge',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          interval: 1501,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 3, 10, 1),
          dateTime(1997, 9, 4, 11, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByMonth',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byMonthOfYear: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 0, 1),
          dateTime(1998, 1, 1, 0, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByMonthDay',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byDayOfMonth: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 3, 0, 0),
          dateTime(1997, 9, 3, 0, 1),
          dateTime(1997, 9, 3, 0, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByMonthAndMonthDay',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [5, 7],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 5, 0, 0),
          dateTime(1998, 1, 5, 0, 1),
          dateTime(1998, 1, 5, 0, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByWeekDay',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0),
          dateTime(1997, 9, 2, 9, 1),
          dateTime(1997, 9, 2, 9, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByMonthAndWeekDay',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 0, 1),
          dateTime(1998, 1, 1, 0, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByMonthDayAndWeekDay',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 0, 1),
          dateTime(1998, 1, 1, 0, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByMonthAndMonthDayAndWeekDay',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0),
          dateTime(1998, 1, 1, 0, 1),
          dateTime(1998, 1, 1, 0, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByHour',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byHourOfDay: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0),
          dateTime(1997, 9, 2, 18, 1),
          dateTime(1997, 9, 2, 18, 2),
        ],
      });

      testIteration({
        name: 'testMinutelyByMinute',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6),
          dateTime(1997, 9, 2, 9, 18),
          dateTime(1997, 9, 2, 10, 6),
        ],
      });

      testIteration({
        name: 'testMinutelyBySecond',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 6),
          dateTime(1997, 9, 2, 9, 0, 18),
          dateTime(1997, 9, 2, 9, 1, 6),
        ],
      });

      testIteration({
        name: 'testMinutelyByHourAndMinute',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6),
          dateTime(1997, 9, 2, 18, 18),
          dateTime(1997, 9, 3, 6, 6),
        ],
      });

      testIteration({
        name: 'testMinutelyByHourAndSecond',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byHourOfDay: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 6),
          dateTime(1997, 9, 2, 18, 0, 18),
          dateTime(1997, 9, 2, 18, 1, 6),
        ],
      });

      testIteration({
        name: 'testMinutelyByMinuteAndSecond',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 6),
          dateTime(1997, 9, 2, 9, 6, 18),
          dateTime(1997, 9, 2, 9, 18, 6),
        ],
      });

      testIteration({
        name: 'testMinutelyByHourAndMinuteAndSecond',
        rules: {
          frequency: 'MINUTELY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T180606'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 6),
          dateTime(1997, 9, 2, 18, 6, 18),
          dateTime(1997, 9, 2, 18, 18, 6),
        ],
      });
    });

    describe('SECONDLY', () => {
      testIteration({
        name: 'testSecondly',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 0),
          dateTime(1997, 9, 2, 9, 0, 1),
          dateTime(1997, 9, 2, 9, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyInterval',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          interval: 2,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 0),
          dateTime(1997, 9, 2, 9, 0, 2),
          dateTime(1997, 9, 2, 9, 0, 4),
        ],
      });

      testIteration({
        name: 'testSecondlyIntervalLarge',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          interval: 90061,
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 0),
          dateTime(1997, 9, 3, 10, 1, 1),
          dateTime(1997, 9, 4, 11, 2, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByMonth',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byMonthOfYear: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0, 0),
          dateTime(1998, 1, 1, 0, 0, 1),
          dateTime(1998, 1, 1, 0, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByMonthDay',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byDayOfMonth: [1, 3],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 3, 0, 0, 0),
          dateTime(1997, 9, 3, 0, 0, 1),
          dateTime(1997, 9, 3, 0, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByMonthAndMonthDay',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [5, 7],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 5, 0, 0, 0),
          dateTime(1998, 1, 5, 0, 0, 1),
          dateTime(1998, 1, 5, 0, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByWeekDay',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 0),
          dateTime(1997, 9, 2, 9, 0, 1),
          dateTime(1997, 9, 2, 9, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByMonthAndWeekDay',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0, 0),
          dateTime(1998, 1, 1, 0, 0, 1),
          dateTime(1998, 1, 1, 0, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByMonthDayAndWeekDay',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0, 0),
          dateTime(1998, 1, 1, 0, 0, 1),
          dateTime(1998, 1, 1, 0, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByMonthAndMonthDayAndWeekDay',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byMonthOfYear: [1, 3],
          byDayOfMonth: [1, 3],
          byDayOfWeek: ['TU', 'TH'] as RuleOption.ByDayOfWeek[],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1998, 1, 1, 0, 0, 0),
          dateTime(1998, 1, 1, 0, 0, 1),
          dateTime(1998, 1, 1, 0, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByHour',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byHourOfDay: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 0),
          dateTime(1997, 9, 2, 18, 0, 1),
          dateTime(1997, 9, 2, 18, 0, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByMinute',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 0),
          dateTime(1997, 9, 2, 9, 6, 1),
          dateTime(1997, 9, 2, 9, 6, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyBySecond',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 0, 6),
          dateTime(1997, 9, 2, 9, 0, 18),
          dateTime(1997, 9, 2, 9, 1, 6),
        ],
      });

      testIteration({
        name: 'testSecondlyByHourAndMinute',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 0),
          dateTime(1997, 9, 2, 18, 6, 1),
          dateTime(1997, 9, 2, 18, 6, 2),
        ],
      });

      testIteration({
        name: 'testSecondlyByHourAndSecond',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byHourOfDay: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 0, 6),
          dateTime(1997, 9, 2, 18, 0, 18),
          dateTime(1997, 9, 2, 18, 1, 6),
        ],
      });

      testIteration({
        name: 'testSecondlyByMinuteAndSecond',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 9, 6, 6),
          dateTime(1997, 9, 2, 9, 6, 18),
          dateTime(1997, 9, 2, 9, 18, 6),
        ],
      });

      testIteration({
        name: 'testSecondlyByHourAndMinuteAndSecond',
        rules: {
          frequency: 'SECONDLY',
          count: 3,
          byHourOfDay: [6, 18],
          byMinuteOfHour: [6, 18],
          bySecondOfMinute: [6, 18],
          start: parse('19970902T090000'),
        },
        result: [
          dateTime(1997, 9, 2, 18, 6, 6),
          dateTime(1997, 9, 2, 18, 6, 18),
          dateTime(1997, 9, 2, 18, 18, 6),
        ],
      });
    });

    describe('MILLISECONDLY', () => {
      testIteration({
        name: 'testMillisecondly',
        rules: {
          frequency: 'MILLISECONDLY',
          count: 3,
          start: dateTime(2000, 9, 2, 9, 0, 1, 0),
        },
        result: [
          dateTime(2000, 9, 2, 9, 0, 1, 0),
          dateTime(2000, 9, 2, 9, 0, 1, 1),
          dateTime(2000, 9, 2, 9, 0, 1, 2),
        ],
      });

      testIteration({
        name: 'testMillisecondlyInterval',
        rules: {
          frequency: 'MILLISECONDLY',
          count: 3,
          interval: 2,
          start: dateTime(2000, 9, 2, 9, 0, 1, 0),
        },
        result: [
          dateTime(2000, 9, 2, 9, 0, 1, 0),
          dateTime(2000, 9, 2, 9, 0, 1, 2),
          dateTime(2000, 9, 2, 9, 0, 1, 4),
        ],
      });
    });
  });
});

const recurrenceRules = [
  FrequencyRuleModule,
  ByMonthOfYearRuleModule,
  ByDayOfMonthRuleModule,
  ByDayOfWeekRuleModule,
  ByHourOfDayRuleModule,
  ByMinuteOfHourRuleModule,
  BySecondOfMinuteRuleModule,
  ByMillisecondOfSecondRuleModule,
];

function build(
  options: INormRuleOptions,
  args: { start?: DateTime; end?: DateTime; reverse?: boolean } = {},
): RecurrenceRulesIterator<INormRuleOptions> {
  return new RecurrenceRulesIterator<INormRuleOptions>(
    recurrenceRulesReducer(recurrenceRules),
    options,
    args,
  );
}

function parse(str: string) {
  const parts: number[] = str
    .match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)!
    .map(part => Number(part));

  parts.shift();

  return dateTime(...parts);
}

function normalizeRuleOptions(options: IRuleOptions) {
  // the `DateAdapter` constructor will never be used because we're providing
  // `DateTime` objects.
  return _normalizeRuleOptions(recurrenceRules, options) as INormRuleOptions;
}

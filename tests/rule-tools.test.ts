import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  ConstructorReturnType,
  DateAdapter as DateAdapterConstructor,
  IProvidedRuleOptions,
  Schedule,
} from '@rschedule/rschedule';
import {
  addSchedulePattern,
  buildRecurrencePattern,
  cleanScheduleEXDates,
  endScheduleRecurrencePattern,
  isRecurrencePattern,
  Pattern,
  RecurrencePattern,
  removeSchedulePattern,
  scheduleHasPattern,
  validRecurrencePatternsOnDate,
} from '@rschedule/rule-tools';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime as LuxonDateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import {
  context,
  DatetimeFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  standardDatetimeFn,
  test,
  timezoneDateAdapterFn,
  TIMEZONES,
} from './utilities';

const DATE_ADAPTERS = [
  [StandardDateAdapter, standardDatetimeFn],
  [MomentDateAdapter, momentDatetimeFn],
  [MomentTZDateAdapter, momentTZDatetimeFn],
  [LuxonDateAdapter, luxonDatetimeFn],
] as [
  [typeof StandardDateAdapter, DatetimeFn<Date>],
  [typeof MomentDateAdapter, DatetimeFn<MomentST>],
  [typeof MomentTZDateAdapter, DatetimeFn<MomentTZ>],
  [typeof LuxonDateAdapter, DatetimeFn<LuxonDateTime>]
];

DATE_ADAPTERS.forEach(dateAdapterSet => {
  environment(dateAdapterSet, dateAdapterSet => {
    const [DateAdapter, datetime] = dateAdapterSet as [
      typeof DateAdapterConstructor,
      DatetimeFn<any>
    ];

    // const zones = !DateAdapter.hasTimezoneSupport ? [null, 'UTC'] : ['UTC'];
    const zones = !DateAdapter.hasTimezoneSupport ? ([null, 'UTC'] as const) : TIMEZONES;

    zones.forEach(zone => {
      // function to create new dateAdapter instances
      const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, zone);

      context(zone, () => {
        function testIsRecurrencePattern<T extends typeof DateAdapter>(
          name: string,
          date: ConstructorReturnType<T>,
          optionsFn: (date: ConstructorReturnType<T>) => IProvidedRuleOptions<T>,
          expectations: [RecurrencePattern, boolean][],
        ) {
          describe('isRecurrencePattern()', () => {
            it(name, () => {
              expectations.forEach(pair => {
                expect(
                  isRecurrencePattern(pair[0], date, optionsFn(date), {
                    dateAdapter: DateAdapter as T,
                  }),
                ).toBe(pair[1]);
              });
            });
          });
        }

        describe('Rule', () => {
          [
            dateAdapter(2019, 10, 10, 8, 9, 1),
            dateAdapter(2019, 10, 30),
            dateAdapter(2020, 3, 5),
            dateAdapter(1997, 4, 7),
          ].forEach(date => {
            context(date, date => {
              describe('buildRecurrencePattern()', () => {
                test('every [WEEKDAY]', (pattern: RecurrencePattern) => {
                  expect(
                    buildRecurrencePattern(pattern, date, { dateAdapter: DateAdapter }),
                  ).toEqual({
                    start: date,
                    frequency: 'WEEKLY',
                    byDayOfWeek: [date.toDateTime().get('weekday')],
                  });
                });

                test('the [MONTH_WEEKNO] [WEEKDAY] of every month', (pattern: RecurrencePattern) => {
                  expect(
                    buildRecurrencePattern(pattern, date, { dateAdapter: DateAdapter }),
                  ).toEqual({
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [
                      [
                        date.toDateTime().get('weekday'),
                        Math.ceil(date.toDateTime().get('day') / 7),
                      ],
                    ],
                  });
                });

                test('the [MONTH_DAYNO] of every month', (pattern: RecurrencePattern) => {
                  expect(
                    buildRecurrencePattern(pattern, date, { dateAdapter: DateAdapter }),
                  ).toEqual({
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [date.toDateTime().get('day')],
                  });
                });

                test('the last [WEEKDAY] of every month', (pattern: RecurrencePattern) => {
                  expect(
                    buildRecurrencePattern(pattern, date, { dateAdapter: DateAdapter }),
                  ).toEqual({
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [[date.toDateTime().get('weekday'), -1]],
                  });
                });
              });
            });
          });

          describe('validRecurrencePatternsOnDate()', () => {
            test(dateAdapter(2019, 10, 10, 8, 9, 1), date => {
              expect(validRecurrencePatternsOnDate(date, { dateAdapter: DateAdapter })).toEqual([
                'every [WEEKDAY]',
                'the [MONTH_WEEKNO] [WEEKDAY] of every month',
                'the [MONTH_DAYNO] of every month',
              ]);
            });

            test(dateAdapter(2019, 10, 30), date => {
              expect(validRecurrencePatternsOnDate(date, { dateAdapter: DateAdapter })).toEqual([
                'every [WEEKDAY]',
                'the [MONTH_WEEKNO] [WEEKDAY] of every month',
                'the [MONTH_DAYNO] of every month',
                'the last [WEEKDAY] of every month',
              ]);
            });

            test(dateAdapter(1997, 4, 7), date => {
              expect(validRecurrencePatternsOnDate(date, { dateAdapter: DateAdapter })).toEqual([
                'every [WEEKDAY]',
                'the [MONTH_WEEKNO] [WEEKDAY] of every month',
                'the [MONTH_DAYNO] of every month',
              ]);
            });
          });

          describe('isRecurrencePattern()', () => {
            function weeklyTH<T extends typeof DateAdapter>(
              date: ConstructorReturnType<T>,
            ): IProvidedRuleOptions<T> {
              return {
                start: date,
                frequency: 'WEEKLY',
                byDayOfWeek: ['TH'],
              };
            }

            function weeklyMO<T extends typeof DateAdapter>(
              date: ConstructorReturnType<T>,
            ): IProvidedRuleOptions<T> {
              return {
                start: date,
                frequency: 'WEEKLY',
                byDayOfWeek: ['MO'],
              };
            }

            function dailyTH<T extends typeof DateAdapter>(
              date: ConstructorReturnType<T>,
            ): IProvidedRuleOptions<T> {
              return {
                start: date,
                frequency: 'DAILY',
                byDayOfWeek: ['TH'],
              };
            }

            function monthly2ndTH<T extends typeof DateAdapter>(
              date: ConstructorReturnType<T>,
            ): IProvidedRuleOptions<T> {
              return {
                start: date,
                frequency: 'MONTHLY',
                byDayOfWeek: [['TH', 2]],
              };
            }

            function monthlyLastWE<T extends typeof DateAdapter>(
              date: ConstructorReturnType<T>,
            ): IProvidedRuleOptions<T> {
              return {
                start: date,
                frequency: 'MONTHLY',
                byDayOfWeek: [['WE', -1]],
              };
            }

            function monthly14th<T extends typeof DateAdapter>(
              date: ConstructorReturnType<T>,
            ): IProvidedRuleOptions<T> {
              return {
                start: date,
                frequency: 'MONTHLY',
                byDayOfMonth: [14],
              };
            }

            context(dateAdapter(2019, 10, 10, 8, 9, 1), date => {
              testIsRecurrencePattern('weeklyTH', date, weeklyTH, [
                ['every [WEEKDAY]', true],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('weeklyMO', date, weeklyMO, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('dailyTH', date, dailyTH, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthly2ndTH', date, monthly2ndTH, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', true],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthly14th', date, monthly14th, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthlyLastWE', date, monthlyLastWE, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);
            });

            context(dateAdapter(2019, 10, 30), date => {
              testIsRecurrencePattern('weeklyTH', date, weeklyTH, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('weeklyMO', date, weeklyMO, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('dailyTH', date, dailyTH, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthly2ndTH', date, monthly2ndTH, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthly14th', date, monthly14th, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthlyLastWE', date, monthlyLastWE, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', true],
              ]);
            });

            context(dateAdapter(2019, 11, 14), date => {
              testIsRecurrencePattern('weeklyTH', date, weeklyTH, [
                ['every [WEEKDAY]', true],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('weeklyMO', date, weeklyMO, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('dailyTH', date, dailyTH, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthly2ndTH', date, monthly2ndTH, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', true],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthly14th', date, monthly14th, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', true],
                ['the last [WEEKDAY] of every month', false],
              ]);

              testIsRecurrencePattern('monthlyLastWE', date, monthlyLastWE, [
                ['every [WEEKDAY]', false],
                ['the [MONTH_WEEKNO] [WEEKDAY] of every month', false],
                ['the [MONTH_DAYNO] of every month', false],
                ['the last [WEEKDAY] of every month', false],
              ]);
            });
          });
        });

        describe('Schedule', () => {
          let scheduleWEEKDAY: Schedule<typeof DateAdapter>;
          let scheduleCOMBINED: Schedule<typeof DateAdapter>;
          let scheduleEmpty: Schedule<typeof DateAdapter>;
          const date = dateAdapter(2019, 10, 10);
          const dateTime = date.toDateTime();

          beforeEach(() => {
            scheduleWEEKDAY = new Schedule({
              rrules: [
                {
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                },
              ],
              dateAdapter: DateAdapter,
            });

            scheduleCOMBINED = new Schedule({
              rrules: [
                {
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfWeek: [['TH', 2]],
                },
                {
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfMonth: [14],
                },
                {
                  start: dateTime.subtract(1, 'month'),
                  frequency: 'MONTHLY',
                  byDayOfMonth: [14],
                },
                {
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfWeek: [['WE', -1]],
                },
              ],
              rdates: [date],
              exdates: [date, dateTime.add(1, 'day')],
              dateAdapter: DateAdapter,
            });

            scheduleEmpty = new Schedule({
              dateAdapter: DateAdapter,
            });
          });

          describe('addSchedulePattern()', () => {
            context('every [WEEKDAY]', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = addSchedulePattern(pattern, date, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(2);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
                expect(scheduleWEEKDAY.rrules[1].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: [date.toDateTime().get('weekday')],
                });
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = addSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(1);
                expect(scheduleEmpty.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: [date.toDateTime().get('weekday')],
                });
              });
            });

            context('the [MONTH_WEEKNO] [WEEKDAY] of every month', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = addSchedulePattern(pattern, date, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(2);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
                expect(scheduleWEEKDAY.rrules[1].options).toEqual({
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfWeek: [
                    [date.toDateTime().get('weekday'), Math.ceil(date.toDateTime().get('day') / 7)],
                  ],
                });
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = addSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(1);
                expect(scheduleEmpty.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfWeek: [
                    [date.toDateTime().get('weekday'), Math.ceil(date.toDateTime().get('day') / 7)],
                  ],
                });
              });
            });

            context('the [MONTH_DAYNO] of every month', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = addSchedulePattern(pattern, date, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(2);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
                expect(scheduleWEEKDAY.rrules[1].options).toEqual({
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfMonth: [date.toDateTime().get('day')],
                });
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = addSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(1);
                expect(scheduleEmpty.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfMonth: [date.toDateTime().get('day')],
                });
              });
            });

            context('the last [WEEKDAY] of every month', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = addSchedulePattern(pattern, date, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(2);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
                expect(scheduleWEEKDAY.rrules[1].options).toEqual({
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfWeek: [[date.toDateTime().get('weekday'), -1]],
                });
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = addSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(1);
                expect(scheduleEmpty.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'MONTHLY',
                  byDayOfWeek: [[date.toDateTime().get('weekday'), -1]],
                });
              });
            });

            context('date', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = addSchedulePattern(pattern, date, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
                expect(scheduleWEEKDAY.rdates.length).toBe(1);
                expect(scheduleWEEKDAY.rdates.adapters[0].toISOString()).toEqual(
                  date.toISOString(),
                );
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = addSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
                expect(scheduleEmpty.rdates.length).toBe(1);
                expect(scheduleEmpty.rdates.adapters[0].toISOString()).toEqual(date.toISOString());
              });
            });
          });

          describe('endScheduleRecurrencePattern()', () => {
            context('every [WEEKDAY]', (pattern: RecurrencePattern) => {
              const end = dateTime.add(1, 'week');

              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = endScheduleRecurrencePattern(pattern, end, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                  end,
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = endScheduleRecurrencePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(4);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['TH', 2]],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: dateTime.subtract(1, 'month'),
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['WE', -1]],
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = endScheduleRecurrencePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });

            context('the [MONTH_WEEKNO] [WEEKDAY] of every month', (pattern: RecurrencePattern) => {
              const end = dateTime.set('month', 11).set('day', 14);

              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = endScheduleRecurrencePattern(pattern, end, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = endScheduleRecurrencePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(4);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['TH', 2]],
                    end,
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: dateTime.subtract(1, 'month'),
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['WE', -1]],
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = endScheduleRecurrencePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });

            context('the [MONTH_DAYNO] of every month', (pattern: RecurrencePattern) => {
              const end = dateTime.set('day', 14);

              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = endScheduleRecurrencePattern(pattern, end, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = endScheduleRecurrencePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(4);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['TH', 2]],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                    end,
                  },
                  {
                    start: dateTime.subtract(1, 'month'),
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                    end,
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['WE', -1]],
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = endScheduleRecurrencePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });

            context('the last [WEEKDAY] of every month', (pattern: RecurrencePattern) => {
              const end = dateTime.set('day', 30);

              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = endScheduleRecurrencePattern(pattern, end, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = endScheduleRecurrencePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(4);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['TH', 2]],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: dateTime.subtract(1, 'month'),
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['WE', -1]],
                    end,
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = endScheduleRecurrencePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });
          });

          describe('removeSchedulePattern()', () => {
            context('every [WEEKDAY]', (pattern: RecurrencePattern) => {
              const end = dateTime.add(1, 'week');

              it('scheduleWEEKDAY', () => {
                expect(
                  removeSchedulePattern(pattern, end, scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }).rrules.length,
                ).toBe(0);

                expect(
                  removeSchedulePattern(pattern, end.subtract(2, 'week'), scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }).rrules[0].options,
                ).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = removeSchedulePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(4);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['TH', 2]],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: dateTime.subtract(1, 'month'),
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['WE', -1]],
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = removeSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });

            context('the [MONTH_WEEKNO] [WEEKDAY] of every month', (pattern: RecurrencePattern) => {
              const end = dateTime.set('month', 11).set('day', 14);

              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = removeSchedulePattern(pattern, end, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = removeSchedulePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(3);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: dateTime.subtract(1, 'month'),
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['WE', -1]],
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = removeSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });

            context('the [MONTH_DAYNO] of every month', (pattern: RecurrencePattern) => {
              const end = dateTime.set('day', 14);

              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = removeSchedulePattern(pattern, end, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = removeSchedulePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(2);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['TH', 2]],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['WE', -1]],
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = removeSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });

            context('the last [WEEKDAY] of every month', (pattern: RecurrencePattern) => {
              const end = dateTime.set('day', 30);

              it('scheduleWEEKDAY', () => {
                scheduleWEEKDAY = removeSchedulePattern(pattern, end, scheduleWEEKDAY, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleWEEKDAY.rrules.length).toBe(1);
                expect(scheduleWEEKDAY.rrules[0].options).toEqual({
                  start: date,
                  frequency: 'WEEKLY',
                  byDayOfWeek: ['TH'],
                });
              });

              it('scheduleCOMBINED', () => {
                scheduleCOMBINED = removeSchedulePattern(pattern, end, scheduleCOMBINED, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleCOMBINED.rrules.length).toBe(3);
                expect(scheduleCOMBINED.rrules.map(rule => rule.options)).toEqual([
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfWeek: [['TH', 2]],
                  },
                  {
                    start: date,
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                  {
                    start: dateTime.subtract(1, 'month'),
                    frequency: 'MONTHLY',
                    byDayOfMonth: [14],
                  },
                ]);
              });

              it('scheduleEmpty', () => {
                scheduleEmpty = removeSchedulePattern(pattern, date, scheduleEmpty, {
                  dateAdapter: DateAdapter,
                });

                expect(scheduleEmpty.rrules.length).toBe(0);
              });
            });
          });

          describe('scheduleHasPattern()', () => {
            context('every [WEEKDAY]', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(true);

                expect(
                  scheduleHasPattern(pattern, dateTime.add(1, 'day'), scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });

              it('scheduleCOMBINED', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleCOMBINED, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });

              it('scheduleEmpty', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleEmpty, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });
            });

            context('the [MONTH_WEEKNO] [WEEKDAY] of every month', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });

              it('scheduleCOMBINED', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleCOMBINED, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(true);

                expect(
                  scheduleHasPattern(
                    pattern,
                    dateTime.add(1, 'month').set('day', 14),
                    scheduleCOMBINED,
                    {
                      dateAdapter: DateAdapter,
                    },
                  ),
                ).toBe(true);

                expect(
                  scheduleHasPattern(
                    pattern,
                    dateTime.add(1, 'month').set('day', 13),
                    scheduleCOMBINED,
                    {
                      dateAdapter: DateAdapter,
                    },
                  ),
                ).toBe(false);
              });

              it('scheduleEmpty', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleEmpty, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });
            });

            context('the [MONTH_DAYNO] of every month', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });

              it('scheduleCOMBINED', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleCOMBINED, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);

                expect(
                  scheduleHasPattern(pattern, dateTime.set('day', 14), scheduleCOMBINED, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(true);
              });

              it('scheduleEmpty', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleEmpty, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });
            });

            context('the last [WEEKDAY] of every month', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });

              it('scheduleCOMBINED', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleCOMBINED, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);

                expect(
                  scheduleHasPattern(pattern, dateTime.set('day', 30), scheduleCOMBINED, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(true);
              });

              it('scheduleEmpty', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleEmpty, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });
            });

            context('date', (pattern: Pattern) => {
              it('scheduleWEEKDAY', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleWEEKDAY, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });

              it('scheduleCOMBINED', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleCOMBINED, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(true);
              });

              it('scheduleEmpty', () => {
                expect(
                  scheduleHasPattern(pattern, date, scheduleEmpty, {
                    dateAdapter: DateAdapter,
                  }),
                ).toBe(false);
              });
            });
          });

          it('cleanScheduleEXDates()', () => {
            scheduleCOMBINED = cleanScheduleEXDates(scheduleCOMBINED);
            expect(scheduleCOMBINED.exdates.length).toBe(1);
            expect(scheduleCOMBINED.exdates.adapters[0].toISOString()).toBe(date.toISOString());
          });
        });
      });
    });
  });
});

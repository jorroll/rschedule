// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/umd/main.js',
      name: 'rSchedule',
      format: 'umd',
    },
    external: [],
    plugins: [
      typescript({
        tsconfig: './tsconfig.umd.json',
      }),
    ],
  },
  {
    input: './src/generators/index.ts',
    output: {
      file: './build/umd/generators.js',
      name: 'rScheduleGenerators',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
      },
    },
    external: ['@rschedule/core'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.umd.json',
      }),
    ],
  },
  {
    input: './src/rules/public_api.ts',
    output: {
      file: './build/umd/rules.js',
      name: 'rScheduleRules',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
      },
    },
    external: ['@rschedule/core'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.umd.json',
      }),
    ],
  },
  // {
  //   input: './rules/01-frequency/index.ts',
  //   output: {
  //     file: './build/umd/rules/Frequency.js',
  //     name: 'rScheduleRulesFrequency',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //     },
  //   },
  //   external: ['@rschedule/core'],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/02-by-month-of-year/index.ts',
  //   output: {
  //     file: './build/umd/rules/ByMonthOfYear.js',
  //     name: 'rScheduleRulesByMonthOfYear',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByDayOfMonth': 'rScheduleRulesByDayOfMonth',
  //       '@rschedule/core/rules/ByDayOfWeek': 'rScheduleRulesByDayOfWeek',
  //       '@rschedule/core/rules/ByHourOfDay': 'rScheduleRulesByHourOfDay',
  //       '@rschedule/core/rules/ByMinuteOfHour': 'rScheduleRulesByMinuteOfHour',
  //       '@rschedule/core/rules/BySecondOfMinute': 'rScheduleRulesBySecondOfMinute',
  //       '@rschedule/core/rules/ByMillisecondOfSecond': 'rScheduleRulesByMillisecondOfSecond',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByDayOfMonth',
  //     '@rschedule/core/rules/ByDayOfWeek',
  //     '@rschedule/core/rules/ByHourOfDay',
  //     '@rschedule/core/rules/ByMinuteOfHour',
  //     '@rschedule/core/rules/BySecondOfMinute',
  //     '@rschedule/core/rules/ByMillisecondOfSecond',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/05-by-day-of-month/index.ts',
  //   output: {
  //     file: './build/umd/rules/ByDayOfMonth.js',
  //     name: 'rScheduleRulesByDayOfMonth',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByMonthOfYear': 'rScheduleRulesByMonthOfYear',
  //       '@rschedule/core/rules/ByDayOfWeek': 'rScheduleRulesByDayOfWeek',
  //       '@rschedule/core/rules/ByHourOfDay': 'rScheduleRulesByHourOfDay',
  //       '@rschedule/core/rules/ByMinuteOfHour': 'rScheduleRulesByMinuteOfHour',
  //       '@rschedule/core/rules/BySecondOfMinute': 'rScheduleRulesBySecondOfMinute',
  //       '@rschedule/core/rules/ByMillisecondOfSecond': 'rScheduleRulesByMillisecondOfSecond',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByMonthOfYear',
  //     '@rschedule/core/rules/ByDayOfWeek',
  //     '@rschedule/core/rules/ByHourOfDay',
  //     '@rschedule/core/rules/ByMinuteOfHour',
  //     '@rschedule/core/rules/BySecondOfMinute',
  //     '@rschedule/core/rules/ByMillisecondOfSecond',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/06-by-day-of-week/index.ts',
  //   output: {
  //     file: './build/umd/rules/ByDayOfWeek.js',
  //     name: 'rScheduleRulesByDayOfWeek',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByMonthOfYear': 'rScheduleRulesByMonthOfYear',
  //       '@rschedule/core/rules/ByDayOfMonth': 'rScheduleRulesByDayOfMonth',
  //       '@rschedule/core/rules/ByHourOfDay': 'rScheduleRulesByHourOfDay',
  //       '@rschedule/core/rules/ByMinuteOfHour': 'rScheduleRulesByMinuteOfHour',
  //       '@rschedule/core/rules/BySecondOfMinute': 'rScheduleRulesBySecondOfMinute',
  //       '@rschedule/core/rules/ByMillisecondOfSecond': 'rScheduleRulesByMillisecondOfSecond',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByMonthOfYear',
  //     '@rschedule/core/rules/ByDayOfMonth',
  //     '@rschedule/core/rules/ByHourOfDay',
  //     '@rschedule/core/rules/ByMinuteOfHour',
  //     '@rschedule/core/rules/BySecondOfMinute',
  //     '@rschedule/core/rules/ByMillisecondOfSecond',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/07-by-hour-of-day/index.ts',
  //   output: {
  //     file: './build/umd/rules/ByHourOfDay.js',
  //     name: 'rScheduleRulesByHourOfDay',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByMonthOfYear': 'rScheduleRulesByMonthOfYear',
  //       '@rschedule/core/rules/ByDayOfMonth': 'rScheduleRulesByDayOfMonth',
  //       '@rschedule/core/rules/ByDayOfWeek': 'rScheduleRulesByDayOfWeek',
  //       '@rschedule/core/rules/ByMinuteOfHour': 'rScheduleRulesByMinuteOfHour',
  //       '@rschedule/core/rules/BySecondOfMinute': 'rScheduleRulesBySecondOfMinute',
  //       '@rschedule/core/rules/ByMillisecondOfSecond': 'rScheduleRulesByMillisecondOfSecond',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByMonthOfYear',
  //     '@rschedule/core/rules/ByDayOfMonth',
  //     '@rschedule/core/rules/ByDayOfWeek',
  //     '@rschedule/core/rules/ByMinuteOfHour',
  //     '@rschedule/core/rules/BySecondOfMinute',
  //     '@rschedule/core/rules/ByMillisecondOfSecond',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/08-by-minute-of-hour/index.ts',
  //   output: {
  //     file: './build/umd/rules/ByMinuteOfHour.js',
  //     name: 'rScheduleRulesByMinuteOfHour',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByMonthOfYear': 'rScheduleRulesByMonthOfYear',
  //       '@rschedule/core/rules/ByDayOfMonth': 'rScheduleRulesByDayOfMonth',
  //       '@rschedule/core/rules/ByDayOfWeek': 'rScheduleRulesByDayOfWeek',
  //       '@rschedule/core/rules/ByHourOfDay': 'rScheduleRulesByHourOfDay',
  //       '@rschedule/core/rules/BySecondOfMinute': 'rScheduleRulesBySecondOfMinute',
  //       '@rschedule/core/rules/ByMillisecondOfSecond': 'rScheduleRulesByMillisecondOfSecond',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByMonthOfYear',
  //     '@rschedule/core/rules/ByDayOfMonth',
  //     '@rschedule/core/rules/ByDayOfWeek',
  //     '@rschedule/core/rules/ByHourOfDay',
  //     '@rschedule/core/rules/BySecondOfMinute',
  //     '@rschedule/core/rules/ByMillisecondOfSecond',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/09-by-second-of-minute/index.ts',
  //   output: {
  //     file: './build/umd/rules/BySecondOfMinute.js',
  //     name: 'rScheduleRulesBySecondOfMinute',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByMonthOfYear': 'rScheduleRulesByMonthOfYear',
  //       '@rschedule/core/rules/ByDayOfMonth': 'rScheduleRulesByDayOfMonth',
  //       '@rschedule/core/rules/ByDayOfWeek': 'rScheduleRulesByDayOfWeek',
  //       '@rschedule/core/rules/ByHourOfDay': 'rScheduleRulesByHourOfDay',
  //       '@rschedule/core/rules/ByMinuteOfHour': 'rScheduleRulesByMinuteOfHour',
  //       '@rschedule/core/rules/ByMillisecondOfSecond': 'rScheduleRulesByMillisecondOfSecond',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByMonthOfYear',
  //     '@rschedule/core/rules/ByDayOfMonth',
  //     '@rschedule/core/rules/ByDayOfWeek',
  //     '@rschedule/core/rules/ByHourOfDay',
  //     '@rschedule/core/rules/ByMinuteOfHour',
  //     '@rschedule/core/rules/ByMillisecondOfSecond',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/10-by-millisecond-of-second/index.ts',
  //   output: {
  //     file: './build/umd/rules/ByMillisecondOfSecond.js',
  //     name: 'rScheduleRulesByMillisecondOfSecond',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByMonthOfYear': 'rScheduleRulesByMonthOfYear',
  //       '@rschedule/core/rules/ByDayOfMonth': 'rScheduleRulesByDayOfMonth',
  //       '@rschedule/core/rules/ByDayOfWeek': 'rScheduleRulesByDayOfWeek',
  //       '@rschedule/core/rules/ByHourOfDay': 'rScheduleRulesByHourOfDay',
  //       '@rschedule/core/rules/ByMinuteOfHour': 'rScheduleRulesByMinuteOfHour',
  //       '@rschedule/core/rules/BySecondOfMinute': 'rScheduleRulesBySecondOfMinute',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByMonthOfYear',
  //     '@rschedule/core/rules/ByDayOfMonth',
  //     '@rschedule/core/rules/ByDayOfWeek',
  //     '@rschedule/core/rules/ByHourOfDay',
  //     '@rschedule/core/rules/ByMinuteOfHour',
  //     '@rschedule/core/rules/BySecondOfMinute',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
  // {
  //   input: './rules/ical-rules/index.ts',
  //   output: {
  //     file: './build/umd/rules/ICalRules.js',
  //     name: 'rScheduleRulesICalRules',
  //     format: 'umd',
  //     globals: {
  //       '@rschedule/core': 'rSchedule',
  //       '@rschedule/core/rules/Frequency': 'rScheduleRulesFrequency',
  //       '@rschedule/core/rules/ByMonthOfYear': 'rScheduleRulesByMonthOfYear',
  //       '@rschedule/core/rules/ByDayOfMonth': 'rScheduleRulesByDayOfMonth',
  //       '@rschedule/core/rules/ByDayOfWeek': 'rScheduleRulesByDayOfWeek',
  //       '@rschedule/core/rules/ByHourOfDay': 'rScheduleRulesByHourOfDay',
  //       '@rschedule/core/rules/ByMinuteOfHour': 'rScheduleRulesByMinuteOfHour',
  //       '@rschedule/core/rules/BySecondOfMinute': 'rScheduleRulesBySecondOfMinute',
  //       '@rschedule/core/rules/ByMillisecondOfSecond': 'rScheduleRulesByMillisecondOfSecond',
  //     },
  //   },
  //   external: [
  //     '@rschedule/core',
  //     '@rschedule/core/rules/Frequency',
  //     '@rschedule/core/rules/ByMonthOfYear',
  //     '@rschedule/core/rules/ByDayOfMonth',
  //     '@rschedule/core/rules/ByDayOfWeek',
  //     '@rschedule/core/rules/ByHourOfDay',
  //     '@rschedule/core/rules/ByMinuteOfHour',
  //     '@rschedule/core/rules/BySecondOfMinute',
  //     '@rschedule/core/rules/ByMillisecondOfSecond',
  //   ],
  //   plugins: [
  //   typescript({
  //     tsconfig: './tsconfig.umd.json',
  //   }),
  // ],
  // },
];

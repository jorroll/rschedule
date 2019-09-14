// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rSchedule',
      format: 'esm',
    },
    external: [],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/generators/index.ts',
    output: {
      file: './build/es2015/generators.js',
      name: 'rScheduleGenerators',
      format: 'esm',
    },
    external: ['@rschedule/core'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/rules/public_api.ts',
    output: {
      file: './build/es2015/rules.js',
      name: 'rScheduleRules',
      format: 'esm',
    },
    external: ['@rschedule/core'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  // {
  //   input: './rules/01-frequency/index.ts',
  //   output: {
  //     file: './build/es2015/rules/Frequency.js',
  //     name: 'rScheduleRulesFrequency',
  //     format: 'esm',
  //   },
  //   external: ['@rschedule/core'],
  //   plugins: [
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/02-by-month-of-year/index.ts',
  //   output: {
  //     file: './build/es2015/rules/ByMonthOfYear.js',
  //     name: 'rScheduleRulesByMonthOfYear',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/05-by-day-of-month/index.ts',
  //   output: {
  //     file: './build/es2015/rules/ByDayOfMonth.js',
  //     name: 'rScheduleRulesByDayOfMonth',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/06-by-day-of-week/index.ts',
  //   output: {
  //     file: './build/es2015/rules/ByDayOfWeek.js',
  //     name: 'rScheduleRulesByDayOfWeek',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/07-by-hour-of-day/index.ts',
  //   output: {
  //     file: './build/es2015/rules/ByHourOfDay.js',
  //     name: 'rScheduleRulesByHourOfDay',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/08-by-minute-of-hour/index.ts',
  //   output: {
  //     file: './build/es2015/rules/ByMinuteOfHour.js',
  //     name: 'rScheduleRulesByMinuteOfHour',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/09-by-second-of-minute/index.ts',
  //   output: {
  //     file: './build/es2015/rules/BySecondOfMinute.js',
  //     name: 'rScheduleRulesBySecondOfMinute',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/10-by-millisecond-of-second/index.ts',
  //   output: {
  //     file: './build/es2015/rules/ByMillisecondOfSecond.js',
  //     name: 'rScheduleRulesByMillisecondOfSecond',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
  // {
  //   input: './rules/ical-rules/index.ts',
  //   output: {
  //     file: './build/es2015/rules/ICalRules.js',
  //     name: 'rScheduleRulesICalRules',
  //     format: 'esm',
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
  //     typescript({
  //       tsconfig: './tsconfig.module.json',
  //     }),
  //   ],
  // },
];

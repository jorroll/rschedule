// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rScheduleJSONTools',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/AddOperator/index.ts',
    output: {
      file: './build/es2015/AddOperator.js',
      name: 'rScheduleJSONToolsAddOperator',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/Calendar/index.ts',
    output: {
      file: './build/es2015/Calendar.js',
      name: 'rScheduleJSONToolsCalendar',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/Dates/index.ts',
    output: {
      file: './build/es2015/Dates.js',
      name: 'rScheduleJSONToolsDates',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/IntersectionOperator/index.ts',
    output: {
      file: './build/es2015/IntersectionOperator.js',
      name: 'rScheduleJSONToolsIntersectionOperator',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/MergeDurationOperator/index.ts',
    output: {
      file: './build/es2015/MergeDurationOperator.js',
      name: 'rScheduleJSONToolsMergeDurationOperator',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/Rule/index.ts',
    output: {
      file: './build/es2015/Rule.js',
      name: 'rScheduleJSONToolsRule',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/Schedule/index.ts',
    output: {
      file: './build/es2015/Schedule.js',
      name: 'rScheduleJSONToolsSchedule',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/SubtractOperator/index.ts',
    output: {
      file: './build/es2015/SubtractOperator.js',
      name: 'rScheduleJSONToolsSubtractOperator',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/UniqueOperator/index.ts',
    output: {
      file: './build/es2015/UniqueOperator.js',
      name: 'rScheduleJSONToolsUniqueOperator',
      format: 'esm',
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/setup/index.ts',
    output: {
      file: './build/es2015/setup.js',
      name: 'rScheduleJSONToolsSetup',
      format: 'esm',
    },
    external: [
      '@rschedule/json-tools',
      '@rschedule/json-tools/Calendar',
      '@rschedule/json-tools/Dates',
      '@rschedule/json-tools/Rule',
      '@rschedule/json-tools/Schedule',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

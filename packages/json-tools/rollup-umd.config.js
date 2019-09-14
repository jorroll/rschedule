// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/umd/main.js',
      name: 'rScheduleJSONTools',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators'],
    plugins: [typescript()],
  },
  {
    input: './src/AddOperator/index.ts',
    output: {
      file: './build/umd/AddOperator.js',
      name: 'rScheduleJSONToolsAddOperator',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/Calendar/index.ts',
    output: {
      file: './build/umd/Calendar.js',
      name: 'rScheduleJSONToolsCalendar',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/Dates/index.ts',
    output: {
      file: './build/umd/Dates.js',
      name: 'rScheduleJSONToolsDates',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/IntersectionOperator/index.ts',
    output: {
      file: './build/umd/IntersectionOperator.js',
      name: 'rScheduleJSONToolsIntersectionOperator',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/MergeDurationOperator/index.ts',
    output: {
      file: './build/umd/MergeDurationOperator.js',
      name: 'rScheduleJSONToolsMergeDurationOperator',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/Rule/index.ts',
    output: {
      file: './build/umd/Rule.js',
      name: 'rScheduleJSONToolsRule',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/Schedule/index.ts',
    output: {
      file: './build/umd/Schedule.js',
      name: 'rScheduleJSONToolsSchedule',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/SubtractOperator/index.ts',
    output: {
      file: './build/umd/SubtractOperator.js',
      name: 'rScheduleJSONToolsSubtractOperator',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/UniqueOperator/index.ts',
    output: {
      file: './build/umd/UniqueOperator.js',
      name: 'rScheduleJSONToolsUniqueOperator',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/json-tools': 'rScheduleJSONTools',
      },
    },
    external: ['@rschedule/core', '@rschedule/core/generators', '@rschedule/json-tools'],
    plugins: [typescript()],
  },
  {
    input: './src/setup/index.ts',
    output: {
      file: './build/umd/setup.js',
      name: 'rScheduleJSONToolsSetup',
      format: 'umd',
      globals: {
        '@rschedule/json-tools': 'rScheduleJSONTools',
        '@rschedule/json-tools/Calendar': 'rScheduleJSONToolsCalendar',
        '@rschedule/json-tools/Dates': 'rScheduleJSONToolsDates',
        '@rschedule/json-tools/Rule': 'rScheduleJSONToolsRule',
        '@rschedule/json-tools/Schedule': 'rScheduleJSONToolsSchedule',
      },
    },
    external: [
      '@rschedule/json-tools',
      '@rschedule/json-tools/Calendar',
      '@rschedule/json-tools/Dates',
      '@rschedule/json-tools/Rule',
      '@rschedule/json-tools/Schedule',
    ],
    plugins: [typescript()],
  },
];

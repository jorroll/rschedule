// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rScheduleMomentDateAdapter',
      format: 'esm',
    },
    external: ['@rschedule/core', 'moment'],
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
      name: 'rScheduleMomentDateAdapterSetup',
      format: 'esm',
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/moment-date-adapter',
      'moment',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
  {
    input: './src/index.ts',
    output: {
      file: './build/umd/main.js',
      name: 'rScheduleMomentDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        moment: 'moment',
      },
    },
    external: ['@rschedule/core', 'moment'],
    plugins: [typescript()],
  },
  {
    input: './src/setup/index.ts',
    output: {
      file: './build/umd/setup.js',
      name: 'rScheduleMomentDateAdapterSetup',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/core/rules/ICAL_RULES': 'rScheduleRules',
        '@rschedule/moment-date-adapter': 'rScheduleMomentDateAdapter',
        moment: 'moment',
      },
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/moment-date-adapter',
      'moment',
    ],
    plugins: [typescript()],
  },
];

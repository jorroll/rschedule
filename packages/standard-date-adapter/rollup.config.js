// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rScheduleStandardDateAdapter',
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
    input: './src/setup/index.ts',
    output: {
      file: './build/es2015/setup.js',
      name: 'rScheduleStandardDateAdapterSetup',
      format: 'esm',
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/standard-date-adapter',
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
      name: 'rScheduleStandardDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
      },
    },
    external: ['@rschedule/core'],
    plugins: [typescript()],
  },
  {
    input: './src/setup/index.ts',
    output: {
      file: './build/umd/setup.js',
      name: 'rScheduleStandardDateAdapterSetup',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/core/rules/ICAL_RULES': 'rScheduleRules',
        '@rschedule/standard-date-adapter': 'rScheduleStandardDateAdapter',
      },
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/standard-date-adapter',
    ],
    plugins: [typescript()],
  },
];

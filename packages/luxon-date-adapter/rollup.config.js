// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'esm',
    },
    external: ['@rschedule/core', 'luxon'],
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
      name: 'rScheduleLuxonDateAdapterSetup',
      format: 'esm',
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/luxon-date-adapter',
      'luxon',
    ],
    plugins: [typescript()],
  },
  {
    input: './src/index.ts',
    output: {
      file: './build/umd/main.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        luxon: 'luxon',
      },
    },
    external: ['@rschedule/core', , 'luxon'],
    plugins: [typescript()],
  },
  {
    input: './src/setup/index.ts',
    output: {
      file: './build/umd/setup.js',
      name: 'rScheduleLuxonDateAdapterSetup',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/core/rules/ICAL_RULES': 'rScheduleRules',
        '@rschedule/luxon-date-adapter': 'rScheduleLuxonDateAdapter',
        luxon: 'luxon',
      },
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/luxon-date-adapter',
      'luxon',
    ],
    plugins: [typescript()],
  },
];

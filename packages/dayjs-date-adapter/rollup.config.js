// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rScheduleDayjsDateAdapter',
      format: 'esm',
    },
    external: ['@rschedule/core', 'dayjs'],
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
      name: 'rScheduleDayjsDateAdapterSetup',
      format: 'esm',
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/dayjs-date-adapter',
      'dayjs',
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
      name: 'rScheduleDayjsDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        dayjs: 'dayjs',
      },
    },
    external: ['@rschedule/core', 'dayjs'],
    plugins: [typescript()],
  },
  {
    input: './src/setup/index.ts',
    output: {
      file: './build/umd/setup.js',
      name: 'rScheduleDayjsDateAdapterSetup',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/core/rules/ICAL_RULES': 'rScheduleRules',
        '@rschedule/dayjs-date-adapter': 'rScheduleDayjsDateAdapter',
        dayjs: 'dayjs',
      },
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/dayjs-date-adapter',
      'dayjs',
    ],
    plugins: [typescript()],
  },
];

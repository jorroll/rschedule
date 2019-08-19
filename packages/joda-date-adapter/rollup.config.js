// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './index.ts',
    output: {
      file: './build/main.js',
      name: 'rScheduleJodaDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        '@js-joda/core': 'JSJoda',
      },
    },
    external: ['@rschedule/rschedule', '@js-joda/core'],
    plugins: [typescript()],
  },
  {
    input: './index.ts',
    output: {
      file: './build/module.js',
      name: 'rScheduleJodaDateAdapter',
      format: 'esm',
    },
    external: ['@rschedule/rschedule', '@js-joda/core'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

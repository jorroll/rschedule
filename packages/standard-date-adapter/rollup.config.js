// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './index.ts',
    output: {
      file: './build/main.js',
      name: 'rScheduleStandardDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
      },
    },
    external: ['@rschedule/rschedule'],
    plugins: [typescript()],
  },
  {
    input: './index.ts',
    output: {
      file: './build/module.js',
      name: 'rScheduleStandardDateAdapter',
      format: 'esm',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
      },
    },
    external: ['@rschedule/rschedule'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

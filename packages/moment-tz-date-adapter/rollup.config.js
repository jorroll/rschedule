// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './index.ts',
    output: {
      file: './build/main.js',
      name: 'rScheduleMomentTZDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        'moment-timezone': 'moment',
      },
    },
    external: ['@rschedule/rschedule', 'moment-timezone'],
    plugins: [typescript()],
  },
  {
    input: './index.ts',
    output: {
      file: './build/module.js',
      name: 'rScheduleMomentTZDateAdapter',
      format: 'esm',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        'moment-timezone': 'moment',
      },
    },
    external: ['@rschedule/rschedule', 'moment-timezone'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

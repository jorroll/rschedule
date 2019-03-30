// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './index.ts',
    output: {
      file: './build/main.js',
      name: 'rScheduleMomentDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        moment: 'moment',
      },
    },
    external: ['@rschedule/rschedule', 'moment'],
    plugins: [typescript()],
  },
  {
    input: './index.ts',
    output: {
      file: './build/module.js',
      name: 'rScheduleMomentDateAdapter',
      format: 'esm',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        moment: 'moment',
      },
    },
    external: ['@rschedule/rschedule', 'moment'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

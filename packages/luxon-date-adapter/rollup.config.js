// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './index.ts',
    output: {
      file: './build/main.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        luxon: 'luxon',
      },
    },
    external: ['@rschedule/rschedule', 'luxon'],
    plugins: [typescript()],
  },
  {
    input: './index.ts',
    output: {
      file: './build/module.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'esm',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        luxon: 'luxon',
      },
    },
    external: ['@rschedule/rschedule', 'luxon'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './index.ts',
    output: {
      file: './build/main.js',
      name: 'rScheduleICalTools',
      format: 'umd',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        'lodash.clonedeep': 'cloneDeep',
        'ical.js': 'ICAL',
      },
    },
    external: ['@rschedule/rschedule', 'ical.js', 'lodash.clonedeep'],
    plugins: [typescript()],
  },
  {
    input: './index.ts',
    output: {
      file: './build/module.js',
      name: 'rScheduleICalTools',
      format: 'esm',
      globals: {
        '@rschedule/rschedule': 'rSchedule',
        'lodash.clonedeep': 'cloneDeep',
        'ical.js': 'ICAL',
      },
    },
    external: ['@rschedule/rschedule', 'ical.js', 'lodash.clonedeep'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rScheduleRecurrenceRulesResolver',
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
    input: './src/index.ts',
    output: {
      file: './build/umd/main.js',
      name: 'rScheduleRecurrenceRulesResolver',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
      },
    },
    external: ['@rschedule/core'],
    plugins: [typescript()],
  },
];

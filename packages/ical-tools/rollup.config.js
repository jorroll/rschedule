// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './build/es2015/main.js',
      name: 'rScheduleICalTools',
      format: 'esm',
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/core/generators',
      'ical.js',
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
      name: 'rScheduleICalTools',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/rules/ICAL_RULES': 'rScheduleRules',
        '@rschedule/core/generators': 'rScheduleGenerators',
        'ical.js': 'ICAL',
      },
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/core/generators',
      'ical.js',
    ],
    plugins: [typescript()],
  },
];

// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import * as fs from 'fs';

const rootTSConfig = JSON.parse(fs.readFileSync('../../tsconfig.json', { encoding: 'utf8' }));

const v2Override = {
  compilerOptions: {
    paths: { ...rootTSConfig.compilerOptions.paths, luxon: ['node_modules/@types/luxon-v2'] },
  },
};

export default [
  {
    input: './src/v1/index.ts',
    output: {
      file: './build/es2015/v1-main.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'esm',
    },
    external: ['@rschedule/core', 'luxon'],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v1.module.json',
      }),
    ],
  },
  {
    input: './src/v1/setup/index.ts',
    output: {
      file: './build/es2015/v1-setup.js',
      name: 'rScheduleLuxonDateAdapterSetup',
      format: 'esm',
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/luxon-date-adapter/v1',
      'luxon',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v1.module.json',
      }),
    ],
  },
  {
    input: './src/v2/index.ts',
    output: {
      file: './build/es2015/v2-main.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'esm',
    },
    external: ['@rschedule/core', 'luxon'],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v2.module.json',
        tsconfigOverride: v2Override,
      }),
    ],
  },
  {
    input: './src/v2/setup/index.ts',
    output: {
      file: './build/es2015/v2-setup.js',
      name: 'rScheduleLuxonDateAdapterSetup',
      format: 'esm',
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/luxon-date-adapter/v2',
      'luxon',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v2.module.json',
        tsconfigOverride: v2Override,
      }),
    ],
  },
  {
    input: './src/v1/index.ts',
    output: {
      file: './build/umd/v1-main.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        luxon: 'luxon',
      },
    },
    external: ['@rschedule/core', , 'luxon'],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v1.json',
      }),
    ],
  },
  {
    input: './src/v1/setup/index.ts',
    output: {
      file: './build/umd/v1-setup.js',
      name: 'rScheduleLuxonDateAdapterSetup',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/core/rules/ICAL_RULES': 'rScheduleRules',
        '@rschedule/luxon-date-adapter/v1': 'rScheduleLuxonDateAdapter',
        luxon: 'luxon',
      },
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/luxon-date-adapter/v1',
      'luxon',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v1.json',
      }),
    ],
  },
  {
    input: './src/v2/index.ts',
    output: {
      file: './build/umd/v2-main.js',
      name: 'rScheduleLuxonDateAdapter',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        luxon: 'luxon',
      },
    },
    external: ['@rschedule/core', , 'luxon-v2'],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v2.json',
        tsconfigOverride: v2Override,
      }),
    ],
  },
  {
    input: './src/v2/setup/index.ts',
    output: {
      file: './build/umd/v2-setup.js',
      name: 'rScheduleLuxonDateAdapterSetup',
      format: 'umd',
      globals: {
        '@rschedule/core': 'rSchedule',
        '@rschedule/core/generators': 'rScheduleGenerators',
        '@rschedule/core/rules/ICAL_RULES': 'rScheduleRules',
        '@rschedule/luxon-date-adapter/v2': 'rScheduleLuxonDateAdapter',
        luxon: 'luxon',
      },
    },
    external: [
      '@rschedule/core',
      '@rschedule/core/generators',
      '@rschedule/core/rules/ICAL_RULES',
      '@rschedule/luxon-date-adapter/v2',
      'luxon',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig-v2.json',
        tsconfigOverride: v2Override,
      }),
    ],
  },
];

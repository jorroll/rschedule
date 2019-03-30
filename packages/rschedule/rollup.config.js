// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './index.ts',
    output: {
      file: './build/main.js',
      name: 'rSchedule',
      format: 'umd',
    },
    plugins: [typescript()],
  },
  {
    input: './index.ts',
    output: {
      file: './build/module.js',
      name: 'rSchedule',
      format: 'esm',
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.module.json',
      }),
    ],
  },
];

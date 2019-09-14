import { build } from '@local-tasks/utils';

console.log('building packages/core');

build({
  declarationPath: './build/es2015/packages/core/src',
  rollupCommands: ['yarn rollup -c rollup-esm.config.js', 'yarn rollup -c rollup-umd.config.js'],
}).catch(e => {
  console.error(e);
  process.exit(1);
});

import { build } from '@local-tasks/utils';

console.log('building packages/json-tools');

build({
  rollupCommands: ['yarn rollup -c rollup-esm.config.js', 'yarn rollup -c rollup-umd.config.js'],
  declarationPath: './build/es2015/packages/json-tools/src',
}).catch(e => {
  console.error(e);
  process.exit(1);
});

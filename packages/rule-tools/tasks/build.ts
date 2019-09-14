import { build } from '@local-tasks/utils';

console.log('building packages/rule-tools');

build({
  rollupCommands: ['yarn rollup -c'],
  declarationPath: './build/es2015/packages/rule-tools/src',
}).catch(e => {
  console.error(e);
  process.exit(1);
});

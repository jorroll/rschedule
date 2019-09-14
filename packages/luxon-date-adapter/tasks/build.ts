import { build } from '@local-tasks/utils';

console.log('building packages/luxon-date-adapter');

build({
  rollupCommands: ['yarn rollup -c'],
  declarationPath: './build/es2015/packages/luxon-date-adapter/src',
}).catch(e => {
  console.error(e);
  process.exit(1);
});

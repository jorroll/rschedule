import { build } from '@local-tasks/utils';

console.log('building packages/dayjs-date-adapter');

build({
  rollupCommands: ['yarn rollup -c'],
  declarationPath: './build/es2015/packages/dayjs-date-adapter/src',
}).catch(e => {
  console.error(e);
  process.exit(1);
});

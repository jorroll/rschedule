import { build } from '@local-tasks/utils';

console.log('building packages/moment-tz-date-adapter');

build({
  rollupCommands: ['yarn rollup -c'],
  declarationPath: './build/es2015/packages/moment-tz-date-adapter/src',
}).catch(e => {
  console.error(e);
  process.exit(1);
});

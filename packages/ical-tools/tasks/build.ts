import { build } from '@local-tasks/utils';

console.log('building packages/ical-tools');

build({
  rollupCommands: ['yarn rollup -c'],
  declarationPath: './build/es2015/packages/ical-tools/src',
}).catch(e => {
  console.error(e);
  process.exit(1);
});

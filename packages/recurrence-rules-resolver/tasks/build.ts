import { build } from '@local-tasks/utils';

console.log('building packages/recurrence-rules-resolver');

build({
  rollupCommands: ['yarn rollup -c'],
  declarationPath: './build/es2015/packages/recurrence-rules-resolver/src',
}).catch(e => {
  console.error(e);
  process.exit(1);
});

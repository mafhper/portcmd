import { spawnSync } from 'child_process';
import { Logger } from './utils/logger.js';

Logger.info('Starting System Health Check...');

const run = (cmd, args, name) => {
  Logger.info(`Running ${name}...`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    Logger.error(`${name} failed.`);
    process.exit(1);
  }
  Logger.success(`${name} passed.`);
};

run('npm', ['run', 'test:structure'], 'Structure Check');
run('npm', ['run', 'lint'], 'Linter');
run('npm', ['run', 'test:i18n'], 'Translation Consistency');

Logger.divider();
Logger.success('ALL HEALTH CHECKS PASSED. SYSTEM READY.');
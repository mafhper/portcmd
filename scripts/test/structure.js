import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { paths } from '../utils/paths.js';

const REQUIRED_PATHS = [
  'src/components',
  'src/services',
  'src/contexts',
  'website/src',
  'scripts',
  'metadata.json',
  'vite.config.ts',
];

Logger.info('Verifying project structure...');

let hasErrors = false;

REQUIRED_PATHS.forEach((p) => {
  const fullPath = path.join(paths.root, p);
  if (!fs.existsSync(fullPath)) {
    Logger.error(`Missing required path: ${p}`);
    hasErrors = true;
  }
});

if (hasErrors) {
  Logger.error('Project structure verification failed.');
  process.exit(1);
} else {
  Logger.success('Project structure verified.');
  process.exit(0);
}
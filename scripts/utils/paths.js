import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../');

export const paths = {
  root: rootDir,
  src: path.join(rootDir, 'src'),
  dist: path.join(rootDir, 'dist'),
  website: path.join(rootDir, 'website'),
  public: path.join(rootDir, 'public'),
  scripts: path.join(rootDir, 'scripts'),
  reports: path.join(rootDir, 'performance-reports'),
};
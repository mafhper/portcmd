import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { paths } from '../utils/paths.js';

Logger.info('Validating translation keys...');

const localesDir = path.join(paths.src, 'locales');

if (!fs.existsSync(localesDir)) {
  Logger.error('locales directory not found!');
  process.exit(1);
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
  } catch (e) {
    Logger.error(`Failed to parse ${file}: ${e.message}`);
    return null;
  }
};

const enData = readJson('en.json');
const ptData = readJson('pt-BR.json');
const esData = readJson('es.json');

if (!enData || !ptData || !esData) process.exit(1);

const extractKeys = (obj, prefix = '') => {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(extractKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys.sort();
};

const enKeys = extractKeys(enData);
const ptKeys = extractKeys(ptData);
const esKeys = extractKeys(esData);

const compare = (base, target, langName) => {
  const missing = base.filter((k) => !target.includes(k));
  if (missing.length > 0) {
    Logger.error(`Missing keys in ${langName}: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

let success = true;
success = compare(enKeys, ptKeys, 'pt-BR') && success;
success = compare(enKeys, esKeys, 'es') && success;

if (success) {
  Logger.success('All translation keys match base language (en).');
  process.exit(0);
} else {
  process.exit(1);
}
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { paths } from '../utils/paths.js';

Logger.info('Validating translation keys...');

const localesPath = path.join(paths.src, 'locales.ts');

if (!fs.existsSync(localesPath)) {
  Logger.error('locales.ts not found!');
  process.exit(1);
}

const content = fs.readFileSync(localesPath, 'utf-8');

const extractKeys = (lang) => {
  const regex = new RegExp(`${lang}:\\s*{([^}]+)}`, 's');
  const match = content.match(regex);
  if (!match) return [];
  const block = match[1];
  const keys = [];
  const keyRegex = /([a-zA-Z0-9_]+):/g;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(block)) !== null) {
    keys.push(keyMatch[1]);
  }
  return keys.sort();
};

const enKeys = extractKeys('en');
const ptKeys = extractKeys('pt-BR');
const esKeys = extractKeys('es');

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
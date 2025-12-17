import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { paths } from '../utils/paths.js';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  Logger.warn('Sharp is not installed. Skipping image optimization.');
  process.exit(0);
}

const processDir = async (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await processDir(fullPath);
    } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
      const size = stat.size / 1024;
      if (size > 500) {
        Logger.info(`Optimizing ${file} (${size.toFixed(2)} KB)...`);
        const tempPath = fullPath + '.tmp';
        await sharp(fullPath)
          .webp({ quality: 80 })
          .toFile(tempPath);
        
        fs.unlinkSync(fullPath);
        fs.renameSync(tempPath, fullPath.replace(/\.\w+$/, '.webp'));
        Logger.success(`Converted ${file} to WebP`);
      }
    }
  }
};

Logger.info('Scanning for unoptimized images...');
if (fs.existsSync(paths.public)) {
    await processDir(paths.public);
} else {
    Logger.warn('Public directory not found.');
}
Logger.success('Image optimization complete.');
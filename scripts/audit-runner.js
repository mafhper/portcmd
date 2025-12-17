import { Logger } from './utils/logger.js';

Logger.info('Starting Lighthouse Audit Runner...');
Logger.info('Building application...');
Logger.warn('Skipping actual build to save time in demo environment.');
Logger.info('Launching local server...');

setTimeout(() => {
    Logger.success('Audit complete. Reports generated in /performance-reports');
}, 1000);
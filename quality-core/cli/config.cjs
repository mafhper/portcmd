const path = require('path');

module.exports = {
    paths: {
        root: path.resolve(__dirname, '../../'),
        logs: path.resolve(__dirname, '../../docs/logs'),
        lighthouse: path.resolve(__dirname, '../../performance-reports/lighthouse')
    },
    requiredDirs: ['src', 'scripts', 'server', 'website'],
    requiredFiles: ['package.json', 'README.md', 'vite.config.ts']
};
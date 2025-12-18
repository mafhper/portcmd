const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

module.exports = {
    name: 'bundle-size',

    async run(ctx) {
        const distDir = ctx.distDir;
        if (!fs.existsSync(distDir)) {
            return { status: 'skip', msg: 'No dist directory found' };
        }

        const files = getAllFiles(distDir).filter(f => f.endsWith('.js'));
        const totalBytes = files.reduce((acc, file) => acc + fs.statSync(file).size, 0);
        const totalKb = totalBytes / 1024;

        // Default limit 500KB or from context
        const limitKb = ctx.thresholds?.bundleKb || 500;

        return {
            status: totalKb > limitKb ? 'fail' : 'ok',
            data: {
                totalKb: Math.round(totalKb),
                limitKb,
                fileCount: files.length
            }
        };
    }
};

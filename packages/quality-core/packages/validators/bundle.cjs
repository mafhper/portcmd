const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'bundle-size',

    async run(ctx) {
        const dir = ctx.distDir || path.resolve('dist');
        if (!dir || !fs.existsSync(dir)) {
            return { status: 'skip', data: { message: 'Dist directory not found' } };
        }

        const getAllFiles = (dir) => {
            let results = [];
            const list = fs.readdirSync(dir);
            list.forEach((file) => {
                file = path.join(dir, file);
                const stat = fs.statSync(file);
                if (stat && stat.isDirectory()) {
                    results = results.concat(getAllFiles(file));
                } else if (file.endsWith('.js')) {
                    results.push(file);
                }
            });
            return results;
        };

        const files = getAllFiles(dir);
        if (files.length === 0) {
            return { status: 'skip', data: { message: 'No JS files found in dist' } };
        }

        const totalKb = files.reduce(
            (s, f) => s + fs.statSync(f).size,
            0
        ) / 1024;

        const limit = ctx.thresholds?.bundleKb || 2000; // 2MB default limit

        const passed = totalKb <= limit;
        return {
            status: passed ? 'ok' : 'fail',
            score: passed ? 100 : Math.max(0, 100 - Math.round((totalKb - limit) / 10)), // Deduct score for failing size
            raw: { totalKb: Math.round(totalKb), limit }
        };
    }
};

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.resolve(__dirname, '../../../performance-reports/lighthouse');
const targets = ['app', 'promo'];
const factors = ['mobile', 'desktop'];

function getRecentReports(target, factor, count = 4) {
    const prefix = `lighthouse_${target}_${factor}_`;
    const files = fs.readdirSync(REPORT_DIR)
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, count);

    return files.map(file => {
        const filePath = path.join(REPORT_DIR, file);
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const date = file.replace(prefix, '').replace('.json', '').replace('T', ' ').substring(0, 16);

            // Extract scores
            const scores = {};
            if (content.categories) {
                Object.keys(content.categories).forEach(cat => {
                    scores[cat] = Math.round((content.categories[cat].score || 0) * 100);
                });
            }

            return { date, scores, file };
        } catch (e) {
            return null;
        }
    }).filter(Boolean);
}

function printComparison() {
    console.log('\n📊 Comparação de Performance (Últimas 4 execuções)\n');

    targets.forEach(target => {
        factors.forEach(factor => {
            const reports = getRecentReports(target, factor);
            if (reports.length === 0) return;

            console.log(`### ${target.toUpperCase()} [${factor.toUpperCase()}]`);
            console.log('| Data | Perf | A11y | BP | SEO |');
            console.log('|------|------|------|----|-----|');

            reports.forEach(r => {
                const s = r.scores;
                const date = r.date;
                console.log(`| ${date} | ${s.performance} | ${s.accessibility} | ${s['best-practices']} | ${s.seo} |`);
            });
            console.log('');
        });
    });
}

printComparison();

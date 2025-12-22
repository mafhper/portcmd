const fs = require('fs');
const path = require('path');

const LH_DIR = path.join(process.cwd(), 'performance-reports', 'lighthouse');

async function compare() {
    try {
        const files = await fs.promises.readdir(LH_DIR);
        // Filter json files, sort by time (assuming filename contains timestamp or we allow fs stat)
        // Filenames are like: lighthouse_promo_mobile_2025-12-21T15-51-59.json
        // We probably want to group by target/formFactor to make a fair comparison?
        // The user just said "show me the results compared to the last two".
        // Let's grab the top 6 files (last 3 runs for mobile/desktop or app/promo?)
        // Let's just grab the last 3 files overall and see what they are. 
        // Better: Group by "Target-FormFactor" and show last 3 for each.

        const jsonFiles = files.filter(f => f.endsWith('.json'));

        const reports = [];
        for (const f of jsonFiles) {
            const stat = await fs.promises.stat(path.join(LH_DIR, f));
            reports.push({ file: f, mtime: stat.mtimeMs, path: path.join(LH_DIR, f) });
        }

        reports.sort((a, b) => b.mtime - a.mtime);

        // Grouping
        const groups = {};
        for (const r of reports) {
            const content = await fs.promises.readFile(r.path, 'utf-8');
            const json = JSON.parse(content);
            const lhResult = json.lighthouseResult || json.data?.lighthouseResult || json; // Handle wrapped/unwrapped
            const meta = json.metadata || {};

            // Try to identify group
            let target = meta.target || 'unknown';
            let formFactor = meta.formFactor || 'unknown';

            if (target === 'unknown') {
                if (r.file.includes('promo')) target = 'promo';
                else if (r.file.includes('app')) target = 'app';
            }
            if (formFactor === 'unknown') {
                if (r.file.includes('mobile')) formFactor = 'mobile';
                else if (r.file.includes('desktop')) formFactor = 'desktop';
            }

            const key = `${target} (${formFactor})`;
            if (!groups[key]) groups[key] = [];

            const cats = lhResult.categories || {};
            groups[key].push({
                timestamp: new Date(r.mtime).toLocaleString(),
                file: r.file,
                scores: {
                    perf: Math.round((cats.performance?.score || 0) * 100),
                    a11y: Math.round((cats.accessibility?.score || 0) * 100),
                    bp: Math.round((cats['best-practices']?.score || 0) * 100),
                    seo: Math.round((cats.seo?.score || 0) * 100),
                }
            });
        }

        // Print tables
        for (const [key, list] of Object.entries(groups)) {
            console.log(`\n--- ${key} ---`);
            const recent = list.slice(0, 3);
            if (recent.length === 0) continue;

            console.log('| Timestamp | Perf | A11y | BP | SEO | File |');
            console.log('|---|---|---|---|---|---|');
            recent.forEach(r => {
                console.log(`| ${r.timestamp} | ${r.scores.perf} | ${r.scores.a11y} | ${r.scores.bp} | ${r.scores.seo} | ${r.file} |`);
            });
        }

    } catch (e) {
        console.error("Comparison failed:", e);
    }
}

compare();

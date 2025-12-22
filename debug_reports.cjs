const fs = require('fs');
const path = require('path');

const CONFIG = {
    lighthouseDir: path.join(process.cwd(), 'performance-reports', 'lighthouse'),
    pagespeedDir: path.join(process.cwd(), 'performance-reports', 'pagespeed')
};

async function testParsing() {
    console.log('--- Checking PageSpeed Dir ---');
    try {
        const files = await fs.promises.readdir(CONFIG.pagespeedDir);
        const recentFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 5);

        for (const file of recentFiles) {
            const content = await fs.promises.readFile(path.join(CONFIG.pagespeedDir, file), 'utf-8');
            const json = JSON.parse(content);
            console.log(`\nFile: ${file}`);

            // server.cjs logic for 'pagespeed'
            const psiResult = json.lighthouseResult || {};
            const psiCats = psiResult.categories || {};
            console.log(`[PageSpeed Logic] Scores: P=${psiCats.performance?.score}, A=${psiCats.accessibility?.score}, SEO=${psiCats.seo?.score}`);
            console.log(`[PageSpeed Logic] ID: ${json.id}`);
            console.log(`[PageSpeed Logic] Timestamp: ${json.analysisUTCTimestamp}`);
        }
    } catch (e) { console.error(e.message); }

    console.log('\n--- Checking Lighthouse Dir ---');
    try {
        const files = await fs.promises.readdir(CONFIG.lighthouseDir);
        const recentFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 5);

        for (const file of recentFiles) {
            const content = await fs.promises.readFile(path.join(CONFIG.lighthouseDir, file), 'utf-8');
            const json = JSON.parse(content);
            console.log(`\nFile: ${file}`);

            // server.cjs logic for 'lighthouse'
            const cats = json.categories || {};
            console.log(`[Lighthouse Logic] Scores: P=${cats.performance?.score}, A=${cats.accessibility?.score}, SEO=${cats.seo?.score}`);
            console.log(`[Lighthouse Logic] Metadata: Target=${json.metadata?.target}, FormFactor=${json.metadata?.formFactor}`);
        }
    } catch (e) { console.error(e.message); }
}

testParsing();

const fs = require('fs');
const path = require('path');

const CONFIG = {
    pagespeedDir: path.join(process.cwd(), 'performance-reports', 'lighthouse') // checking lighthouse dir as user had UNKNOWN there in screenshot
};

async function testParsing() {
    const files = await fs.promises.readdir(CONFIG.pagespeedDir);
    const recentFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 5);

    console.log(`Checking ${recentFiles.length} files in ${CONFIG.pagespeedDir}...`);

    for (const file of recentFiles) {
        const content = await fs.promises.readFile(path.join(CONFIG.pagespeedDir, file), 'utf-8');
        const json = JSON.parse(content);

        console.log(`\nFile: ${file}`);

        // server.cjs logic for 'pagespeed' (which seemed to be mapped to lighthouse dir logic? No, wait)
        // server.cjs has separate logic for source=lighthouse and source=pagespeed.
        // User screenshot showed "PageSpeed" view.
        // Dashboard 'loadPageSpeedView' calls source=pagespeed.
        // server.cjs source=pagespeed reads from CONFIG.pagespeedDir.

        // Let's check BOTH lighthouse and pagespeed dirs logic

        // Logic for Lighthouse (source=lighthouse) in server.cjs
        const lhCats = json.categories || {};
        console.log(`[Lighthouse Logic] Scores: P=${lhCats.performance?.score}, A=${lhCats.accessibility?.score}, SEO=${lhCats.seo?.score}`);
        console.log(`[Lighthouse Logic] Metadata: Target=${json.metadata?.target}, FormFactor=${json.metadata?.formFactor}`);

        // Logic for PageSpeed (source=pagespeed) in server.cjs
        // Server.cjs expects: json.lighthouseResult.categories
        const psiResult = json.lighthouseResult || {};
        const psiCats = psiResult.categories || {};
        console.log(`[PageSpeed Logic] Scores: P=${psiCats.performance?.score}, A=${psiCats.accessibility?.score}, SEO=${psiCats.seo?.score}`);
        console.log(`[PageSpeed Logic] ID: ${json.id}`);
    }
}

testParsing();

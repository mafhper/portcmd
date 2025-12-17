#!/usr/bin/env node
/**
 * Quality Core CLI
 */
const fs = require('fs');
const path = require('path');
const { runAudits } = require('../packages/core/runner.cjs');
const DEFAULT_THRESHOLDS = require('../packages/core/thresholds.cjs');

// Import Presets
const GITHUB_PAGES_PRESET = require('../presets/github-pages.json');

// Import Audits
const AVAILABLE_AUDITS = {
    'build': require('../packages/audits/build.cjs'),
    'render': require('../packages/audits/render.cjs'),
    'ux': require('../packages/audits/ux.cjs'),
    'a11y': require('../packages/audits/a11y.cjs'),
    'seo': require('../packages/audits/seo.cjs')
};

async function main() {
    const args = process.argv.slice(2);
    const presetName = args.find(a => a.startsWith('--preset='))?.split('=')[1] || 'github-pages';
    const isQuick = args.includes('--quick');
    const isFailOnError = args.includes('--fail-on-error');

    console.log(`Quality Core CLI v1.0.0`);
    console.log(`Preset: ${presetName}`);

    // Context Setup
    // Ensure we have a URL to test.
    let url = args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:4173';

    // Preset Config
    const preset = presetName === 'github-pages' ? GITHUB_PAGES_PRESET : GITHUB_PAGES_PRESET;

    const context = {
        url: url,
        preset: presetName,
        device: preset.device || 'mobile',
        thresholds: DEFAULT_THRESHOLDS,
        projectRoot: process.cwd(),
        // Point to dist/app for the application audit, or dist for promo?
        // Let's default to dist/app for now as it's the main app.
        distDir: path.join(process.cwd(), 'dist/app') 
    };

    // Select Audits
    const auditsToRun = [];
    if (isQuick) {
        auditsToRun.push(AVAILABLE_AUDITS.build);
    } else {
        auditsToRun.push(AVAILABLE_AUDITS.build);
        auditsToRun.push(AVAILABLE_AUDITS.render); // Requires Playwright
        auditsToRun.push(AVAILABLE_AUDITS.ux);
        auditsToRun.push(AVAILABLE_AUDITS.a11y);
        auditsToRun.push(AVAILABLE_AUDITS.seo);
    }

    const validAudits = auditsToRun.filter(Boolean);

    if (validAudits.length === 0) {
        console.error("No valid audits found to run.");
        process.exit(1);
    }

    // Run Audit
    const result = await runAudits({ audits: validAudits, context });

    // Save Reports
    const reportDir = path.join(process.cwd(), 'performance-reports', 'quality');
    const filename = `quality-${Date.now()}`; 

    const JsonReporter = require('../packages/reporters/json.cjs');
    const jsonPath = JsonReporter.save(result, reportDir, `${filename}.json`);
    console.log(`\n📄 JSON Report: ${jsonPath}`);

    JsonReporter.save(result, reportDir, 'quality-latest.json');

    const MarkdownReporter = require('../packages/reporters/markdown.cjs');
    const mdContent = MarkdownReporter.generate(result);
    const mdPath = path.join(reportDir, `${filename}.md`);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`📄 Markdown Report: ${mdPath}`);

    if (result.status === 'fail') {
        process.exit(isFailOnError ? 1 : 0);
    }
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
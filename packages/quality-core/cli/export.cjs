/**
 * Quality Gate Export - JSON and Markdown report generation
 */
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(process.cwd(), 'performance-reports', 'quality');

function ensureDir() {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function exportJSON(results, meta) {
    ensureDir();
    const file = path.join(REPORTS_DIR, `quality-report-${Date.now()}.json`);
    fs.writeFileSync(
        file,
        JSON.stringify({
            timestamp: new Date().toISOString(),
            status: meta.failed ? 'FAILED' : 'PASSED',
            duration: meta.duration,
            results
        }, null, 2)
    );
    return file;
}

function exportMarkdown(results, meta) {
    ensureDir();
    const file = path.join(REPORTS_DIR, `quality-report-${Date.now()}.md`);

    const lines = [
        `# Quality Gate Report`,
        ``,
        `**Status:** ${meta.failed ? '❌ FAILED' : '✅ PASSED'}`,
        `**Duration:** ${meta.duration}`,
        `**Date:** ${new Date().toLocaleString()}`,
        ``,
        `## Results`,
        ``,
        `| Step | Domain | Status | Time |`,
        `|------|--------|--------|------|`
    ];

    results.forEach(r => {
        lines.push(
            `| ${r.name} | ${r.domain} | ${r.success ? '✅ OK' : '❌ FAIL'} | ${meta.format(r.duration)} |`
        );
    });

    // Summary by domain
    const groups = {};
    for (const r of results) {
        groups[r.domain] ??= { passed: 0, failed: 0, total: 0 };
        groups[r.domain].total++;
        if (r.success) groups[r.domain].passed++;
        else groups[r.domain].failed++;
    }

    lines.push(``, `## Summary by Domain`, ``);
    for (const [domain, stats] of Object.entries(groups)) {
        lines.push(`- **${domain}**: ${stats.passed}/${stats.total} passed`);
    }

    fs.writeFileSync(file, lines.join('\n'));
    return file;
}

module.exports = { exportJSON, exportMarkdown };

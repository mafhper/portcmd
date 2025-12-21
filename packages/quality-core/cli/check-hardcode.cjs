#!/usr/bin/env node
/**
 * i18n Hardcode Checker for Dashboard
 * Scans dashboard HTML for hardcoded text that should be internationalized
 * 
 * Usage: node check-hardcode.cjs [--fix]
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_PATH = path.join(__dirname, '..', 'dashboard', 'public', 'index.html');

// Known patterns that indicate hardcoded text (English words that appear in UI)
const HARDCODE_PATTERNS = [
    // Status messages
    />\s*Excellent\s*</gi,
    />\s*Good\s*</gi,
    />\s*Needs work\s*</gi,
    />\s*Critical\s*</gi,
    />\s*Stable\s*</gi,

    // Health Gate
    />\s*All targets met\s*</gi,
    />\s*Minor issues\s*</gi,
    />\s*Action required\s*</gi,
    />\s*Health Gate\s*</gi,
    />\s*All systems healthy\s*</gi,
    />\s*All metrics within target\s*</gi,

    // Dashboard sections
    />\s*Core Web Vitals\s*</gi,
    />\s*Other Metrics\s*</gi,
    />\s*Performance Trajectory\s*</gi,
    />\s*Issues & Alerts\s*</gi,
    />\s*No critical issues\s*/gi,
    />\s*All systems operating\s*/gi,

    // Common UI text (add more as needed)
    />\s*Project\s*</gi,
    />\s*Loading\.\.\.\s*</gi,
    />\s*No data found\s*</gi,
    />\s*Refresh\s*</gi,
];

// Patterns to EXCLUDE from detection (false positives)
const EXCLUDE_PATTERNS = [
    /t\(['"`]\w+['"]\)/,  // Already using t() function
    /data-i18n=/,          // Already has i18n attribute
    /\/\/.*/,              // Comments
    /<!--.*-->/,           // HTML comments
    /'[^']*Build[^']*'/,   // String in JS (like chart legend)
    /'[^']*Render[^']*'/,  // String in JS
];

// Extract text from HTML elements for analysis
function extractTextContent(content, lineNumber) {
    const issues = [];

    for (const pattern of HARDCODE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
            // Check if it's not an excluded pattern
            const isExcluded = EXCLUDE_PATTERNS.some(ep => ep.test(content));
            if (!isExcluded) {
                issues.push({
                    line: lineNumber,
                    match: matches[0].trim(),
                    content: content.trim().substring(0, 100)
                });
            }
        }
    }

    return issues;
}

function scanFile() {
    if (!fs.existsSync(DASHBOARD_PATH)) {
        console.error(`❌ Dashboard file not found: ${DASHBOARD_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(DASHBOARD_PATH, 'utf8');
    const lines = content.split('\n');

    const allIssues = [];

    lines.forEach((line, index) => {
        const issues = extractTextContent(line, index + 1);
        allIssues.push(...issues);
    });

    return allIssues;
}

function printReport(issues) {
    console.log('\n🔍 i18n Hardcode Checker Report\n');
    console.log('='.repeat(60));

    if (issues.length === 0) {
        console.log('\n✅ No hardcoded text detected!\n');
        console.log('All text appears to be internationalized.');
        return 0;
    }

    console.log(`\n⚠️  Found ${issues.length} potential hardcoded text:`);
    console.log('-'.repeat(60));

    // Group by matched pattern
    const grouped = {};
    issues.forEach(issue => {
        const key = issue.match;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(issue);
    });

    Object.entries(grouped).forEach(([match, items]) => {
        console.log(`\n📝 "${match.replace(/[<>]/g, '')}" (${items.length} occurrences)`);
        items.slice(0, 3).forEach(item => {
            console.log(`   Line ${item.line}: ${item.content.substring(0, 80)}...`);
        });
        if (items.length > 3) {
            console.log(`   ... and ${items.length - 3} more`);
        }
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`\n📋 Suggested translations to add to translations object:`);
    console.log('```javascript');

    const suggestions = new Set();
    Object.keys(grouped).forEach(match => {
        const cleanText = match.replace(/[<>]/g, '').trim();
        const key = cleanText.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/gi, '');
        suggestions.add(`${key}: '${cleanText}'`);
    });

    suggestions.forEach(s => console.log(`  ${s},`));
    console.log('```\n');

    return issues.length;
}

// Main execution
const issues = scanFile();
const count = printReport(issues);

if (count > 0) {
    console.log('💡 To fix: Replace hardcoded text with t(\'key\') function calls');
    console.log('   and add corresponding keys to the translations object.\n');
}

process.exit(count > 0 ? 1 : 0);

#!/usr/bin/env node
/**
 * Quality Core CLI
 * 
 * Runs audits for build, render, ux, a11y, and seo.
 * Automatically starts a static server for browser-based audits.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { runAudits } = require('../packages/core/runner.cjs');
const DEFAULT_THRESHOLDS = require('../packages/core/thresholds.cjs');

// Import Presets
const GITHUB_PAGES_PRESET = require('../presets/github-pages.json');

// Import Audits
const AVAILABLE_AUDITS = {
    // Existing audits (likely in quality-core/packages)
    'build': require('../packages/audits/build.cjs'),
    'render': require('../packages/audits/render.cjs'),
    'ux': require('../packages/audits/ux.cjs'),
    'a11y': require('../packages/audits/a11y.cjs'),
    'seo': require('../packages/audits/seo.cjs'),
    // New Validators (in root packages)
    'contrast': require('../../packages/validators/contrast.cjs'),
    'i18n': require('../../packages/validators/i18n.cjs'),
    'lint': require('../../packages/validators/lint.cjs'),
    'bundle': require('../../packages/validators/bundle.cjs')
};

/**
 * Creates a static file server that correctly serves the dist folder
 * mapping /portcmd/app/* to dist/app/* paths
 */
function createStaticServer(projectRoot, port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            // Remove query string and decode URI
            let urlPath = decodeURIComponent(req.url.split('?')[0]);

            // Map paths correctly for GitHub Pages structure
            // /portcmd/app/* -> dist/app/*
            // /portcmd/* -> dist/*
            let filePath;
            if (urlPath.startsWith('/portcmd/app/')) {
                filePath = path.join(projectRoot, 'dist/app', urlPath.replace('/portcmd/app/', '/'));
            } else if (urlPath.startsWith('/portcmd/')) {
                filePath = path.join(projectRoot, 'dist', urlPath.replace('/portcmd/', '/'));
            } else {
                // Fallback to dist/app for root path
                filePath = path.join(projectRoot, 'dist/app', urlPath);
            }

            // Default to index.html for root or directory requests
            if (filePath.endsWith('/') || !path.extname(filePath)) {
                const possibleIndex = path.join(filePath, 'index.html');
                if (fs.existsSync(possibleIndex)) {
                    filePath = possibleIndex;
                } else if (!path.extname(filePath)) {
                    filePath = filePath + '/index.html';
                }
            }

            const normalizedPath = path.normalize(filePath);
            const distDir = path.join(projectRoot, 'dist');

            // Security check - prevent directory traversal
            if (!normalizedPath.startsWith(distDir)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            fs.readFile(normalizedPath, (err, data) => {
                if (err) {
                    // Try with index.html for SPA routing
                    const indexPath = path.join(projectRoot, 'dist/app/index.html');
                    fs.readFile(indexPath, (err2, indexData) => {
                        if (err2) {
                            res.writeHead(404);
                            res.end(`Not Found: ${urlPath}`);
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(indexData);
                        }
                    });
                    return;
                }

                // Determine content type
                const ext = path.extname(normalizedPath).toLowerCase();
                const contentTypes = {
                    '.html': 'text/html',
                    '.js': 'application/javascript',
                    '.mjs': 'application/javascript',
                    '.css': 'text/css',
                    '.json': 'application/json',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml',
                    '.ico': 'image/x-icon',
                    '.woff': 'font/woff',
                    '.woff2': 'font/woff2',
                    '.ttf': 'font/ttf'
                };

                res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
                res.end(data);
            });
        });

        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => {
            resolve(server);
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    const presetName = args.find(a => a.startsWith('--preset='))?.split('=')[1] || 'github-pages';
    const target = args.find(a => a.startsWith('--target='))?.split('=')[1] || 'app';
    const isQuick = args.includes('--quick');
    const isFailOnError = args.includes('--fail-on-error');
    const customUrl = args.find(a => a.startsWith('--url='))?.split('=')[1];

    console.log(`Quality Core CLI v1.0.0`);
    console.log(`Target: ${target.toUpperCase()}`);
    console.log(`Preset: ${presetName}`);

    // Determine dist directory
    const projectRoot = process.cwd();
    let distDir = target === 'app'
        ? path.join(projectRoot, 'dist/app')
        : path.join(projectRoot, 'dist');

    // Check if dist exists
    if (!fs.existsSync(distDir)) {
        console.error(`\n❌ Build directory not found: ${distDir}`);
        console.error(`   Run 'npm run build' first.`);
        process.exit(1);
    }

    // Server configuration
    const port = 4173;
    let server = null;
    let url = customUrl;

    // Start server if no custom URL provided
    if (!customUrl) {
        const needsServer = !isQuick; // Only need server for non-quick audits

        if (needsServer) {
            console.log(`\n🔧 Starting static server on port ${port}...`);
            try {
                server = await createStaticServer(projectRoot, port);
                // URL matches the GitHub Pages structure
                url = target === 'app'
                    ? `http://localhost:${port}/portcmd/app/`
                    : `http://localhost:${port}/portcmd/`;
                console.log(`✅ Server running at ${url}`);
            } catch (err) {
                console.error(`❌ Failed to start server: ${err.message}`);
                process.exit(1);
            }
        } else {
            url = `http://localhost:${port}/portcmd/app/`;
        }
    }

    // Preset Config
    const preset = presetName === 'github-pages' ? GITHUB_PAGES_PRESET : GITHUB_PAGES_PRESET;

    const context = {
        url: url,
        preset: presetName,
        target: target,
        device: preset.device || 'mobile',
        thresholds: DEFAULT_THRESHOLDS,
        projectRoot: projectRoot,
        distDir: distDir
    };

    console.log(`\n🚀 Starting Quality Core Audit (${presetName})...\n`);

    // Select Audits
    const auditsToRun = [];
    if (isQuick) {
        auditsToRun.push(AVAILABLE_AUDITS.build);
        auditsToRun.push(AVAILABLE_AUDITS.lint); // Quick lint
        auditsToRun.push(AVAILABLE_AUDITS.bundle); // Check bundle size
    } else {
        auditsToRun.push(AVAILABLE_AUDITS.build);
        auditsToRun.push(AVAILABLE_AUDITS.lint);
        auditsToRun.push(AVAILABLE_AUDITS.bundle);
        auditsToRun.push(AVAILABLE_AUDITS.render);
        auditsToRun.push(AVAILABLE_AUDITS.ux);
        auditsToRun.push(AVAILABLE_AUDITS.a11y);
        auditsToRun.push(AVAILABLE_AUDITS.contrast); // Real contrast check
        auditsToRun.push(AVAILABLE_AUDITS.i18n); // i18n check
        auditsToRun.push(AVAILABLE_AUDITS.seo);
    }

    const validAudits = auditsToRun.filter(Boolean);

    if (validAudits.length === 0) {
        console.error("No valid audits found to run.");
        if (server) server.close();
        process.exit(1);
    }

    // Run Audit
    let result;
    try {
        result = await runAudits({ audits: validAudits, context });
    } finally {
        // Always close the server
        if (server) {
            server.close();
            console.log(`\n🛑 Static server stopped.`);
        }
    }

    // Save Reports
    const reportDir = path.join(projectRoot, 'performance-reports', 'quality');

    // Ensure report directory exists
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

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

    // Final Status
    if (result.status === 'fail') {
        console.log(`\n❌ Quality Check Failed.`);
        process.exit(isFailOnError ? 1 : 0);
    } else {
        console.log(`\n✅ Quality Check Passed!`);
    }
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
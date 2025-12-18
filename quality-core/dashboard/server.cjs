/**
 * Performance Dashboard Server for PortCmd
 * 
 * Orchestrates quality audits, lighthouse reports, and git operations.
 */

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { spawn, execSync } = require('child_process');
const { marked } = require('marked');
const util = require('util');

// ============================================================================ 
// CONFIGURATION
// ============================================================================ 

const CONFIG = {
    basePort: 3333,
    maxPortAttempts: 10,
    staticDir: path.join(__dirname, 'public'),
    reportsDir: path.join(process.cwd(), 'performance-reports'),
    lighthouseDir: path.join(process.cwd(), 'performance-reports', 'lighthouse'),
    qualityDir: path.join(process.cwd(), 'performance-reports', 'quality'),
    manualDir: path.join(process.cwd(), 'performance-reports', 'manual'),
    logsDir: path.join(process.cwd(), 'docs/logs'),
    allowedCommands: {
        'quality': 'npm run quality',
        'lighthouse': 'npm run perf:lighthouse'
    }
};

const execPromise = util.promisify(require('child_process').exec);

// ============================================================================ 
// UTILITIES
// ============================================================================ 

function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = http.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => { server.close(); resolve(true); });
        server.listen(port);
    });
}

async function findAvailablePort(startPort) {
    for (let i = 0; i < CONFIG.maxPortAttempts; i++) {
        const port = startPort + i;
        if (await isPortAvailable(port)) return port;
    }
    throw new Error(`No port available starting at ${startPort}`);
}

async function ensureDirectory(dirPath) {
    try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
}

async function readJsonFiles(dirPath) {
    try {
        await ensureDirectory(dirPath);
        const files = await fs.readdir(dirPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const data = await Promise.all(
            jsonFiles.map(async (file) => {
                try {
                    const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
                    return {
                        filename: file,
                        data: JSON.parse(content),
                        timestamp: (await fs.stat(path.join(dirPath, file))).mtime
                    };
                } catch { return null; }
            })
        );
        return data.filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch { return []; }
}

async function readMarkdownFiles(dirPath) {
    try {
        await ensureDirectory(dirPath);
        const files = await fs.readdir(dirPath);
        const mdFiles = files.filter(f => f.endsWith('.md'));
        const data = await Promise.all(
            mdFiles.map(async (file) => {
                try {
                    const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
                    return {
                        filename: file,
                        markdown: content,
                        html: marked.parse(content),
                        timestamp: (await fs.stat(path.join(dirPath, file))).mtime
                    };
                } catch { return null; }
            })
        );
        return data.filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch { return []; }
}

// --- Run Command Handler with SSE ---
// --- Run Command Handler (Moved Main Logic to Bottom) ---
async function handleRunCommand(req, res, cmdTypeOverride = null) {
    // Forwarding to unified handler
    return handleRunCommandByCwd(req, res, cmdTypeOverride);
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// ============================================================================ 
// HANDLERS
// ============================================================================ 

async function handleStaticFile(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        let filePath = path.join(CONFIG.staticDir, url.pathname === '/' ? 'index.html' : url.pathname);
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(CONFIG.staticDir)) {
            res.writeHead(403); res.end('Access Denied'); return;
        }
        const stats = await fs.stat(filePath).catch(() => null);
        if (!stats || !stats.isFile()) {
            res.writeHead(404); res.end('Not Found'); return;
        }
        const content = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
        res.end(content);
    } catch {
        res.writeHead(500); res.end('Internal Error');
    }
}

async function handleVerifyGemini(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { key } = JSON.parse(body);
            if (!key) throw new Error('Key required');
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
            https.get(url, (apiRes) => {
                let apiBody = '';
                apiRes.on('data', chunk => apiBody += chunk);
                apiRes.on('end', () => {
                    if (apiRes.statusCode === 200) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Invalid API Key' }));
                    }
                });
            }).on('error', (e) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            });
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

async function handleAiAnalyze(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const { key, prompt } = JSON.parse(body);
            if (!key || !prompt) throw new Error('Key and prompt required');

            // Appending structural instructions for Gemini
            const structuralInstructions = `
             IMPORTANT: Format your response using clean Markdown headers. 
             Do NOT use emojis. 
             Structure your analysis as follows:
             ## Executive Summary
             [Brief overview]
             
             ## Key Metrics Analysis
             [Detailed analysis of scores]
             
             ## Critical Issues
             [List of major violations]
             
             ## Recommendations
             [Actionable steps to improve]
            `;

            const fullPrompt = `${prompt}\n\n${structuralInstructions}`;

            const data = JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] });
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            };
            const apiReq = https.request(options, (apiRes) => {
                let apiBody = '';
                apiRes.on('data', chunk => apiBody += chunk);
                apiRes.on('end', async () => {
                    // Save Insight
                    if (apiRes.statusCode === 200) {
                        try {
                            const result = JSON.parse(apiBody);
                            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            const filename = `insight-${Date.now()}.json`;
                            await ensureDirectory(CONFIG.insightsDir);
                            await fs.writeFile(path.join(CONFIG.insightsDir, filename), JSON.stringify({
                                timestamp: new Date(),
                                prompt: prompt.substring(0, 100) + '...',
                                data: text
                            }, null, 2));
                        } catch (e) { console.error('Failed to save insight:', e); }
                    }
                    res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(apiBody);
                });
            });
            apiReq.on('error', (e) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            });
            apiReq.write(data);
            apiReq.end();
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

async function handleVerifyGitHub(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { token } = JSON.parse(body);
            if (!token) throw new Error('Token required');
            const options = {
                hostname: 'api.github.com', path: '/user', method: 'GET',
                headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'PortCmd-Dashboard' }
            };
            const apiReq = https.request(options, (apiRes) => {
                let apiBody = '';
                apiRes.on('data', chunk => apiBody += chunk);
                apiRes.on('end', () => {
                    if (apiRes.statusCode === 200) {
                        const scopes = apiRes.headers['x-oauth-scopes'] || '';
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, scopes: scopes.split(',').map(s => s.trim()).filter(Boolean) }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Invalid Token' }));
                    }
                });
            });
            apiReq.on('error', (e) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            });
            apiReq.end();
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

async function handlePageSpeed(req, res, urlObj) {
    const targetUrl = urlObj.searchParams.get('url');
    const apiKey = urlObj.searchParams.get('key') || '';
    const strategy = urlObj.searchParams.get('strategy') || 'mobile';

    // Switch to SSE for Console-like experience
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const sendLog = (msg) => res.write(`data: ${JSON.stringify({ type: 'stdout', data: msg })}\n\n`);
    const sendDone = (data) => res.write(`data: ${JSON.stringify({ type: 'result', data })}\n\n`);
    const sendError = (err) => res.write(`data: ${JSON.stringify({ type: 'error', error: err })}\n\n`);

    if (!targetUrl) {
        sendError('URL required');
        return res.end();
    }

    try {
        sendLog(`🚀 Initializing PageSpeed Insights for ${targetUrl} (${strategy})...`);
        sendLog(`⏳ Contacting Google API...`);

        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo${apiKey ? `&key=${apiKey}` : ''}`;

        https.get(psiUrl, (psiRes) => {
            let data = '';
            psiRes.on('data', chunk => data += chunk);
            psiRes.on('end', async () => {
                if (psiRes.statusCode !== 200) {
                    sendError(`API returned status ${psiRes.statusCode}: ${data}`);
                    res.end();
                    return;
                }

                sendLog('✅ Analysis complete. Processing results...');
                try {
                    const json = JSON.parse(data);

                    // Save Result
                    const filename = `pagespeed-${strategy}-${Date.now()}.json`;
                    await ensureDirectory(CONFIG.pagespeedDir);
                    await fs.writeFile(path.join(CONFIG.pagespeedDir, filename), JSON.stringify(json, null, 2));
                    sendLog(`💾 Report saved to ${filename}`);

                    sendDone(json);
                    res.end();
                } catch (e) {
                    sendError(`Failed to process result: ${e.message}`);
                    res.end();
                }
            });
        }).on('error', (err) => {
            sendError(`Network error: ${err.message}`);
            res.end();
        });

    } catch (e) {
        sendError(`Handler error: ${e.message}`);
        res.end();
    }
}

function execGit(args) {
    try {
        return execSync(`git ${args}`, { cwd: process.cwd(), encoding: 'utf-8' }).trim();
    } catch (e) { throw new Error(e.stderr || e.message); }
}

async function handleGitStatus(req, res) {
    try {
        const status = execGit('status --porcelain');
        const branch = execGit('branch --show-current');
        const lastCommit = execGit('log -1 --pretty=format:"%h %s"');
        const files = status.split('\n').filter(Boolean).map(line => ({ status: line.substring(0, 2).trim(), file: line.substring(3) }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { branch, lastCommit, files, hasChanges: files.length > 0 } }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
    }
}

async function handleGitCommit(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { message } = JSON.parse(body);
            if (!message) throw new Error('Message required');
            execGit('add .');
            const sanitizedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
            const result = execGit(`commit -m "${sanitizedMessage}"`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, result }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

async function handleGitPush(req, res) {
    try {
        const result = execGit('push');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
    }
}

// ============================================================================ 
// API ROUTES
// ============================================================================ 

async function handleApiReports(req, res) {
    try {
        const [quality, lighthouse, manual] = await Promise.all([
            readJsonFiles(CONFIG.qualityDir),
            readJsonFiles(CONFIG.lighthouseDir),
            readMarkdownFiles(CONFIG.manualDir)
        ]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ quality, lighthouse, manual }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

async function handleRunCommand(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const { command } = JSON.parse(body);
            const cmd = CONFIG.allowedCommands[command];
            if (!cmd) throw new Error(`Unknown command: ${command}`);

            const { stdout, stderr } = await execPromise(cmd, { cwd: process.cwd() });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, output: stdout, errors: stderr }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message, output: e.stdout, errors: e.stderr }));
        }
    });
}

// ============================================================================ 
// REQUEST ROUTER
// ============================================================================ 

async function handleRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // API Routes
    if (url.pathname === '/api/reports') return handleApiReports(req, res);
    if (url.pathname === '/api/reports/quality') {
        const data = await readJsonFiles(CONFIG.qualityDir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ data }));
    }
    if (url.pathname === '/api/reports/lighthouse') {
        const data = await readJsonFiles(CONFIG.lighthouseDir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ data }));
    }

    // Individual quality report file by name
    if (url.pathname.startsWith('/api/report/quality/')) {
        const filename = url.pathname.replace('/api/report/quality/', '');
        const filePath = path.join(CONFIG.qualityDir, filename);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(content);
        } catch {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Report not found' }));
        }
    }

    // Logs endpoint - returns markdown files from quality dir
    if (url.pathname === '/api/logs') {
        const data = await readMarkdownFiles(CONFIG.qualityDir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ data }));
    }

    // Run lighthouse (alias for run command)
    if (url.pathname === '/api/run/lighthouse' && req.method === 'POST') {
        req.cmdOverride = 'lighthouse';
        return handleRunCommand(req, res, 'lighthouse');
    }

    // --- Delete Endpoint ---
    if (url.pathname === '/api/delete' && req.method === 'POST') return handleDelete(req, res);

    // --- History Lists ---
    if (url.pathname === '/api/reports/pagespeed') return handleListReports(req, res, CONFIG.pagespeedDir); // New
    if (url.pathname === '/api/reports/insights') return handleListReports(req, res, CONFIG.insightsDir);   // New

    if (url.pathname === '/api/run' && req.method === 'POST') return handleRunCommand(req, res);
    if ((url.pathname === '/api/verify-gemini' || url.pathname === '/api/verify/gemini') && req.method === 'POST') return handleVerifyGemini(req, res);
    if (url.pathname === '/api/ai-analyze' && req.method === 'POST') return handleAiAnalyze(req, res);
    if ((url.pathname === '/api/verify-github' || url.pathname === '/api/verify/github') && req.method === 'POST') return handleVerifyGitHub(req, res);
    if (url.pathname === '/api/pagespeed') return handlePageSpeed(req, res, url);
    if (url.pathname === '/api/git/status') return handleGitStatus(req, res);
    if (url.pathname === '/api/git/commit' && req.method === 'POST') return handleGitCommit(req, res);
    if (url.pathname === '/api/git/push' && req.method === 'POST') return handleGitPush(req, res);

    // Static files
    return handleStaticFile(req, res);
}

// ============================================================================ 
// CONFIG UPDATE & HANDLERS
// ============================================================================ 

// Ensure new dirs exist
CONFIG.pagespeedDir = path.join(CONFIG.reportsDir, 'pagespeed');
CONFIG.insightsDir = path.join(CONFIG.reportsDir, 'insights');

async function ensureAllDirs() {
    await ensureDirectory(CONFIG.reportsDir);
    await ensureDirectory(CONFIG.qualityDir);
    await ensureDirectory(CONFIG.lighthouseDir);
    await ensureDirectory(CONFIG.manualDir);
    await ensureDirectory(CONFIG.pagespeedDir);
    await ensureDirectory(CONFIG.insightsDir);
}

async function handleListReports(req, res, dirPath) {
    const data = await readJsonFiles(dirPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data }));
}

async function handleDelete(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const { type, filename } = JSON.parse(body);
            let targetDir;
            if (type === 'quality') targetDir = CONFIG.qualityDir;
            else if (type === 'lighthouse') targetDir = CONFIG.lighthouseDir;
            else if (type === 'pagespeed') targetDir = CONFIG.pagespeedDir;
            else if (type === 'insights') targetDir = CONFIG.insightsDir;
            else throw new Error('Invalid type');

            const filePath = path.join(targetDir, path.basename(filename));
            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

// Updated Spawn Logic
// Unified Run Command Logic
async function handleRunCommandByCwd(req, res, cmdTypeOverride = null) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            let cmdType = cmdTypeOverride;
            if (!cmdType) {
                const parsed = body ? JSON.parse(body) : {};
                cmdType = parsed.command || 'quality';
            }

            const commands = {
                'quality': 'npm run quality',
                'lighthouse': 'npm run perf:lighthouse'
            };
            const cmdStr = commands[cmdType];
            if (!cmdStr) {
                 res.writeHead(400, { 'Content-Type': 'application/json' });
                 return res.end(JSON.stringify({ error: 'Invalid command type' }));
            }

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

            res.write(`data: ${JSON.stringify({ type: 'start', command: cmdType })}\n\n`);

            const { spawn } = require('child_process');
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'cmd.exe' : '/bin/sh';
            const args = isWindows ? ['/c', cmdStr] : ['-c', cmdStr];

            console.log(`Executing: ${cmdStr}`);
            
            const child = spawn(shell, args, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });

            child.stdout.on('data', data => res.write(`data: ${JSON.stringify({ type: 'stdout', data: data.toString() })}\n\n`));
            child.stderr.on('data', data => res.write(`data: ${JSON.stringify({ type: 'stderr', data: data.toString() })}\n\n`));

            child.on('close', code => {
                res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
                res.end();
            });
            child.on('error', err => {
                console.error('Spawn Error:', err);
                res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
                res.end();
            });

        } catch (e) {
            console.error('Handler Error:', e);
            res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
            res.end();
        }
    });
}

// ============================================================================ 
// SERVER STARTUP
// ============================================================================ 

async function startServer() {
    try {
        await ensureAllDirs();

        const port = await findAvailablePort(CONFIG.basePort);
        const server = http.createServer(handleRequest);

        server.listen(port, () => {
            console.log(`\n🚀 Performance Dashboard running at: http://localhost:${port}\n`);
            console.log('Available endpoints:');
            console.log('  GET  /api/reports         - List all performance reports');
            console.log('  POST /api/run             - Run quality or lighthouse audit');
            console.log('  POST /api/verify-gemini   - Verify Gemini API key');
            console.log('  POST /api/ai-analyze      - Analyze with Gemini AI');
            console.log('  POST /api/verify-github   - Verify GitHub token');
            console.log('  GET  /api/pagespeed       - Run PageSpeed Insights');
            console.log('  GET  /api/git/status      - Get git status');
            console.log('  POST /api/git/commit      - Create a git commit');
            console.log('  POST /api/git/push        - Push to remote\n');
        });
    } catch (e) {
        console.error('Failed to start server:', e.message);
        process.exit(1);
    }
}

startServer();
/**
 * Performance Dashboard Server for PortCmd
 * 
 * Orchestrates quality audits, lighthouse reports, and git operations.
 */

const { z } = require('zod'); // Implements Security Skill: Input Validation
const http = require('http');

// ============================================================================ 
// VALIDATION SCHEMAS
// ============================================================================ 


// Schemas moved after CONFIG to avoid ReferenceError


const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');
const util = require('util');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

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
    manualDir: process.env.LIGHTHOUSE_MANUAL_PATH || path.join(process.cwd(), 'performance-reports', 'manual'),
    get manualPath() {
        return process.env.LIGHTHOUSE_MANUAL_PATH || (global.serverSettings?.manualReportsPath) || path.join(process.cwd(), 'performance-reports', 'manual');
    },
    logsDir: path.join(process.cwd(), 'docs/logs'),
    settingsFile: path.join(process.cwd(), 'performance-reports', 'settings.json'),
    retentionPeriods: {
        'all': null,
        '1y': 365 * 24 * 60 * 60 * 1000,
        '6m': 180 * 24 * 60 * 60 * 1000,
        '3m': 90 * 24 * 60 * 60 * 1000,
        '1m': 30 * 24 * 60 * 60 * 1000,
        '15d': 15 * 24 * 60 * 60 * 1000,
        '1w': 7 * 24 * 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000
    },
    allowedCommands: {
        'quality': 'npm run quality',
        'quality:gate': 'npm run quality:gate',
        'lighthouse': 'npm run perf:lighthouse',
        'perf:lighthouse': 'npm run perf:lighthouse',
        'audit:app': 'npm run audit:app',
        'audit:promo': 'npm run audit:promo',
        'ops:optimize': 'npm run ops:optimize',
        'build:clean': 'npm run build:clean',
        'health': 'npm run health'
    }
};

const execPromise = util.promisify(require('child_process').exec);

// ============================================================================ 
// VALIDATION SCHEMAS
// ============================================================================ 

const ApiVerifyGeminiSchema = z.object({
    key: z.string().min(1)
});

const ApiAiAnalyzeSchema = z.object({
    key: z.string().min(1),
    prompt: z.string().min(1),
    reportType: z.enum(['technical', 'educational', 'executive']).optional().default('technical'),
    language: z.enum(['en', 'pt-BR', 'es']).optional().default('en'),
    pageSource: z.string().optional(),
    target: z.string().optional()
});

const ApiVerifyGithubSchema = z.object({
    token: z.string().min(1)
});

const ApiRunCommandSchema = z.object({
    command: z.enum(Object.keys(CONFIG.allowedCommands))
});

const ApiGitCommitSchema = z.object({
    message: z.string().min(1).max(500)
});

const ApiSettingsSchema = z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    apiKeys: z.record(z.string()).optional()
}).passthrough();


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

async function readJsonFiles(dirPath, limit = 50) {
    try {
        await ensureDirectory(dirPath);
        const files = await fs.readdir(dirPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        // 1. Stat all files first to sort by real date (IO cheap compared to content read)
        const fileStats = await Promise.all(jsonFiles.map(async f => {
            try {
                const s = await fs.stat(path.join(dirPath, f));
                return { file: f, mtime: s.mtime.getTime() };
            } catch { return null; }
        }));

        // 2. Sort by mtime desc and take top N
        const sortedFiles = fileStats
            .filter(Boolean)
            .sort((a, b) => b.mtime - a.mtime)
            .slice(0, limit);

        // 3. Read content ONLY for the top N files
        const data = await Promise.all(
            sortedFiles.map(async ({ file, mtime }) => {
                try {
                    const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
                    return {
                        filename: file,
                        data: JSON.parse(content),
                        timestamp: mtime
                    };
                } catch { return null; }
            })
        );
        return data.filter(Boolean);
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
            const json = JSON.parse(body);
            const { key } = ApiVerifyGeminiSchema.parse(json);

            const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
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

// --- AI Modules Import ---
// --- AI Modules Import ---
const { generateWithFallback } = require("../ai/index.cjs"); // New AI Facade
const { getCached, setCached } = require("./server/ai/aiCache.cjs");
const { enqueue } = require("./server/ai/aiQueue.cjs");
const { save: saveToHistory } = require("./server/ai/aiHistory.cjs");
const { rateLimit } = require("./server/rateLimit.cjs");

async function handleAiAnalyze(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const json = JSON.parse(body);
            const { key, prompt, reportType, language, pageSource, target } = ApiAiAnalyzeSchema.parse(json);


            // Rate limit check
            if (!rateLimit(req, res, key)) return;

            // Language instruction
            const languageNames = {
                'en': 'English',
                'pt-BR': 'Brazilian Portuguese',
                'es': 'Spanish'
            };
            const langName = languageNames[language] || 'English';

            // Report type templates
            const templates = {
                technical: `
IMPORTANT: Format your response using clean Markdown headers and tables.
Do NOT use emojis.
Respond entirely in \${langName}.
Be extremely specific, clinical, and demanding in your analysis. Act as a strict Lead Performance Engineer. 
A "PASS" is only awarded if ALL Core Web Vitals are within Google's "Good" range.

## Audit Verdict: [READY / NOT READY FOR PRODUCTION]
**Status:** [SUCCESS / FAILURE / WARNING]
**Performance Score:** [0-100]
**Critical Blockers:** [Count of issues requiring immediate fix before deployment]

## Executive Summary
[2-3 sentence overview. If NOT READY, specify the single biggest technical bottleneck that prevents a high Lighthouse score.]

## Performance Budget Compliance
| Category | Metric | Actual | Budget (Target) | Status |
|----------|--------|--------|-----------------|--------|
| Loading  | LCP    | [Val]  | ≤ 2.5s          | [OK/FAIL] |
| Interactivity | INP | [Val]  | ≤ 200ms         | [OK/FAIL] |
| Stability | CLS    | [Val]  | ≤ 0.1           | [OK/FAIL] |
| Size     | Bundle | [Val]  | ≤ 600KB         | [OK/FAIL] |

## Deep Technical Analysis

### [Metric Name] - Critical Analysis
- **Observed Value:** [exact value]
- **Target Threshold:** [threshold value]  
- **Technical Severity:** [Critical/High/Medium]
- **Lighthouse Diagnostic:** [Technical explanation using terms like "Render-blocking", "Main-thread blocking", "TBT contribution", etc.]
- **Remediation Specification (Required for Compliance):**
  1. [Exact code modification or configuration change]
  2. [Specific file path and line number if possible]
  3. [Verification command to run]

## Priority Action Matrix (Impact/Effort)

| Proposed Action | Technical Impact | Complexity | Priority |
|-----------------|------------------|------------|----------|
| [Action Name]   | [90-100%]        | [Low-High] | [P0-P3]  |

## Implementation Roadmap

### Phase 1: Critical Compliance (P0)
[List actions that MUST be done to achieve a Performance Score > 90]

### Phase 2: Optimization (P1)
[List actions for further refinement]
`,
                educational: `
IMPORTANT: Format your response using clean Markdown headers.
Do NOT use emojis.
Respond entirely in ${langName}.
Write in a friendly, educational tone for beginners. Use analogies and real-world examples.

## What's Happening?
[Simple explanation of the current project state, using analogies - like comparing website performance to a car's engine]

## Understanding Your Scores

### The Traffic Light System
Explain that:
- Green (90-100): Excellent, no action needed
- Yellow (70-89): Acceptable but could improve
- Red (0-69): Needs attention

### Your Current Scores
[For each metric, explain in simple terms what it measures and why it matters for real users]

## Problems Found

For each issue, explain:
- **What it means:** [Simple explanation]
- **Why it happens:** [Common causes]
- **How it affects users:** [Real-world impact, like "users might leave if page loads slowly"]

## How to Fix It

### Easy Wins (Do These First)
[Simple fixes anyone can do, with step-by-step instructions]

### Medium Effort
[Fixes that need some technical knowledge]

### Advanced
[Complex fixes that might need a developer]

## Next Steps

1. [First thing to do]
2. [Second thing to do]
3. [Third thing to do]

## Learning Resources
[Links or suggestions for learning more about web performance]
`
            };

            const structuralInstructions = templates[reportType] || templates.technical;
            const fullPrompt = `${prompt}\n\n${structuralInstructions}`;

            // Check cache first
            const cached = await getCached(fullPrompt);
            if (cached) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ ...cached, cached: true }));
            }

            // Enqueue AI generation (prevents concurrent heavy operations)
            const job = () => generateWithFallback({
                apiKey: key,
                prompt: fullPrompt
            });

            const result = await enqueue(job);

            // Save to cache and history
            await setCached(fullPrompt, result);
            await saveToHistory({
                ...result,
                promptPreview: prompt.substring(0, 100) + '...',
                reportType,
                language,
                pageSource,
                target
            });

            // Also save as insight file (legacy compatibility)
            try {
                const filename = `insight-${Date.now()}.json`;
                await ensureDirectory(CONFIG.insightsDir);
                await fs.writeFile(path.join(CONFIG.insightsDir, filename), JSON.stringify({
                    timestamp: new Date(),
                    prompt: prompt.substring(0, 100) + '...',
                    data: result.content,
                    model: result.model,
                    reportType,
                    language,
                    target
                }, null, 2));
            } catch (e) { console.error('Failed to save insight file:', e); }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));

        } catch (e) {
            console.error('AI Analyze Error:', e.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

async function handleVerifyGitHub(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const json = JSON.parse(body);
            const { token } = ApiVerifyGithubSchema.parse(json);

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
            const json = JSON.parse(body);
            const { message } = ApiGitCommitSchema.parse(json);

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
// ENVIRONMENT CONFIG HANDLER
// ============================================================================ 

/**
 * Returns sanitized environment variables to the dashboard.
 * Env vars have priority over localStorage in the dashboard.
 */
async function handleEnvConfig(req, res) {
    // Only expose VITE_ prefixed env vars (safe for client)
    const envConfig = {
        geminiKey: process.env.VITE_GEMINI_API_KEY || '',
        geminiKey2: process.env.VITE_GEMINI_API_KEY_2 || '',
        geminiKey3: process.env.VITE_GEMINI_API_KEY_3 || '',
        pagespeedKey: process.env.VITE_PAGESPEED_API_KEY || '',
        githubToken: process.env.VITE_GITHUB_TOKEN || '',
        projectName: process.env.VITE_PROJECT_NAME || '',
        monitorUrl: process.env.VITE_MONITOR_URL || '',
        appUrl: process.env.VITE_APP_URL || '',
        promoUrl: process.env.VITE_PROMO_URL || '',
        githubRepo: process.env.VITE_GITHUB_REPO || '',
        manualPath: CONFIG.manualPath
    };

    // Check if any values are set
    const hasEnvConfig = Object.values(envConfig).some(v => v !== '');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: true,
        hasEnvConfig,
        config: envConfig
    }));
}

// ============================================================================ 
// API ROUTES
// ============================================================================ 

async function handleReportsHistory(req, res, urlObj) {
    const target = urlObj.searchParams.get('target'); // 'app' or 'promo'
    const limit = parseInt(urlObj.searchParams.get('limit') || '10');
    const source = urlObj.searchParams.get('source') || 'lighthouse'; // 'lighthouse' | 'quality' | 'pagespeed'

    try {
        let dir;
        let filterFn;
        let formatFn;

        if (source === 'lighthouse') {
            dir = CONFIG.lighthouseDir;
            filterFn = f => f.endsWith('.json') && (!target || f.includes(`lighthouse_${target}_`));
            formatFn = (json, file) => {
                const categories = json.categories || {};
                const scores = {
                    performance: Math.round((categories.performance?.score || 0) * 100),
                    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
                    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
                    seo: Math.round((categories.seo?.score || 0) * 100),
                };
                return {
                    filename: file,
                    timestamp: json.fetchTime || new Date().toISOString(),
                    target: json.metadata?.target || (file.includes('_app_') ? 'app' : 'promo'),
                    formFactor: json.metadata?.formFactor || (file.includes('_mobile_') ? 'mobile' : 'desktop'),
                    scores
                };
            };
        } else if (source === 'quality') {
            dir = CONFIG.qualityDir;
            // Quality reports are usually generic, but check for matches if needed
            filterFn = f => f.endsWith('.json'); // && f.startsWith('quality-report-'); 
            formatFn = (json, file) => {
                // Extract target from meta or filename
                const target = json.meta?.target || (file.includes('app') ? 'app' : 'promo');

                // Aggregated metrics from quality report
                const detailedScores = json.metrics?.scores || {};
                const scores = {
                    score: json.summary?.score || json.score || 0,
                    build: detailedScores.build || 0,
                    lint: detailedScores.lint || 0,
                    'bundle-size': detailedScores['bundle-size'] || 0,
                    render: detailedScores.render || 0,
                    ux: detailedScores.ux || 0,
                    a11y: detailedScores.a11y || 0,
                    contrast: detailedScores.contrast || 0,
                    i18n: detailedScores.i18n || 0,
                    seo: detailedScores.seo || 0
                };
                return {
                    filename: file,
                    timestamp: json.meta?.generatedAt || json.meta?.timestamp || new Date().toISOString(),
                    target: target,
                    formFactor: 'code',
                    scores,
                    violations: json.violations || []
                };
            };
        } else if (source === 'pagespeed') {
            dir = CONFIG.pagespeedDir;
            filterFn = f => f.endsWith('.json'); // && f.startsWith('pagespeed-');
            formatFn = (json, file) => {
                // Support both legacy raw JSON and new wrapped format
                const lhResult = json.lighthouseResult || json.data?.lighthouseResult || {};
                const categories = lhResult.categories || {};
                const scores = {
                    performance: Math.round((categories.performance?.score || 0) * 100),
                    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
                    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
                    seo: Math.round((categories.seo?.score || 0) * 100),
                };

                // Extract metadata from either root (legacy) or wrapped data
                const target = json.id || json.data?.id || (json.url ? new URL(json.url).hostname : 'unknown');
                const timestamp = json.timestamp || json.analysisUTCTimestamp || json.data?.analysisUTCTimestamp || new Date().toISOString();

                return {
                    filename: file,
                    timestamp: timestamp,
                    target: target,
                    formFactor: json.strategy || json.data?.configSettings?.formFactor || 'mobile',
                    scores
                };
            };
        } else {
            throw new Error('Invalid source');
        }

        const files = await fs.readdir(dir);
        // Optimize: Filter, Sort (Desc) and Limit BEFORE reading content
        const relevantFiles = files
            .filter(filterFn)
            .sort()
            .reverse()
            .slice(0, limit);

        const history = await Promise.all(
            relevantFiles.map(async (file) => {
                try {
                    const content = await fs.readFile(path.join(dir, file), 'utf-8');
                    const json = JSON.parse(content);
                    return formatFn(json, file);
                } catch (e) { return null; }
            })
        );

        // Sort by date desc
        const sortedHistory = history
            .filter(Boolean)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: sortedHistory }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
    }
}

async function handleApiReports(req, res) {
    try {
        const [quality, lighthouse, manual] = await Promise.all([
            readJsonFiles(CONFIG.qualityDir, 50),
            readJsonFiles(CONFIG.lighthouseDir, 50),
            readJsonFiles(CONFIG.manualPath, 50)
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

    // Individual lighthouse report file by name
    if (url.pathname.startsWith('/api/report/lighthouse/')) {
        const filename = url.pathname.replace('/api/report/lighthouse/', '');
        const filePath = path.join(CONFIG.lighthouseDir, filename);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(content);
        } catch {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Lighthouse report not found' }));
        }
    }

    // Individual pagespeed report file by name
    if (url.pathname.startsWith('/api/report/pagespeed/')) {
        const filename = url.pathname.replace('/api/report/pagespeed/', '');
        const filePath = path.join(CONFIG.pagespeedDir, filename);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(content);
        } catch {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'PageSpeed report not found' }));
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

    // --- Manual Lighthouse Reports ---
    if (url.pathname === '/api/lighthouse/manual/list') {
        const data = await readJsonFiles(CONFIG.manualPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, data }));
    }

    if (url.pathname.startsWith('/api/lighthouse/manual/report/')) {
        const filename = url.pathname.replace('/api/lighthouse/manual/report/', '');
        const filePath = path.join(CONFIG.manualPath, filename);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(content);
        } catch {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Manual report not found' }));
        }
    }

    // --- Delete Endpoint ---
    if (url.pathname === '/api/delete' && req.method === 'POST') return handleDelete(req, res);

    // --- History Lists ---
    if (url.pathname === '/api/reports/history') return handleReportsHistory(req, res, url); // New History Endpoint
    if (url.pathname === '/api/reports/pagespeed') return handleListReports(req, res, CONFIG.pagespeedDir); // New
    if (url.pathname === '/api/reports/insights') return handleListReports(req, res, CONFIG.insightsDir);   // New

    // --- Settings & Cleanup ---
    if (url.pathname === '/api/settings' && req.method === 'GET') return handleGetSettings(req, res);
    if (url.pathname === '/api/settings' && req.method === 'POST') return handleUpdateSettings(req, res);
    if (url.pathname === '/api/cleanup' && req.method === 'POST') return handleCleanup(req, res);

    if (url.pathname === '/api/run' && req.method === 'POST') return handleRunCommandByCwd(req, res);
    if ((url.pathname === '/api/verify-gemini' || url.pathname === '/api/verify/gemini') && req.method === 'POST') return handleVerifyGemini(req, res);
    if (url.pathname === '/api/ai-analyze' && req.method === 'POST') return handleAiAnalyze(req, res);
    if ((url.pathname === '/api/verify-github' || url.pathname === '/api/verify/github') && req.method === 'POST') return handleVerifyGitHub(req, res);
    if (url.pathname === '/api/pagespeed') return handlePageSpeed(req, res, url);
    if (url.pathname === '/api/git/status') return handleGitStatus(req, res);
    if (url.pathname === '/api/git/commit' && req.method === 'POST') return handleGitCommit(req, res);
    if (url.pathname === '/api/git/push' && req.method === 'POST') return handleGitPush(req, res);

    // Environment configuration endpoint (used by dashboard to get env settings)
    if (url.pathname === '/api/env') return handleEnvConfig(req, res);

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
    await ensureDirectory(CONFIG.manualPath);
    await ensureDirectory(CONFIG.pagespeedDir);
    await ensureDirectory(CONFIG.insightsDir);
}

// HTTPS module already imported at top

async function handlePageSpeed(req, res, urlObj) {
    const targetUrl = urlObj.searchParams.get('url');
    const key = urlObj.searchParams.get('key');
    const strategy = urlObj.searchParams.get('strategy') || 'mobile';

    if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'URL parameter is required' }));
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo${key ? `&key=${key}` : ''}`;

    try {
        // Use Node's built-in https module if global fetch is not guaranteed
        const apiReq = https.get(apiUrl, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', async () => {
                // Determine status code based on upstream
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });

                // If success, save report history
                if (apiRes.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        const filename = `pagespeed-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                        const savePath = path.join(CONFIG.pagespeedDir, filename);
                        const reportData = {
                            url: targetUrl,
                            timestamp: Date.now(),
                            strategy,
                            data: json
                        };
                        try {
                            await fs.writeFile(savePath, JSON.stringify(reportData, null, 2));
                        } catch (err) {
                            console.error('Failed to save PageSpeed report:', err);
                        }
                    } catch (e) { console.error('Error parsing/saving PageSpeed:', e); }
                }

                res.end(data);
            });
        });

        apiReq.on('error', (e) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        });

    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
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

// ============================================================================ 
// SETTINGS & RETENTION POLICY
// ============================================================================ 

const DEFAULT_SETTINGS = {
    retentionPolicy: 'all', // 'all', '1y', '6m', '3m', '1m', '15d', '1w', '1d'
    autoCleanup: true,
    manualReportsPath: ''
};

// Global state to store settings for CONFIG.manualPath reference
global.serverSettings = DEFAULT_SETTINGS;

async function loadSettings() {
    try {
        const content = await fs.readFile(CONFIG.settingsFile, 'utf-8');
        const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
        global.serverSettings = settings;
        return settings;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

async function saveSettings(settings) {
    global.serverSettings = settings;
    await ensureDirectory(CONFIG.reportsDir);
    await fs.writeFile(CONFIG.settingsFile, JSON.stringify(settings, null, 2));
}

async function handleGetSettings(req, res) {
    try {
        const settings = await loadSettings();
        const periods = Object.keys(CONFIG.retentionPeriods).map(key => ({
            value: key,
            label: key === 'all' ? 'Keep All' :
                key === '1y' ? '1 Year' :
                    key === '6m' ? '6 Months' :
                        key === '3m' ? '3 Months' :
                            key === '1m' ? '1 Month' :
                                key === '15d' ? '15 Days' :
                                    key === '1w' ? '1 Week' : '1 Day'
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ settings, periods }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

async function handleUpdateSettings(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const updates = JSON.parse(body);
            ApiSettingsSchema.parse(updates);

            const current = await loadSettings();
            const newSettings = { ...current, ...updates };
            await saveSettings(newSettings);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, settings: newSettings }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

async function cleanupOldReports() {
    const settings = await loadSettings();
    const retentionMs = CONFIG.retentionPeriods[settings.retentionPolicy];

    if (!retentionMs) {
        console.log('[Cleanup] Retention policy is "all" - skipping cleanup.');
        return { deleted: 0, policy: 'all' };
    }

    const cutoffTime = Date.now() - retentionMs;
    const dirs = [CONFIG.qualityDir, CONFIG.lighthouseDir, CONFIG.pagespeedDir, CONFIG.insightsDir];
    let deleted = 0;

    for (const dir of dirs) {
        try {
            const files = await fs.readdir(dir);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const filePath = path.join(dir, file);
                const stat = await fs.stat(filePath);
                if (stat.mtime.getTime() < cutoffTime) {
                    await fs.unlink(filePath);
                    deleted++;
                }
            }
        } catch { /* dir may not exist */ }
    }

    console.log(`[Cleanup] Deleted ${deleted} old reports (policy: ${settings.retentionPolicy})`);
    return { deleted, policy: settings.retentionPolicy };
}

async function handleCleanup(req, res) {
    try {
        const result = await cleanupOldReports();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...result }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
    }
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
                // If parsing body, validate it
                if (body) {
                    const validated = ApiRunCommandSchema.parse(parsed);
                    cmdType = validated.command;
                } else {
                    cmdType = 'quality'; // Default fallthrough if no body? Original code didn't fail on empty body for default
                }
            }

            // Use CONFIG.allowedCommands for all supported commands
            const cmdStr = CONFIG.allowedCommands[cmdType];
            if (!cmdStr) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: `Invalid command type: ${cmdType}. Allowed: ${Object.keys(CONFIG.allowedCommands).join(', ')}` }));
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
    const INTEGRATED = process.env.PORTCMD_INTEGRATED === 'true';

    try {
        // Load settings first (needed for dynamic paths in CONFIG)
        const settings = await loadSettings();
        await ensureAllDirs();

        // Auto-cleanup old reports based on retention policy
        if (settings.autoCleanup) {
            await cleanupOldReports();
        }

        const port = await findAvailablePort(CONFIG.basePort);
        const server = http.createServer(handleRequest);

        server.listen(port, () => {
            if (!INTEGRATED) {
                console.log(`\n🚀 Performance Dashboard running at: http://localhost:${port}\n`);
                console.log('Available endpoints:');
                console.log('  GET  /api/reports         - List all performance reports');
                console.log('  GET  /api/settings        - Get retention settings');
                console.log('  POST /api/settings        - Update retention settings');
                console.log('  POST /api/cleanup         - Manual cleanup old reports');
                console.log('  POST /api/run             - Run quality or lighthouse audit');
                console.log('  POST /api/verify-gemini   - Verify Gemini API key');
                console.log('  POST /api/ai-analyze      - Analyze with Gemini AI');
                console.log('  POST /api/verify-github   - Verify GitHub token');
                console.log('  GET  /api/pagespeed       - Run PageSpeed Insights');
                console.log('  GET  /api/git/status      - Get git status');
                console.log('  POST /api/git/commit      - Create a git commit');
                console.log('  POST /api/git/push        - Push to remote\n');
            }
        });
    } catch (e) {
        console.error('Failed to start server:', e.message);
        process.exit(1);
    }
}

startServer();
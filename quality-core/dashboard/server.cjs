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
    req.on('end', () => {
        try {
            const { key, prompt } = JSON.parse(body);
            if (!key || !prompt) throw new Error('Key and prompt required');
            const data = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            };
            const apiReq = https.request(options, (apiRes) => {
                let apiBody = '';
                apiRes.on('data', chunk => apiBody += chunk);
                apiRes.on('end', () => {
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
    if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'URL required' }));
        return;
    }
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo${apiKey ? `&key=${apiKey}` : ''}`;
    https.get(psiUrl, (psiRes) => {
        let data = '';
        psiRes.on('data', chunk => data += chunk);
        psiRes.on('end', () => {
            res.writeHead(psiRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    }).on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
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
            const { message } = JSON.parse(body);
            if (!message) throw new Error('Message required');
            execGit('add .');
            const result = execGit(`commit -m "${message.replace(/
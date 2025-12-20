#!/usr/bin/env node
/**
 * PortCmd Dev Orchestrator
 * 
 * Premium dev experience with:
 * - Single banner display
 * - Prefixed logs per service
 * - Explicit URLs at startup
 * - HTTP healthcheck with visual status
 * - Graceful shutdown
 */

const { spawn, exec } = require('child_process');
const http = require('http');

const util = require('util');
const execPromise = util.promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

const isCI = process.argv.includes('--ci');
const isWindows = process.platform === 'win32';

const BANNER = `
▄█████▄ ██  ██ ▄████▄ ██     ██ ██████ ██  ██   
██ ▄ ██ ██  ██ ██▄▄██ ██     ██   ██    ▀██▀    
▀█████▀ ▀████▀ ██  ██ ██████ ██   ██     ██     
     ▀▀
▄█████ ▄████▄ █████▄  ██████
██     ██  ██ ██▄▄██▄ ██▄▄
▀█████ ▀████▀ ██   ██ ██▄▄▄▄

                          v1.0.0
`;

const SERVICES = [
    { id: 'API', cmd: 'npm', args: ['run', 'dev:server'], color: '\x1b[34m', url: 'http://localhost:3001', healthPath: '/api/health' },
    { id: 'APP', cmd: 'npm', args: ['run', 'dev:client'], color: '\x1b[35m', url: 'http://localhost:5173/portcmd/app/', healthPath: '/' },
    { id: 'WEB', cmd: 'npm', args: ['run', 'dev:website'], color: '\x1b[32m', url: 'http://localhost:5174/portcmd/', healthPath: '/' },
    { id: 'DASH', cmd: 'npm', args: ['run', 'dev:dashboard'], color: '\x1b[36m', url: 'http://localhost:3333', healthPath: '/api/reports' },
];

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

// ============================================================================
// STATE
// ============================================================================

const children = [];
const serviceStatus = {};
SERVICES.forEach(s => serviceStatus[s.id] = 'starting');

// ============================================================================
// UTILITIES
// ============================================================================

function log(serviceId, color, message) {
    const prefix = `${color}[${serviceId}]${RESET}`;
    const lines = message.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
        process.stdout.write(`${prefix} ${line}\n`);
    });
}

function checkHealth(service) {
    return new Promise((resolve) => {
        const url = new URL(service.healthPath, service.url);
        const req = http.get(url.toString(), { timeout: 2000 }, (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

async function waitForReady(service, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        const ready = await checkHealth(service);
        if (ready) {
            serviceStatus[service.id] = 'ready';
            printStatusLine();
            return true;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    serviceStatus[service.id] = 'timeout';
    printStatusLine();
    return false;
}

function printStatusLine() {
    const line = SERVICES.map(s => {
        const status = serviceStatus[s.id];
        const icon = status === 'ready' ? `${GREEN}✔${RESET}` :
            status === 'starting' ? `${YELLOW}⏳${RESET}` :
                `${RED}✖${RESET}`;
        return `${s.color}${s.id}${RESET} ${icon}`;
    }).join('  ');

    console.log(`\n${YELLOW}[STATUS]${RESET} ${line}\n`);
}

function printUrls() {
    console.log(`${YELLOW}┌──────────────────────────────────────────────────────┐${RESET}`);
    console.log(`${YELLOW}│${RESET}  ${GREEN}Available Services:${RESET}                                  ${YELLOW}│${RESET}`);
    console.log(`${YELLOW}├──────────────────────────────────────────────────────┤${RESET}`);
    SERVICES.forEach(s => {
        const padded = `│  ${s.color}${s.id.padEnd(6)}${RESET} → ${s.url}`.padEnd(62);
        console.log(`${YELLOW}${padded}${YELLOW}│${RESET}`);
    });
    console.log(`${YELLOW}└──────────────────────────────────────────────────────┘${RESET}\n`);
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

function startService(service) {
    const child = spawn(service.cmd, service.args, {
        shell: isWindows,
        env: {
            ...process.env,
            PORTCMD_INTEGRATED: 'true',
            FORCE_COLOR: '1'
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', data => log(service.id, service.color, data));
    child.stderr.on('data', data => log(service.id, RED, data));

    child.on('error', err => {
        console.error(`[${service.id}] Failed to start: ${err.message}`);
        serviceStatus[service.id] = 'error';
    });

    child.on('exit', code => {
        if (code !== 0 && code !== null) {
            console.error(`[${service.id}] Exited with code ${code}`);
            serviceStatus[service.id] = 'error';
        }
    });

    children.push(child);

    // Start healthcheck in background
    waitForReady(service);
}

function shutdown() {
    console.log(`\n${YELLOW}[ORCHESTRATOR]${RESET} Shutting down all services...`);
    children.forEach(child => {
        try {
            if (isWindows) {
                spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { shell: true });
            } else {
                child.kill('SIGTERM');
            }
        } catch (e) { /* already dead */ }
    });
    setTimeout(() => process.exit(0), 1000);
}

async function killProcessOnPort(port) {
    try {
        if (isWindows) {
            const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
            if (stdout) {
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    // Ignore PID 0 (System Idle Process) and check if it's a number
                    if (pid && pid !== '0' && /^\d+$/.test(pid)) {
                        try {
                            // Using taskkill /F /PID checks
                            await execPromise(`taskkill /F /PID ${pid}`);
                            console.log(`${YELLOW}[ORCHESTRATOR]${RESET} Killed PID ${pid} on port ${port}`);
                        } catch (e) {
                            // potentially already dead or access denied
                        }
                    }
                }
            }
        } else {
            await execPromise(`lsof -ti:${port} | xargs kill -9`);
        }
    } catch (e) {
        // Ignore checking errors (e.g. if netstat finds nothing)
    }
}

async function killPorts() {
    console.log(`${YELLOW}[ORCHESTRATOR]${RESET} Cleaning up ports...`);
    // Extract ports from SERVICES config
    const ports = SERVICES.map(s => {
        try {
            return new URL(s.url).port;
        } catch (e) { return null; }
    }).filter(Boolean);

    await Promise.all(ports.map(killProcessOnPort));
    // Small delay to ensure OS releases locks
    await new Promise(resolve => setTimeout(resolve, 1000));
}


async function main() {
    // Clear screen and show banner (skip in CI)
    if (!isCI) {
        console.clear();
        console.log('\x1b[36m' + BANNER + RESET);
    }

    await killPorts();

    console.log(`${YELLOW}[ORCHESTRATOR]${RESET} Starting services...\n`);

    // Print URLs first
    printUrls();

    // Start all services
    SERVICES.forEach(startService);

    // Handle shutdown
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log(`${DIM}Press Ctrl+C to stop all services.${RESET}\n`);
}

main();


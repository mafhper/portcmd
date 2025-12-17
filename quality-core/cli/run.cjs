/**
 * Quality Gate - Orchestrator
 * Integrates with existing PortCmd scripts
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const config = require('./config.cjs');

// ANSI Colors
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const results = [];
let startTime;

function log(msg, type = 'info') {
    const icons = { info: 'ℹ️ ', success: '✅', error: '❌', warn: '⚠️ ', header: '🚀', check: '🔍' };
    const colors = { info: c.cyan, success: c.green, error: c.red, warn: c.yellow, header: c.magenta + c.bold, check: c.blue };
    console.log(`${colors[type] || c.reset}${icons[type] || ''} ${msg}${c.reset}`);
}

function hr() { console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`); }
function formatDuration(ms) { return (ms / 1000).toFixed(2) + 's'; }

function runCommand(command, args = [], options = {}) {
    return new Promise((resolve) => {
        const start = Date.now();
        let output = '';
        const child = spawn(command, args, {
            cwd: config.paths.root,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            ...options,
        });
        child.stdout?.on('data', d => { output += d; if(options.stream) process.stdout.write(d); });
        child.stderr?.on('data', d => { output += d; if(options.stream) process.stderr.write(d); });
        child.on('close', code => resolve({ success: code === 0, exitCode: code, duration: Date.now() - start, output }));
    });
}

// Checks
async function checkIntegrity() {
    log('Running structure tests...', 'check');
    return runCommand('npm', ['run', 'test:structure']);
}

async function checkI18n() {
    log('Running i18n validation...', 'check');
    return runCommand('npm', ['run', 'test:i18n']);
}

async function checkLint() {
    log('Running lint...', 'check');
    return runCommand('npm', ['run', 'lint']);
}

async function checkBuild() {
    log('Running build...', 'check');
    return runCommand('npm', ['run', 'build']);
}

async function runQualityAuditApp() {
    log('Running Quality Audit: APP...', 'check');
    return runCommand('node', ['quality-core/cli/quality.cjs', '--target=app', '--quick']);
}

async function runQualityAuditPromo() {
    log('Running Quality Audit: PROMO...', 'check');
    return runCommand('node', ['quality-core/cli/quality.cjs', '--target=promo', '--quick']);
}

async function main() {
    startTime = Date.now();
    log('STARTING QUALITY GATE', 'header');
    
    const checks = [
        { name: 'Integrity', fn: checkIntegrity },
        { name: 'I18n', fn: checkI18n },
        { name: 'Lint', fn: checkLint },
        { name: 'Build', fn: checkBuild },
        { name: 'Quality: APP (Static)', fn: runQualityAuditApp },
        { name: 'Quality: PROMO (Static)', fn: runQualityAuditPromo }
    ];

    let failed = false;

    for (const check of checks) {
        const res = await check.fn();
        if (res.success) {
            log(`${check.name}: OK (${formatDuration(res.duration)})`, 'success');
        } else {
            log(`${check.name}: FAILED (${formatDuration(res.duration)})`, 'error');
            console.log(c.dim + res.output.substring(0, 500) + '...' + c.reset);
            failed = true;
        }
    }

    hr();
    log(failed ? 'QUALITY GATE FAILED' : 'QUALITY GATE PASSED', failed ? 'error' : 'success');
    process.exit(failed ? 1 : 0);
}

main();
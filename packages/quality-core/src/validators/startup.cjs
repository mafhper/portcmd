const { exec, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const ROOT_DIR = path.resolve(__dirname, '../../../../'); // specific to quality-core location

function log(msg) {
    console.log(`${CYAN}[Startup Check]${RESET} ${msg}`);
}

function checkUrl(url, timeout = 2000) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        req.on('error', () => resolve(false));
        req.setTimeout(timeout, () => {
            req.destroy();
            resolve(false);
        });
    });
}

function runCommand(cmd, cwd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (error, stdout, stderr) => {
            if (error) {
                return reject({ error, stderr });
            }
            resolve(stdout);
        });
    });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let runningProcesses = [];

function startProcess(cmd, args, cwd, name) {
    log(`Starting ${name}...`);
    const proc = spawn(cmd, args, { cwd, shell: true, stdio: 'ignore', detached: false });
    runningProcesses.push({ proc, name });
    return proc;
}

async function cleanup() {
    log('Cleaning up processes...');
    for (const { proc, name } of runningProcesses) {
        try {
            if (process.platform === 'win32') {
                exec(`taskkill /pid ${proc.pid} /T /F`);
            } else {
                process.kill(-proc.pid);
            }
        } catch (e) {
            // ignore
        }
    }
}

async function main() {
    try {
        log(`Checking root: ${ROOT_DIR}`);

        // 1. Check node_modules
        if (!fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
            throw new Error('node_modules missing. Run npm install first.');
        }
        log(`${GREEN}✔ node_modules present${RESET}`);

        // 2. Build
        log('Running build...');
        console.time('Build Time');
        await runCommand('npm run build', ROOT_DIR);
        console.timeEnd('Build Time');
        log(`${GREEN}✔ Build success${RESET}`);

        // 3. Start Servers
        // API
        startProcess('npm', ['run', 'dev:server'], ROOT_DIR, 'API Server');
        // App
        startProcess('npm', ['run', 'dev:client'], ROOT_DIR, 'Client App');
        // Website
        startProcess('npm', ['run', 'dev:website'], ROOT_DIR, 'Website');

        log('Waiting 10s for services to stabilize...');
        await sleep(10000);

        // 4. Verify Endpoints
        const apiUp = await checkUrl('http://localhost:3001/'); // Base route returns 200 text
        const appUp = await checkUrl('http://localhost:5173/portcmd/app/');
        const webUp = await checkUrl('http://localhost:5174/portcmd/');

        if (!apiUp) throw new Error('API Server failed to respond at http://localhost:3001/');
        if (!appUp) throw new Error('Client App failed to respond at http://localhost:5173/portcmd/app/');
        if (!webUp) throw new Error('Website failed to respond at http://localhost:5174/portcmd/');

        log(`${GREEN}✔ All systems operational${RESET}`);

        // Report Logic (simplified for now, ideally writes to json)
        console.log(JSON.stringify({
            status: 'pass',
            details: {
                api: apiUp,
                app: appUp,
                website: webUp
            }
        }, null, 2));

    } catch (error) {
        log(`${RED}✘ Verification Failed:${RESET} ${error.message}`);
        if (error.stderr) console.error(error.stderr);
        process.exitCode = 1;
    } finally {
        await cleanup();
    }
}

main();

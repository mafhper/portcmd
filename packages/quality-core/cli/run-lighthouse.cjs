/**
 * Performance Test - Lighthouse CLI Runner (Otimizado)
 * 
 * Melhorias:
 * - Detecção mais robusta de servidor (ping real ao HTML)
 * - Retry automático para Lighthouse
 * - Melhor gestão de processos e cleanup
 * - Validação de pré-requisitos
 * - Logs mais informativos
 * - Timeout configurável por fase
 * 
 * @version 2.0.0
 */

const readline = require('readline');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

// ========================================
// CONFIGURAÇÃO
// ========================================
const CONFIG = {
    port: 5175,
    targets: {
        app: {
            url: `http://127.0.0.1:5175/portcmd/app/`,
            name: 'app'
        },
        promo: {
            url: `http://127.0.0.1:5175/portcmd/`,
            name: 'promo'
        }
    },
    outputDir: path.resolve(__dirname, '../../../performance-reports/lighthouse'),
    categories: ['performance', 'accessibility', 'best-practices', 'seo'],

    // Timeouts em ms
    timeouts: {
        serverStart: 90000,      // 90s para iniciar servidor
        serverPing: 5000,        // 5s por tentativa de ping
        lighthouseRun: 180000,   // 3min por execução Lighthouse
    },

    // Retry configs
    retry: {
        lighthouse: 2,           // Tentativas para Lighthouse
        serverPing: 3,           // Tentativas para cada ping
    },

    // Vite config
    vite: {
        command: 'dev:client',
        args: ['--port', '5173', '--strictPort', '--host'],
    },
};

// ========================================
// UTILITÁRIOS
// ========================================
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    magenta: '\x1b[35m',
};

function log(msg, type = 'info') {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warn: '⚠️',
        wait: '⏳',
        debug: '🔍',
    };
    const colors = {
        info: c.cyan,
        success: c.green,
        error: c.red,
        warn: c.yellow,
        wait: c.dim,
        debug: c.magenta,
    };
    console.log(`${colors[type]}${icons[type]} ${msg}${c.reset}`);
}

function formatTime(ms) {
    return `${(ms / 1000).toFixed(1)}s`;
}

// ========================================
// VALIDAÇÃO DE PRÉ-REQUISITOS
// ========================================
function checkPrerequisites() {
    log('Validando pré-requisitos...', 'wait');

    // Verifica Node.js version
    const nodeVersion = process.version;
    log(`Node.js: ${nodeVersion}`, 'debug');

    // Verifica se Lighthouse está instalado
    try {
        const lighthouseCmd = process.platform === 'win32' ? 'lighthouse.cmd' : 'lighthouse';
        execSync(`${lighthouseCmd} --version`, { stdio: 'pipe' });
        log('Lighthouse CLI encontrado', 'success');
    } catch (err) {
        log('Lighthouse CLI não encontrado. Instale com: npm install -g lighthouse', 'error');
        return false;
    }

    // Verifica se Chrome está disponível (Windows check)
    if (process.platform === 'win32') {
        try {
            execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe"', { stdio: 'pipe' });
            log('Chrome encontrado', 'success');
        } catch (err) {
            log('Chrome não encontrado (pode causar problemas)', 'warn');
        }
    }

    return true;
}

// ========================================
// GESTÃO DE SERVIDOR
// ========================================
// ========================================
// GESTÃO DE SERVIDOR (STATIC NODE SERVER)
// ========================================

/**
 * Creates a static file server that correctly serves the dist folder
 * mapping /portcmd/app/* to dist/app/* paths and /portcmd/* to dist/*
 */
/**
 * Creates a static file server that correctly serves the dist folder
 * mapping /portcmd/app/* to dist/app/* paths and /portcmd/* to dist/*
 */
function createStaticServer(projectRoot, port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            // Remove query string and decode URI
            let urlPath = decodeURIComponent(req.url.split('?')[0]);
            const distPath = path.join(projectRoot, 'dist');
            const hasAppDir = fs.existsSync(path.join(distPath, 'app'));

            // Map paths correctly for GitHub Pages structure
            let filePath;

            if (urlPath.startsWith('/portcmd/app/') && hasAppDir) {
                // If dist/app exists, use it
                filePath = path.join(distPath, 'app', urlPath.replace('/portcmd/app/', '/'));
            } else if (urlPath.startsWith('/portcmd/app/')) {
                // SPA Route: Map /portcmd/app/* to dist/* (flat structure)
                // We strip the prefix to find assets
                filePath = path.join(distPath, urlPath.replace('/portcmd/app/', '/'));
            } else if (urlPath.startsWith('/portcmd/')) {
                // Root Route: Map /portcmd/* to dist/*
                filePath = path.join(distPath, urlPath.replace('/portcmd/', '/'));
            } else {
                // Fallback to dist root
                filePath = path.join(distPath, urlPath);
            }

            // Default to index.html for root or directory requests
            if (filePath.endsWith(path.sep) || filePath.endsWith('/') || !path.extname(filePath)) {
                // If it doesn't have an extension, it might be a directory or an SPA route
                let potentialIndex = path.join(filePath, 'index.html');

                // If we mapped /portcmd/app/ to dist/app/ and it's missing, or we're in /portcmd/app/
                // and it doesn't have its own index.html, we might need a fallback
                if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                    filePath = potentialIndex;
                } else if (!path.extname(filePath)) {
                    // Start of SPA fallback logic - if it's a dir without index, maybe it's a route
                    filePath = potentialIndex;
                }
            }

            const normalizedPath = path.normalize(filePath);

            // Security check - prevent directory traversal
            if (!normalizedPath.startsWith(distPath)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            fs.readFile(normalizedPath, (err, data) => {
                if (err) {
                    // Try with index.html for SPA routing (App fallback)
                    // If the specific file (e.g. assets) is missing, this might return index.html (which is ok for routes, bad for assets)
                    // Better to only fallback if it looks like a page navigation (no ext)
                    if (urlPath.startsWith('/portcmd/app/') && !path.extname(urlPath)) {
                        const indexPath = hasAppDir
                            ? path.join(distPath, 'app/index.html')
                            : path.join(distPath, 'index.html');

                        fs.readFile(indexPath, (err2, indexData) => {
                            if (err2) {
                                res.writeHead(404);
                                res.end(`Not Found: ${urlPath} (SPA Fallback failed)`);
                            } else {
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.end(indexData);
                            }
                        });
                    } else {
                        res.writeHead(404);
                        res.end(`Not Found: ${urlPath}`);
                    }
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

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                log(`Porta ${port} em uso. Tentando liberar...`, 'warn');
                try {
                    // Try to kill process on port (Windows)
                    execSync(`npx kill-port ${port}`);
                    log(`Porta ${port} liberada. Tentando novamente em 1s...`, 'info');
                    setTimeout(() => {
                        server.close();
                        server.listen(port, '127.0.0.1');
                    }, 1000);
                } catch (e) {
                    reject(err);
                }
            } else {
                reject(err);
            }
        });

        server.listen(port, '127.0.0.1', () => {
            log(`Servidor estático iniciado na porta ${port}`, 'success');
            resolve(server);
        });
    });
}

function ensureDistExists() {
    const distPath = path.resolve(__dirname, '../../../dist');
    if (!fs.existsSync(distPath) || fs.readdirSync(distPath).length === 0) {
        log('Diretório dist/ não encontrado ou vazio. Executando build...', 'warn');
        try {
            execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '../../../') });
            log('Build concluído com sucesso!', 'success');
        } catch (e) {
            log('Falha ao executar build. Abortando.', 'error');
            process.exit(1);
        }
    }
}

async function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = http.createServer();
        server.once('error', (err) => {
            server.close();
            resolve(err.code === 'EADDRINUSE');
        });
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        server.listen(port);
    });
}

async function startServer() {
    ensureDistExists();

    // Check port usage before starting
    const inUse = await isPortInUse(CONFIG.port);
    if (inUse) {
        log(`Porta ${CONFIG.port} ocupada. Tentando encerrar processo anterior...`, 'warn');
        try {
            execSync(`npx kill-port ${CONFIG.port}`);
            // Wait a bit
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            log('Não foi possível liberar a porta automaticamente.', 'warn');
        }
    }

    return createStaticServer(path.resolve(__dirname, '../../../'), CONFIG.port);
}

async function stopServer(serverInstance) {
    if (!serverInstance) return;
    log('Encerrando servidor...', 'wait');
    await new Promise((resolve) => {
        serverInstance.close((err) => {
            if (err) log('Erro ao fechar servidor: ' + err.message, 'warn');
            resolve();
        });
    });

    // Force kill port to be sure
    try {
        execSync(`npx kill-port ${CONFIG.port}`, { stdio: 'ignore' });
        log('Porta liberada (Kill Port enforcement)', 'debug');
    } catch { /* ignore */ }

    log('Servidor parado.', 'success');
}

// ========================================
// LIGHTHOUSE EXECUTION
// ========================================
async function runLighthouse(url, targetName, formFactor, attempt = 1) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `lighthouse_${targetName}_${formFactor}_${timestamp}.json`;
    const outputPath = path.join(CONFIG.outputDir, filename);

    console.log(`\n${c.cyan}📦 Executando Lighthouse (${targetName} - ${formFactor}) - Tentativa ${attempt}${c.reset}`);

    const args = [
        url,
        '--output=json',
        `--output-path=${outputPath}`,
        `--form-factor=${formFactor}`,
        '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage --disable-gpu"',
        '--only-categories=' + CONFIG.categories.join(','),
        '--quiet',
    ];

    // Configurações específicas por device
    if (formFactor === 'mobile') {
        args.push('--preset=perf');
    } else {
        args.push('--screenEmulation.disabled');
        args.push('--throttling.cpuSlowdownMultiplier=1');
    }

    return new Promise((resolve) => {
        let lighthouseCmd;
        const localBin = process.platform === 'win32'
            ? path.resolve('node_modules/.bin/lighthouse.cmd')
            : path.resolve('node_modules/.bin/lighthouse');

        if (fs.existsSync(localBin)) {
            lighthouseCmd = localBin;
            // log('Using local lighthouse binary', 'debug');
        } else {
            lighthouseCmd = process.platform === 'win32' ? 'lighthouse.cmd' : 'lighthouse';
        }

        let stderr = '';

        const child = spawn(lighthouseCmd, args, {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        // Timeout para matar processo travado
        const processTimeout = setTimeout(() => {
            log('Timeout! Encerrando Lighthouse...', 'warn');
            child.kill('SIGKILL');
        }, CONFIG.timeouts.lighthouseRun);

        // Progress spinner
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        const spinner = setInterval(() => {
            if (process.stdout.isTTY) {
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`   ${frames[i++ % frames.length]} Analisando performance...`);
            }
        }, 150);

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        const cleanup = () => {
            clearInterval(spinner);
            clearTimeout(processTimeout);
            if (process.stdout.isTTY) {
                readline.cursorTo(process.stdout, 0);
                readline.clearLine(process.stdout, 0);
            }
        };

        child.on('close', (code) => {
            cleanup();

            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

                    // Valida que o report tem dados válidos
                    if (!report.categories || !report.audits) {
                        throw new Error('Report incompleto');
                    }

                    const scores = CONFIG.categories.reduce((acc, cat) => {
                        acc[cat] = Math.round((report.categories[cat]?.score || 0) * 100);
                        return acc;
                    }, {});

                    // Inject metadata into report
                    report.metadata = {
                        target: targetName,
                        formFactor,
                        timestamp: Date.now()
                    };
                    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

                    resolve({
                        success: true,
                        path: outputPath,
                        scores,
                        attempt,
                    });
                } catch (e) {
                    resolve({
                        success: false,
                        error: `JSON inválido: ${e.message}`,
                        canRetry: true,
                    });
                }
            } else {
                // Analisa erro
                let errorMsg = `Processo falhou (code: ${code})`;
                let canRetry = true;

                if (stderr.includes('ENOENT') || stderr.includes('not found')) {
                    errorMsg = 'Lighthouse CLI não encontrado (npm install -g lighthouse)';
                    canRetry = false;
                } else if (stderr.includes('No usable sandbox') || stderr.includes('Chrome')) {
                    errorMsg = 'Chrome não encontrado ou falhou ao iniciar';
                    canRetry = true;
                } else if (stderr.includes('ERR_CONNECTION_REFUSED') || stderr.includes('ECONNREFUSED')) {
                    errorMsg = 'Servidor não acessível';
                    canRetry = false;
                } else if (stderr.includes('timeout') || stderr.includes('TIMEOUT')) {
                    errorMsg = 'Timeout durante análise';
                    canRetry = true;
                } else if (stderr.length > 0) {
                    const lines = stderr.split('\n').filter(l => l.trim());
                    errorMsg = lines[lines.length - 1]?.substring(0, 120) || errorMsg;
                }

                resolve({ success: false, error: errorMsg, canRetry });
            }
        });

        child.on('error', (err) => {
            cleanup();
            resolve({
                success: false,
                error: `Erro ao executar: ${err.message}`,
                canRetry: err.code !== 'ENOENT',
            });
        });
    });
}

async function runLighthouseWithRetry(url, targetName, formFactor) {
    for (let attempt = 1; attempt <= CONFIG.retry.lighthouse; attempt++) {
        const result = await runLighthouse(url, targetName, formFactor, attempt);

        if (result.success) {
            return result;
        }

        if (!result.canRetry || attempt === CONFIG.retry.lighthouse) {
            return result;
        }

        log(`Tentativa ${attempt} falhou: ${result.error}. Tentando novamente...`, 'warn');
        await new Promise(r => setTimeout(r, 3000)); // Aguarda 3s entre tentativas
    }
}

// ========================================
// MAIN
// ========================================
async function main() {
    console.log(`${c.bold}🚀 Performance Test Automation v2.0 (Multi-Target)${c.reset}\n`);

    const startTime = Date.now();

    // Validação
    if (!checkPrerequisites()) {
        process.exit(1);
    }

    // Cria diretório de output
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        log(`Diretório criado: ${CONFIG.outputDir}`, 'debug');
    }

    let serverProcess = null;
    let serverStartedByScript = false;

    try {
        // Verifica se servidor já está rodando
        const portInUse = await isPortInUse(CONFIG.port);

        if (!portInUse) {
            serverProcess = await startServer();
            serverStartedByScript = true;
        } else {
            log(`Servidor já rodando na porta ${CONFIG.port}`, 'info');
            // If already running, we assume it's good, but we can't control it.
            // Ideally we shouldn't run tests if we cannot control path mapping.
            log('⚠️ Aviso: Usando servidor externo. Certifique-se que ele serve /dist corretamente.', 'warn');
        }

        // Aguarda estabilização (pequeno delay pra garantir que socket abriu)
        await new Promise(r => setTimeout(r, 1000));


        // Executa testes para todos os targets e fatores
        const results = [];
        const targets = Object.keys(CONFIG.targets);

        for (const targetName of targets) {
            const target = CONFIG.targets[targetName];
            log(`👉 Iniciando testes para target: ${targetName.toUpperCase()} (${target.url})`, 'info');

            for (const factor of ['mobile', 'desktop']) {
                const res = await runLighthouseWithRetry(target.url, targetName, factor);
                results.push({ target: targetName, factor, ...res });

                if (res.success) {
                    const emoji = res.scores.performance >= 90 ? '🎉' : res.scores.performance >= 50 ? '👍' : '⚠️';
                    log(
                        `${targetName.toUpperCase()} [${factor.toUpperCase()}] ${emoji}: ` +
                        `Perf ${res.scores.performance} | ` +
                        `A11y ${res.scores.accessibility} | ` +
                        `BP ${res.scores['best-practices']} | ` +
                        `SEO ${res.scores.seo}`,
                        'success'
                    );
                } else {
                    log(`${targetName.toUpperCase()} [${factor.toUpperCase()}]: Falhou - ${res.error}`, 'error');
                }
            }
        }

        // Resumo final
        const successCount = results.filter(r => r.success).length;
        const totalTime = Date.now() - startTime;

        console.log(`\n${c.bold}📊 Resumo${c.reset}`);
        console.log(`   Sucessos: ${successCount}/${results.length}`);
        console.log(`   Tempo total: ${formatTime(totalTime)}`);
        console.log(`   Reports em: ${CONFIG.outputDir}`);

        // Cleanup
        if (serverStartedByScript && serverProcess) {
            await stopServer(serverProcess);
            log('Servidor encerrado', 'success');
        }

        // Exit code
        process.exit(successCount === results.length ? 0 : 1);

    } catch (error) {
        log(`Erro fatal: ${error.message}`, 'error');

        // Cleanup forçado
        if (serverStartedByScript && serverProcess) {
            try {
                await stopServer(serverProcess);
            } catch (cleanupErr) {
                log(`Erro no cleanup: ${cleanupErr.message}`, 'warn');
            }
        }

        process.exit(1);
    }
}

// Tratamento de sinais para cleanup
// Tratamento de sinais para cleanup
process.on('SIGINT', async () => {
    log('\nInterrompido pelo usuário. Limpando porta...', 'warn');
    try { execSync(`npx kill-port ${CONFIG.port}`, { stdio: 'ignore' }); } catch { }
    process.exit(130);
});

process.on('SIGTERM', async () => {
    log('\nEncerrando. Limpando porta...', 'warn');
    try { execSync(`npx kill-port ${CONFIG.port}`, { stdio: 'ignore' }); } catch { }
    process.exit(143);
});

// Executa
main().catch((err) => {
    log(`Erro não tratado: ${err.message}`, 'error');
    console.error(err);
    process.exit(1);
});

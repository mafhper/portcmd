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

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ========================================
// CONFIGURAÇÃO
// ========================================
const CONFIG = {
    port: 5173,
    getUrl: () => `http://localhost:${CONFIG.port}/portcmd/app/`,
    outputDir: path.resolve(__dirname, '../../performance-reports/lighthouse'),
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
async function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = http.createServer();

        const onError = (err) => {
            server.close();
            resolve(err.code === 'EADDRINUSE');
        };

        const onListening = () => {
            server.close();
            resolve(false);
        };

        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port);
    });
}

async function pingServer(url, timeout = CONFIG.timeouts.serverPing) {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            req.destroy();
            resolve(false);
        }, timeout);

        const req = http.get(url, (res) => {
            clearTimeout(timeoutId);
            // Aceita 200-299 ou 404 (app com routing)
            const isOk = (res.statusCode >= 200 && res.statusCode < 300) || res.statusCode === 404;

            // Consome response para liberar socket
            res.resume();
            resolve(isOk);
        }).on('error', () => {
            clearTimeout(timeoutId);
            resolve(false);
        });
    });
}

async function waitForServer(url) {
    const startTime = Date.now();
    const maxTime = CONFIG.timeouts.serverStart;
    let attempts = 0;

    log('Aguardando servidor responder...', 'wait');

    while (Date.now() - startTime < maxTime) {
        attempts++;

        // Tenta ping com retry
        let pingSuccess = false;
        for (let i = 0; i < CONFIG.retry.serverPing; i++) {
            pingSuccess = await pingServer(url);
            if (pingSuccess) break;
            await new Promise(r => setTimeout(r, 500));
        }

        if (pingSuccess) {
            const elapsed = Date.now() - startTime;
            log(`Servidor respondeu após ${formatTime(elapsed)} (${attempts} tentativas)`, 'success');
            // Aguarda mais um pouco para estabilizar
            await new Promise(r => setTimeout(r, 2000));
            return true;
        }

        // Feedback visual
        if (attempts % 3 === 0) {
            const elapsed = Date.now() - startTime;
            process.stdout.write(`\r   ⏳ Tentativa ${attempts} (${formatTime(elapsed)})...`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    process.stdout.write('\r                                        \r');
    return false;
}

function startServer() {
    log(`Iniciando servidor Vite na porta ${CONFIG.port}...`, 'wait');

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = ['run', CONFIG.vite.command, '--', ...CONFIG.vite.args];

    const child = spawn(npmCmd, args, {
        cwd: path.resolve(__dirname, '../../'),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: false,
    });

    // Captura logs do servidor para debug
    child.stdout?.on('data', (data) => {
        const line = data.toString();
        if (line.includes('Local:') || line.includes('ready in')) {
            log('Vite iniciado', 'debug');
        }
    });

    child.stderr?.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('EADDRINUSE')) {
            log('Porta já em uso!', 'error');
        } else if (msg.toLowerCase().includes('error')) {
            log(`Erro no servidor: ${msg.substring(0, 100)}`, 'warn');
        }
    });

    child.on('error', (err) => {
        log(`Erro ao iniciar servidor: ${err.message}`, 'error');
    });

    return child;
}

async function stopServer(serverProcess) {
    if (!serverProcess || !serverProcess.pid) {
        return;
    }

    log('Encerrando servidor...', 'wait');

    return new Promise((resolve) => {
        // Tenta SIGTERM primeiro
        try {
            process.kill(serverProcess.pid, 'SIGTERM');
        } catch (err) {
            if (err.code === 'ESRCH') {
                // Processo já morreu
                resolve();
                return;
            }
        }

        // Aguarda até 3s para encerrar gracefully
        const timeout = setTimeout(() => {
            try {
                process.kill(serverProcess.pid, 'SIGKILL');
            } catch (err) {
                // Ignora se já morreu
            }
            resolve();
        }, 3000);

        serverProcess.on('exit', () => {
            clearTimeout(timeout);
            resolve();
        });
    });
}

// ========================================
// LIGHTHOUSE EXECUTION
// ========================================
async function runLighthouse(url, formFactor, attempt = 1) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `lighthouse_${formFactor}_${timestamp}.json`;
    const outputPath = path.join(CONFIG.outputDir, filename);

    console.log(`\n${c.cyan}📦 Executando Lighthouse (${formFactor}) - Tentativa ${attempt}${c.reset}`);

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
        const lighthouseCmd = process.platform === 'win32' ? 'lighthouse.cmd' : 'lighthouse';
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
            process.stdout.write(`\r   ${frames[i++ % frames.length]} Analisando performance...`);
        }, 100);

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        const cleanup = () => {
            clearInterval(spinner);
            clearTimeout(processTimeout);
            process.stdout.write('\r                                   \r');
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

async function runLighthouseWithRetry(url, formFactor) {
    for (let attempt = 1; attempt <= CONFIG.retry.lighthouse; attempt++) {
        const result = await runLighthouse(url, formFactor, attempt);

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
    console.log(`${c.bold}🚀 Performance Test Automation v2.0${c.reset}\n`);

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
            serverProcess = startServer();
            serverStartedByScript = true;
        } else {
            log(`Servidor já rodando na porta ${CONFIG.port}`, 'info');
        }

        // Aguarda servidor responder
        const serverReady = await waitForServer(CONFIG.getUrl());

        if (!serverReady) {
            throw new Error(`Timeout: Servidor não respondeu após ${formatTime(CONFIG.timeouts.serverStart)}`);
        }

        // Executa testes
        const results = [];
        for (const factor of ['mobile', 'desktop']) {
            const res = await runLighthouseWithRetry(CONFIG.getUrl(), factor);
            results.push({ factor, ...res });

            if (res.success) {
                const emoji = res.scores.performance >= 90 ? '🎉' : res.scores.performance >= 50 ? '👍' : '⚠️';
                log(
                    `${factor.toUpperCase()} ${emoji}: ` +
                    `Perf ${res.scores.performance} | ` +
                    `A11y ${res.scores.accessibility} | ` +
                    `BP ${res.scores['best-practices']} | ` +
                    `SEO ${res.scores.seo}`,
                    'success'
                );
                log(`Report: ${res.path}`, 'debug');
            } else {
                log(`${factor.toUpperCase()}: Falhou - ${res.error}`, 'error');
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
process.on('SIGINT', async () => {
    log('\nInterrompido pelo usuário', 'warn');
    process.exit(130);
});

process.on('SIGTERM', async () => {
    log('\nEncerrando...', 'warn');
    process.exit(143);
});

// Executa
main().catch((err) => {
    log(`Erro não tratado: ${err.message}`, 'error');
    console.error(err);
    process.exit(1);
});

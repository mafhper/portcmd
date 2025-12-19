/**
 * Quality Gate UI - Console styling and utilities
 * Zero dependencies, TTY-aware, CI-compatible
 */
const readline = require('readline');
const pkg = require('../package.json');

module.exports = function createUI({ ci = false } = {}) {
    const isTTY = process.stdout.isTTY && !ci;

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
        gray: '\x1b[90m',
        white: '\x1b[37m',
    };

    // Themes by domain
    const theme = {
        quality: c.cyan,
        perf: c.magenta,
        infra: c.blue,
        build: c.yellow,
        success: c.green,
        error: c.red,
    };

    // Spinner
    let spinnerTimer;
    let spinnerIndex = 0;
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    function clear() {
        if (isTTY) process.stdout.write('\x1b[2J\x1b[H');
    }

    function banner() {
        console.log(c.bold + c.cyan + `
                                                
                                                
▄█████▄ ██  ██ ▄████▄ ██     ██ ██████ ██  ██   
██ ▄ ██ ██  ██ ██▄▄██ ██     ██   ██    ▀██▀    
▀█████▀ ▀████▀ ██  ██ ██████ ██   ██     ██     
     ▀▀                                         
                                                
                                                
▄█████ ▄████▄ █████▄  ██████                    
██     ██  ██ ██▄▄██▄ ██▄▄                      
▀█████ ▀████▀ ██   ██ ██▄▄▄▄                    
                                                
` + c.reset);
        console.log(`${c.dim}                          v${pkg.version}${c.reset}\n`);
    }

    function startSpinner(text) {
        if (!isTTY) return;
        stopSpinner();
        spinnerTimer = setInterval(() => {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
                `${c.dim}${frames[spinnerIndex++ % frames.length]} ${text}${c.reset}`
            );
        }, 80);
    }

    function stopSpinner() {
        if (spinnerTimer) {
            clearInterval(spinnerTimer);
            spinnerTimer = null;
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
        }
    }

    function log(msg, { color = c.reset, icon = '' } = {}) {
        stopSpinner();
        console.log(`${color}${icon ? icon + ' ' : ''}${msg}${c.reset}`);
    }

    function hr() {
        console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`);
    }

    function formatDuration(ms) {
        const s = Math.floor(ms / 1000);
        const msR = ms % 1000;
        return s ? `${s}.${String(msR).padStart(3, '0')}s` : `${ms}ms`;
    }

    function renderTable(headers, rows) {
        const widths = headers.map((h, i) =>
            Math.max(h.length, ...rows.map(r => String(r.cells[i]).length))
        );

        const line = (cells) =>
            cells.map((cell, i) => String(cell).padEnd(widths[i])).join('  ');

        console.log(c.bold + line(headers) + c.reset);
        console.log(c.dim + widths.map(w => '─'.repeat(w)).join('  ') + c.reset);

        rows.forEach(row => {
            const color = row.success ? c.green : c.red;
            console.log(color + line(row.cells) + c.reset);
        });
    }

    function renderGroupedSummary(results) {
        const groups = {};

        for (const r of results) {
            groups[r.domain] ??= [];
            groups[r.domain].push(r);
        }

        for (const [domain, items] of Object.entries(groups)) {
            log(domain.toUpperCase(), { color: theme[domain] || c.white, icon: '●' });

            items.forEach(r => {
                const color = r.success ? c.green : c.red;
                console.log(
                    color +
                    `  ${r.success ? '✓' : '✗'} ${r.name.padEnd(25)} ${formatDuration(r.duration)}` +
                    c.reset
                );
            });

            hr();
        }
    }

    return {
        c,
        theme,
        clear,
        banner,
        startSpinner,
        stopSpinner,
        log,
        hr,
        formatDuration,
        renderTable,
        renderGroupedSummary,
        isTTY,
    };
};

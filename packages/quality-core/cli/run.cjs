/**
 * Quality Gate - Orchestrator
 * Rich console UX with spinner, banner, grouped summary, and export
 */

const { spawn } = require('child_process');
const config = require('./config.cjs');
const createUI = require('./ui.cjs');
const exporter = require('./export.cjs');
const writeBadge = require('./badge.cjs');

// Parse CLI flags
const args = process.argv.slice(2);
const FLAGS = {
    ci: args.includes('--ci') || process.env.CI === 'true',
    json: args.includes('--json'),
    md: args.includes('--md'),
    badge: args.includes('--badge'),
    verbose: args.includes('--verbose') || args.includes('-v'),
};

// Initialize UI
const ui = createUI({ ci: FLAGS.ci });

const results = [];
let startTime;

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

        child.stdout?.on('data', d => {
            output += d;
            if (options.stream) process.stdout.write(d);
        });

        child.stderr?.on('data', d => {
            output += d;
            if (options.stream) process.stderr.write(d);
        });

        child.on('close', code => {
            resolve({
                success: code === 0,
                exitCode: code,
                duration: Date.now() - start,
                output,
            });
        });
    });
}

/**
 * Check definitions organized into parallelizable phases
 * Phase 1: Independent checks (can run in parallel)
 * Phase 2: Build (depends on lint passing for best results)
 * Phase 3: Quality audits (depends on build, can run in parallel with each other)
 */
const phases = [
    {
        name: 'Pre-build Checks',
        parallel: true,
        checks: [
            { name: 'Integrity', domain: 'infra', fn: () => runCommand('npm', ['run', 'test:structure']) },
            { name: 'I18n', domain: 'quality', fn: () => runCommand('npm', ['run', 'test:i18n']) },
            { name: 'Lint', domain: 'quality', fn: () => runCommand('npm', ['run', 'lint']) },
        ]
    },
    {
        name: 'Build',
        parallel: false,
        checks: [
            { name: 'Build', domain: 'build', fn: () => runCommand('npm', ['run', 'build']) },
        ]
    },
    {
        name: 'Quality Audits',
        parallel: true,
        checks: [
            { name: 'Quality: APP', domain: 'quality', fn: () => runCommand('node', ['packages/quality-core/cli/quality.cjs', '--target=app'], { env: { ...process.env, PORT: '4174' } }) },
            { name: 'Quality: PROMO', domain: 'quality', fn: () => runCommand('node', ['packages/quality-core/cli/quality.cjs', '--target=promo'], { env: { ...process.env, PORT: '4175' } }) },
        ]
    }
];

async function runPhase(phase) {
    const phaseResults = [];

    if (phase.parallel && phase.checks.length > 1) {
        // Run all checks in this phase in parallel
        const promises = phase.checks.map(async (check) => {
            const res = await check.fn();
            return { name: check.name, domain: check.domain, ...res };
        });

        const results = await Promise.all(promises);
        phaseResults.push(...results);
    } else {
        // Run checks sequentially
        for (const check of phase.checks) {
            const res = await check.fn();
            phaseResults.push({ name: check.name, domain: check.domain, ...res });
        }
    }

    return phaseResults;
}

async function main() {
    startTime = Date.now();

    // Clear screen and show banner
    ui.clear();
    ui.banner();

    let failed = false;

    // Run each phase
    for (const phase of phases) {
        if (phase.parallel && phase.checks.length > 1) {
            // Show parallel execution indicator
            ui.startSpinner(`Running ${phase.checks.length} checks in parallel: ${phase.checks.map(c => c.name).join(', ')}`);
        }

        const phaseResults = await runPhase(phase);

        if (phase.parallel && phase.checks.length > 1) {
            ui.stopSpinner();
        }

        // Process results
        for (const res of phaseResults) {
            results.push(res);

            if (res.success) {
                ui.log(
                    `${res.name} OK (${ui.formatDuration(res.duration)})`,
                    { icon: '✓', color: ui.theme.success }
                );
            } else {
                ui.log(
                    `${res.name} FAILED (${ui.formatDuration(res.duration)})`,
                    { icon: '✗', color: ui.theme.error }
                );

                if (FLAGS.verbose && res.output) {
                    console.log(ui.c.dim + res.output.substring(0, 500) + '...' + ui.c.reset);
                }

                failed = true;
            }
        }

        // If a phase failed and it's critical (like Build), we could optionally stop
        // For now, we continue to show all results
    }

    // Summary
    ui.hr();
    ui.renderGroupedSummary(results);

    // Export if requested
    const meta = {
        failed,
        duration: ui.formatDuration(Date.now() - startTime),
        format: ui.formatDuration,
    };

    if (FLAGS.json) {
        const file = exporter.exportJSON(results, meta);
        ui.log(`Report saved: ${file}`, { color: ui.c.dim });
    }

    if (FLAGS.md) {
        const file = exporter.exportMarkdown(results, meta);
        ui.log(`Report saved: ${file}`, { color: ui.c.dim });
    }

    if (FLAGS.badge) {
        const file = writeBadge({ failed, duration: meta.duration });
        ui.log(`Badge saved: ${file}`, { color: ui.c.dim });
    }

    // Final status
    ui.hr();
    const totalTime = ui.formatDuration(Date.now() - startTime);

    if (failed) {
        ui.log(`QUALITY GATE FAILED (${totalTime})`, { icon: '✗', color: ui.theme.error });
    } else {
        ui.log(`QUALITY GATE PASSED (${totalTime})`, { icon: '✓', color: ui.theme.success });
    }

    process.exit(failed ? 1 : 0);
}

main();
const { execSync } = require('child_process');

function runCmd(cmd, cwd) {
    try {
        execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
        return { success: true };
    } catch (e) {
        return { success: false, output: e.stdout + e.stderr };
    }
}

module.exports = {
    name: 'lint',

    async run(ctx) {
        const root = ctx.projectRoot;
        const errors = [];

        // ESLint
        const eslint = runCmd('npx eslint . --quiet', root);
        if (!eslint.success) {
            errors.push({ tool: 'eslint', message: 'ESLint found issues', details: eslint.output });
        }

        // TSC
        const tsc = runCmd('npx tsc --noEmit', root);
        if (!tsc.success) {
            errors.push({ tool: 'tsc', message: 'TypeScript compilation failed', details: tsc.output });
        }

        return {
            status: errors.length ? 'fail' : 'ok',
            data: { errorCount: errors.length, errors }
        };
    }
};

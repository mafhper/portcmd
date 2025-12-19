const { execSync } = require('child_process');

function run(cmd) {
    try {
        execSync(cmd, { stdio: 'pipe' });
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    name: 'lint',

    async run() {
        const errors = [];

        if (!run('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0')) {
            errors.push('eslint');
        }

        // Only run tsc if tsconfig exists
        if (run('ls tsconfig.json')) {
            if (!run('npx tsc --noEmit')) {
                errors.push('tsc');
            }
        }

        const passed = errors.length === 0;
        return {
            status: passed ? 'ok' : 'fail',
            score: passed ? 100 : 0,
            raw: { errors }
        };
    }
};

/**
 * Quality Alert Engine
 * Analyzes quality reports to detect regressions, new violations, and threshold breaches.
 */

export const AlertEngine = {
    /**
     * Analyze a report against a baseline (previous report) and rules.
     * @param {Object} current - The current canonical quality report.
     * @param {Object} [previous] - The previous quality report (optional).
     * @param {Object} rules - Configuration for alerts.
     */
    analyze(current, previous, rules = {}) {
        const alerts = [];

        // 1. Threshold Check (Status)
        if (current.summary.status === 'fail') {
            alerts.push({
                type: 'status_fail',
                level: 'error',
                message: 'Quality Gate Failed',
                details: 'The overall quality status is FAIL.'
            });
        }

        // 2. Score Regression (if previous exists)
        if (previous && rules.scoreRegressionThreshold) {
            const diff = current.summary.score - previous.summary.score;
            if (diff < -rules.scoreRegressionThreshold) {
                alerts.push({
                    type: 'score_regression',
                    level: 'warn',
                    message: `Score dropped by ${Math.abs(diff)} points`,
                    details: `Previous: ${previous.summary.score}, Current: ${current.summary.score}`
                });
            }
        }

        // 3. New Violations
        if (previous) {
            const currentIds = new Set(current.violations.map(v => getViolationId(v)));
            const prevIds = new Set(previous.violations.map(v => getViolationId(v)));

            const newViolations = current.violations.filter(v => !prevIds.has(getViolationId(v)));

            if (newViolations.length > 0) {
                alerts.push({
                    type: 'new_violations',
                    level: 'warn',
                    message: `${newViolations.length} new violations detected`,
                    details: newViolations.map(v => `${v.area}:${v.metric}`).join(', ')
                });
            }
        }

        return alerts;
    }
};

function getViolationId(v) {
    return `${v.area}::${v.metric}::${v.selector || ''}`;
}

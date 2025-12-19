/**
 * Quality Diff Engine
 * Compares two quality reports and generates a structured diff.
 */

export const DiffEngine = {
    /**
     * Compare two reports.
     * @param {Object} current 
     * @param {Object} previous 
     */
    compare(current, previous) {
        if (!previous) return null;

        return {
            summary: {
                scoreDiff: current.summary.score - previous.summary.score,
                statusChanged: current.summary.status !== previous.summary.status,
                prevStatus: previous.summary.status,
                currStatus: current.summary.status
            },
            metrics: compareMetrics(current.metrics, previous.metrics),
            violations: compareViolations(current.violations, previous.violations)
        };
    }
};

function compareMetrics(curr, prev) {
    const diffs = {};

    // Compare Scores
    if (curr.scores && prev.scores) {
        diffs.scores = {};
        for (const key of Object.keys(curr.scores)) {
            if (prev.scores[key] !== undefined) {
                diffs.scores[key] = curr.scores[key] - prev.scores[key];
            }
        }
    }

    return diffs;
}

function compareViolations(curr, prev) {
    const currMap = new Map(curr.map(v => [getViolationId(v), v]));
    const prevMap = new Map(prev.map(v => [getViolationId(v), v]));

    const added = [];
    const resolved = [];
    const persistent = [];

    for (const [id, v] of currMap) {
        if (!prevMap.has(id)) {
            added.push(v);
        } else {
            persistent.push(v);
        }
    }

    for (const [id, v] of prevMap) {
        if (!currMap.has(id)) {
            resolved.push(v);
        }
    }

    return { added, resolved, persistentCount: persistent.length };
}

function getViolationId(v) {
    return `${v.area}::${v.metric}::${v.selector || ''}`;
}

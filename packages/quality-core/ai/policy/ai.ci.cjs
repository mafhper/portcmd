/**
 * CI Execution Policy for AI
 * Enforces deterministic behavior, budgets, and timeouts.
 */

const DEFAULT_CONFIG = {
    mode: 'interactive', // or 'ci'
    budget: {
        maxTokens: 2000,
        maxRetries: 3
    },
    timeouts: {
        interactive: 25000,
        ci: 15000
    }
};

function applyCiPolicy(req, config = DEFAULT_CONFIG) {
    const finalReq = { ...req };

    // Set Mode
    const mode = config.mode || 'interactive';

    // Enforce Timeout based on mode
    if (!finalReq.timeoutMs) {
        finalReq.timeoutMs = config.timeouts[mode];
    }

    // In CI mode, we might want to enforce stricter models or parameters
    if (mode === 'ci') {
        // Enforce deterministic params if possible (though Gemini doesn't support seed yet fully)
        finalReq.temperature = 0; // Minimize randomness
    }

    return {
        req: finalReq,
        policy: {
            allowRetries: mode !== 'ci', // CI should be fail-fast usually, or controlled retries
            maxRetries: mode === 'ci' ? 0 : (config.budget.maxRetries || 1)
        }
    };
}

module.exports = applyCiPolicy;

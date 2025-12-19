const createGeminiProvider = require("./providers/gemini.cjs");
const createOpenAIProvider = require("./providers/openai.cjs");
const applyCiPolicy = require("./policy/ai.ci.cjs");

const PROVIDERS = {
    gemini: createGeminiProvider,
    openai: createOpenAIProvider
};

const DEFAULT_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro"
];

const FALLBACK_ORDER = ['gemini-1.5-flash', 'gemini-1.5-pro'];

class AiFacade {
    constructor(config = {}) {
        this.config = config;
        this.apiKey = config.apiKey;
        this.providerName = config.provider || 'gemini';

        const factory = PROVIDERS[this.providerName];
        if (!factory) throw new Error(`Unknown AI provider: ${this.providerName}`);

        this.provider = factory({ apiKey: this.apiKey });
    }

    async generateWithFallback({ prompt, models = FALLBACK_ORDER }) {
        let lastError;

        // Apply Policy
        const defaultReq = {
            prompt,
            temperature: 0.2,
            maxTokens: 1200
        };

        const { req: policyReq, policy } = applyCiPolicy(defaultReq, {
            mode: this.config.mode,
            budget: this.config.budget
        });

        const maxRetries = policy.allowRetries ? models.length : 1;
        const attempts = models.slice(0, maxRetries);

        for (const model of attempts) {
            try {
                const req = { ...policyReq, model };
                const result = await this.provider.generate(req);
                return {
                    ...result,
                    timestamp: new Date().toISOString()
                };
            } catch (err) {
                lastError = err;
                console.warn(`[AI] Model ${model} failed: ${err.message}`);
                // If specific error is fatal (blocker), we could break here
            }
        }

        throw lastError || new Error("All AI models failed");
    }
}

// Singleton helper for easier import
let instance = null;

function init(config) {
    instance = new AiFacade(config);
    return instance;
}

// Wrapper to match old signature for compatibility
async function generateWithFallback(options) { // { apiKey, prompt }
    // Ephemeral instance if not using init
    const facade = new AiFacade({ apiKey: options.apiKey });
    return facade.generateWithFallback({ prompt: options.prompt });
}

module.exports = {
    AiFacade,
    init,
    generateWithFallback
};

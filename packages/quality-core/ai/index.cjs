/**
 * AI Facade - Simplified to match Farol Insight architecture
 * Direct provider usage without complex fallback logic
 */
const createGeminiProvider = require("./providers/gemini.cjs");

async function generateWithFallback(options) {
    const { apiKey, prompt } = options;

    if (!apiKey) {
        throw new Error("API key is required");
    }

    if (!prompt) {
        throw new Error("Prompt is required");
    }

    // Create Gemini provider (matching Farol Insight approach)
    const provider = createGeminiProvider({ apiKey });

    // Direct generation - no fallback, use gemini-2.5-flash as in Farol
    const result = await provider.generate({ prompt });

    return result;
}

module.exports = {
    generateWithFallback,
};

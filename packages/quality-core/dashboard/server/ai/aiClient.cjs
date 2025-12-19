/**
 * AI Client - Gemini API with Fallback (Using Official SDK)
 * Implements: SDK-based generation, timeout, retry logic, model fallback
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
];

function callGemini({ apiKey, prompt, model, timeoutMs = 25000 }) {
    return new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Gemini request timeout"));
        }, timeoutMs);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const genModel = genAI.getGenerativeModel({
                model: model,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1200
                }
            });

            const result = await genModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            clearTimeout(timer);
            if (!text) throw new Error("Empty AI response");
            resolve(text);
        } catch (e) {
            clearTimeout(timer);
            reject(e);
        }
    });
}

async function generateWithFallback({ apiKey, prompt, models = DEFAULT_MODELS }) {
    let lastError;

    for (const model of models) {
        try {
            const content = await callGemini({ apiKey, prompt, model });
            return {
                content,
                model,
                timestamp: new Date().toISOString()
            };
        } catch (err) {
            lastError = err;
            console.warn(`[AI] Model ${model} failed: ${err.message}. Trying next...`);
        }
    }

    console.error(`[AI] All models failed. Last error: ${lastError?.message}`);
    throw lastError || new Error("All Gemini models failed");
}

module.exports = {
    generateWithFallback,
    callGemini,
    DEFAULT_MODELS
};

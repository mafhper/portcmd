const { GoogleGenAI } = require("@google/genai");

module.exports = function createGeminiProvider({ apiKey }) {
  const ai = new GoogleGenAI({ apiKey });

  return {
    id: "gemini",

    async validateKey() {
      // Smoke test to check if key is valid
      await ai.models.list();
    },

    async listModels() {
      const res = await ai.models.list();
      return res.models.map(m => m.name);
    },

    async generate(req) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), req.timeoutMs);

      const start = Date.now();

      try {
        const response = await ai.models.generateContent({
          model: req.model,
          contents: [{ role: "user", parts: [{ text: req.prompt }] }],
          generationConfig: {
            temperature: req.temperature,
            maxOutputTokens: req.maxTokens
          },
          // Note: AbortSignal might not be supported in all versions of the new SDK node-client directly depending on transport,
          // but we keep the structure. If it throws, we catch.
        });

        const candidate = response?.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (!text) throw new Error("EMPTY_RESPONSE");

        return {
          provider: "gemini",
          model: req.model,
          content: text,
          latencyMs: Date.now() - start,
          tokens: {
            input: response.usageMetadata?.promptTokenCount ?? null,
            output: response.usageMetadata?.candidatesTokenCount ?? null
          }
        };
      } finally {
        clearTimeout(timer);
      }
    }
  };
};

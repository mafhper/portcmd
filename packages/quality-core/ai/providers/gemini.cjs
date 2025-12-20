/**
 * Gemini AI Provider - Based on Farol Insight implementation
 * Uses @google/genai SDK exactly as documented in detalhes-farol.md
 */
const { GoogleGenAI } = require("@google/genai");

module.exports = function createGeminiProvider({ apiKey }) {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  const ai = new GoogleGenAI({ apiKey });

  return {
    name: "gemini",

    async validateKey() {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        );
        return response.ok;
      } catch (e) {
        return false;
      }
    },

    async listModels() {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        );
        const data = await response.json();
        return data.models || [];
      } catch (e) {
        console.error("Failed to list models:", e.message);
        return [];
      }
    },

    async generate(req) {
      const start = Date.now();

      try {
        // Use gemini-2.5-flash as in Farol Insight
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: req.prompt,
        });

        // Debug: log the response structure
        console.log("[Gemini] Response structure:", Object.keys(response));

        // Try different ways to access the text content
        let content;

        if (typeof response.text === 'string') {
          content = response.text;
        } else if (typeof response.text === 'function') {
          content = response.text();
        } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
          content = response.candidates[0].content.parts[0].text;
        } else if (response.response?.text) {
          content = typeof response.response.text === 'function'
            ? response.response.text()
            : response.response.text;
        } else {
          console.log("[Gemini] Full response:", JSON.stringify(response, null, 2));
          content = "Unable to extract text from response";
        }

        return {
          content,
          model: "gemini-2.5-flash",
          provider: "gemini",
          latency: Date.now() - start,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Gemini Error:", error.message);
        throw new Error(`Gemini Error: ${error.message}`);
      }
    },
  };
};

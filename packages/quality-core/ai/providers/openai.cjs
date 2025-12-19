// OpenAI Provider Stub - For future expansion or fallback
// Currently serves as a reference implementation

module.exports = function createOpenAIProvider({ apiKey }) {
    // Stub for OpenAI client
    // const OpenAI = require("openai"); 
    // const client = new OpenAI({ apiKey });

    return {
        id: "openai",

        async validateKey() {
            // await client.models.list();
            throw new Error("OpenAI provider not fully implemented yet");
        },

        async listModels() {
            // const res = await client.models.list();
            // return res.data.map(m => m.id);
            return ["gpt-4-turbo", "gpt-3.5-turbo"];
        },

        async generate(req) {
            throw new Error("OpenAI Generation not implemented in this version");

            /* 
            const start = Date.now();
            const res = await client.chat.completions.create({
              model: req.model,
              messages: [{ role: "user", content: req.prompt }],
              temperature: req.temperature,
              max_tokens: req.maxTokens
            });
      
            const text = res.choices?.[0]?.message?.content;
            if (!text) throw new Error("EMPTY_RESPONSE");
      
            return {
              provider: "openai",
              model: req.model,
              content: text,
              latencyMs: Date.now() - start,
              tokens: {
                input: res.usage?.prompt_tokens ?? null,
                output: res.usage?.completion_tokens ?? null
              }
            };
            */
        }
    };
};

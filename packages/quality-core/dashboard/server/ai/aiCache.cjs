/**
 * AI Cache - Deterministic cache by prompt hash
 * Prevents duplicate API calls for identical prompts
 */
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");

const CACHE_DIR = path.join(process.cwd(), "performance-reports", "ai-cache");

async function ensureDir() {
    await fs.mkdir(CACHE_DIR, { recursive: true });
}

function hashPrompt(prompt) {
    return crypto.createHash("sha256").update(prompt).digest("hex");
}

async function getCached(prompt) {
    await ensureDir();
    const hash = hashPrompt(prompt);
    const file = path.join(CACHE_DIR, `${hash}.json`);
    try {
        const data = await fs.readFile(file, "utf-8");
        return JSON.parse(data);
    } catch {
        return null;
    }
}

async function setCached(prompt, payload) {
    await ensureDir();
    const hash = hashPrompt(prompt);
    const file = path.join(CACHE_DIR, `${hash}.json`);
    await fs.writeFile(file, JSON.stringify(payload, null, 2));
}

async function clearCache() {
    try {
        await ensureDir();
        const files = await fs.readdir(CACHE_DIR);
        for (const file of files) {
            await fs.unlink(path.join(CACHE_DIR, file));
        }
        return files.length;
    } catch {
        return 0;
    }
}

module.exports = {
    getCached,
    setCached,
    hashPrompt,
    clearCache
};

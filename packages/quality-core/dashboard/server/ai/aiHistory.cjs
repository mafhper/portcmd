/**
 * AI History - Persist analysis results for audit and comparison
 */
const fs = require("fs").promises;
const path = require("path");

const DIR = path.join(
    process.cwd(),
    "performance-reports",
    "ai-history"
);

async function ensureDir() {
    await fs.mkdir(DIR, { recursive: true });
}

async function save(entry) {
    await ensureDir();
    const file = path.join(DIR, `ai-${Date.now()}.json`);
    await fs.writeFile(file, JSON.stringify(entry, null, 2));
    return file;
}

async function getRecent(limit = 10) {
    try {
        await ensureDir();
        const files = await fs.readdir(DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, limit);

        const results = [];
        for (const file of jsonFiles) {
            try {
                const data = await fs.readFile(path.join(DIR, file), 'utf-8');
                results.push(JSON.parse(data));
            } catch { /* skip invalid files */ }
        }
        return results;
    } catch {
        return [];
    }
}

module.exports = { save, getRecent };

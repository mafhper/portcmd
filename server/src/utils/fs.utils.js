import fs from 'fs/promises';
import path from 'path';

export async function ensureDirectory(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

export async function readDirFiles(dirPath, extension) {
    try {
        await ensureDirectory(dirPath);
        const files = await fs.readdir(dirPath);
        const filtered = files.filter(f => f.endsWith(extension));
        const data = await Promise.all(
            filtered.map(async (file) => {
                try {
                    const stats = await fs.stat(path.join(dirPath, file));
                    return { filename: file, timestamp: stats.mtime };
                } catch { return null; }
            })
        );
        return data.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
    } catch { return []; }
}

import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { readDirFiles } from '../utils/fs.utils.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../../../');
const LOGS_DIR = path.join(ROOT_DIR, 'docs', 'logs');

// GET /api/system/logs
router.get('/logs', async (req, res) => {
    const logs = await readDirFiles(LOGS_DIR, '.md');
    res.json({ success: true, data: logs });
});

// GET /api/system/logs/:filename
router.get('/logs/:filename', async (req, res) => {
    try {
        const filePath = path.join(LOGS_DIR, req.params.filename);
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({
            success: true,
            data: {
                filename: req.params.filename,
                markdown: content,
                html: marked.parse(content)
            }
        });
    } catch (e) {
        res.status(404).json({ success: false, error: 'Log not found' });
    }
});

export default router;

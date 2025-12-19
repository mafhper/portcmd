import express from 'express';
import { ReportsService } from '../services/reports.service.js';

const router = express.Router();

// GET /api/reports/quality
router.get('/quality', async (req, res) => {
    try {
        const { target, limit } = req.query;
        const reports = await ReportsService.listQualityReports(target, Number(limit) || 50);
        res.json({ success: true, count: reports.length, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/reports/quality/:filename
router.get('/quality/:filename', async (req, res) => {
    try {
        const report = await ReportsService.getQualityReport(req.params.filename);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Report not found' });
    }
});

// DELETE /api/reports/quality/:filename
router.delete('/quality/:filename', async (req, res) => {
    try {
        const success = await ReportsService.deleteReport(req.params.filename);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: 'Failed to delete' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

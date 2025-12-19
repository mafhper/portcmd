import { Router } from 'express';
import * as ProjectService from '../services/projects.service.js';

const router = Router();

router.get('/', async (req, res) => {
    const projects = await ProjectService.loadProjects();
    const result = projects.map(p => {
        const state = ProjectService.getProjectState(p.id);
        return {
            ...p,
            isRunning: state.isRunning,
            activeScript: state.activeScript,
            logs: state.logs
        };
    });
    res.json(result);
});

router.post('/', async (req, res) => {
    try {
        const newProject = await ProjectService.addProject(req.body);
        res.json(newProject);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/:id', async (req, res) => {
    const projects = await ProjectService.loadProjects();
    const project = projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const state = ProjectService.getProjectState(req.params.id);
    res.json({
        ...project,
        isRunning: state.isRunning,
        activeScript: state.activeScript,
        logs: state.logs
    });
});

router.delete('/:id', async (req, res) => {
    await ProjectService.removeProject(req.params.id);
    res.json({ success: true });
});

router.delete('/:id/logs', (req, res) => {
    const success = ProjectService.clearLogs(req.params.id);
    res.json({ success });
});

router.post('/:id/run', async (req, res) => {
    try {
        const pid = await ProjectService.runScript(req.params.id, req.body.script);
        res.json({ success: true, pid });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:id/stop', async (req, res) => {
    const success = await ProjectService.stopScript(req.params.id);
    if (success) res.json({ success: true });
    else res.status(400).json({ error: 'Not running' });
});

router.post('/:id/restart', async (req, res) => {
    try {
        const state = ProjectService.getProjectState(req.params.id);
        if (!state.activeScript) return res.status(400).json({ error: 'No active script' });

        // Stop then Run
        await ProjectService.stopScript(req.params.id);
        // Small delay to ensure cleanup? spawn handles new pid.
        const pid = await ProjectService.runScript(req.params.id, state.activeScript);
        res.json({ success: true, pid });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;

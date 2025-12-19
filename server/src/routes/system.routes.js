import express from 'express';
import si from 'systeminformation';
import { ensureDirectory } from '../utils/fs.utils.js';
import * as ProjectService from '../services/projects.service.js';
import * as SystemService from '../services/system.service.js';
import logsRoutes from './logs.routes.js';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
router.use('/logs', logsRoutes); // Mount logs on /api/system/logs
const execPromise = util.promisify(exec);

router.get('/processes', async (req, res) => {
    try {
        const { processes, network, netstat } = await SystemService.getSystemProcesses(
            ProjectService.loadProjects,
            null // We don't need runtimeState here if we use getManagedPids
        );

        // We need to do the mapping logic here or in the service. 
        // To keep service pure, let's bring the mapping logic that depends on 'Managed PIDs' here or in a composed service method.
        // For now, I will reimplement the mapping logic here reusing the raw data from service.

        // Get managed PIDs from ProjectService
        const managedPidsMap = ProjectService.getManagedPids(); // Map<pid, projectId>
        const projects = await ProjectService.loadProjects();
        const managedProjects = new Map();
        projects.forEach(p => managedProjects.set(p.id, p));

        const connMap = new Map();
        const addConns = (list) => {
            list.forEach(conn => {
                if (conn.state === 'LISTEN' && conn.pid) {
                    if (!connMap.has(conn.pid)) {
                        connMap.set(conn.pid, []);
                    }
                    const existing = connMap.get(conn.pid);
                    if (!existing.some(c => c.localPort === conn.localPort)) {
                        existing.push(conn);
                    }
                }
            });
        };

        addConns(network);
        addConns(netstat);

        const formattedProcesses = processes.list
            .filter(p => connMap.has(p.pid) || p.mem > 100000000 || managedPidsMap.has(p.pid))
            .map(p => {
                const conns = connMap.get(p.pid) || [];
                const interestingConn = conns.find(c => c.localPort > 1024) || conns[0];
                const port = interestingConn ? interestingConn.localPort : 0;
                const address = interestingConn ? interestingConn.localAddress : '';

                const projectId = managedPidsMap.get(p.pid);
                const managedProject = projectId ? managedProjects.get(projectId) : null;

                return {
                    pid: p.pid,
                    name: managedProject ? managedProject.name : p.name,
                    port: port,
                    type: managedProject ? 'Development' : SystemService.detectType(p),
                    address: address || 'localhost',
                    user: p.user,
                    status: SystemService.mapState(p.state),
                    memoryUsage: Math.round(p.mem / 1024 / 1024), // MB
                    cpuUsage: parseFloat(p.cpu.toFixed(1)),
                    commandLine: p.command,
                    projectPath: managedProject ? managedProject.path : '',
                    managedById: managedProject ? managedProject.id : undefined,
                    isFavorite: false
                };
            })
            .sort((a, b) => {
                if (a.managedById && !b.managedById) return -1;
                if (!a.managedById && b.managedById) return 1;
                if (a.port > 0 && b.port === 0) return -1;
                if (a.port === 0 && b.port > 0) return 1;
                return b.memoryUsage - a.memoryUsage;
            });

        res.json(formattedProcesses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch processes' });
    }
});

router.post('/processes/:pid/kill', async (req, res) => {
    const pid = parseInt(req.params.pid);
    try {
        // We can reuse the kill logic from ProjectService or SystemService. 
        // It's generic, so let's import it if we exported it, or duplicate simple logic.
        // Ideally it should be in SystemService.

        // For now, defining simple kill here or using exec
        if (process.platform === 'win32') {
            await execPromise(`taskkill /pid ${pid} /T /F`);
        } else {
            process.kill(pid);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/fs/validate', async (req, res) => {
    const { path: checkPath } = req.body;
    try {
        const stats = await fs.stat(checkPath);
        if (!stats.isDirectory()) {
            return res.json({ valid: false, error: 'Not a directory' });
        }
        const pkgPath = path.resolve(checkPath, 'package.json');
        try {
            await fs.access(pkgPath);
            const pkgData = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
            res.json({ valid: true, name: pkgData.name });
        } catch {
            res.json({ valid: true, warning: 'No package.json found' });
        }
    } catch (e) {
        res.json({ valid: false, error: 'Path does not exist' });
    }
});


// GitHub Status Proxy
router.get('/github/status', async (req, res) => {
    const { repo } = req.query;
    const https = await import('https');

    if (!repo) return res.status(400).json({ error: 'Repo required' });

    const options = {
        hostname: 'api.github.com',
        path: `/repos/${repo}/commits?per_page=1`,
        headers: { 'User-Agent': 'PortCmd-App' }
    };

    const apiReq = https.get(options, (apiRes) => {
        let body = '';
        apiRes.on('data', d => body += d);
        apiRes.on('end', () => {
            try {
                if (apiRes.statusCode !== 200) throw new Error('GitHub API Error');
                const commits = JSON.parse(body);
                const last = commits[0];
                res.json({
                    repo,
                    lastCommit: {
                        sha: last.sha.substring(0, 7),
                        message: last.commit.message.split('\n')[0],
                        author: last.commit.author.name,
                        date: last.commit.author.date
                    }
                });
            } catch (e) { res.status(500).json({ error: e.message }); }
        });
    });

    apiReq.on('error', e => res.status(500).json({ error: e.message }));
});

// Ping Service
router.get('/ping', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const start = Date.now();
    const https = await import('https');
    const http = await import('http');
    const client = url.startsWith('https') ? https : http;

    try {
        const pingReq = client.get(url, { timeout: 5000 }, (pingRes) => {
            res.json({
                url,
                status: pingRes.statusCode < 400 ? 'online' : 'slow',
                latency: Date.now() - start,
                lastCheck: Date.now()
            });
            // Consume response to free memory
            pingRes.resume();
        });
        pingReq.on('error', () => res.json({ url, status: 'offline', latency: 0, lastCheck: Date.now() }));
        pingReq.on('timeout', () => { pingReq.destroy(); res.json({ url, status: 'offline', latency: 0, lastCheck: Date.now() }); });
    } catch (e) {
        res.json({ url, status: 'offline', latency: 0, lastCheck: Date.now() });
    }
});

export default router;

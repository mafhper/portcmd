import express from 'express';
import cors from 'cors';
import si from 'systeminformation';
import fs from 'fs/promises';
import path from 'path';
import util from 'util';
import { marked } from 'marked';
import { exec } from 'child_process';

const app = express();
const PORT = 3001;
const PROJECTS_FILE = path.resolve('projects.json');
const REPORTS_DIR = path.resolve('performance-reports/quality');
const LOGS_DIR = path.resolve('docs/logs');

app.use(cors());
app.use(express.json());

// --- Helpers ---

const execPromise = util.promisify(exec);

async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function readDirFiles(dirPath, extension) {
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

function detectType(p) {
  const name = p.name.toLowerCase();
  const cmd = p.command.toLowerCase();
  if (name.includes('node') || cmd.includes('npm') || cmd.includes('yarn') || cmd.includes('bun') || cmd.includes('vite') || cmd.includes('deno')) return 'Development';
  if (name.includes('java')) return 'Java';
  if (name.includes('python')) return 'Python';
  if (name.includes('postgres')) return 'Database';
  if (name.includes('docker')) return 'Container';
  return 'System';
}

function mapState(state) {
  if (!state) return 'Running';
  const s = state.toLowerCase();
  if (s === 'running' || s === 'sleeping' || s === 'unknown') return 'Running';
  if (s === 'blocked' || s === 'suspended') return 'Suspended';
  if (s === 'zombie') return 'Zombie';
  return 'Running';
}

// Windows Netstat Fallback
async function getNetstatConnections() {
  if (process.platform !== 'win32') return [];
  try {
    const { stdout } = await execPromise('netstat -ano');
    const lines = stdout.split('\n');
    const connections = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[0].startsWith('TCP') && parts[3] === 'LISTENING') {
        const localAddr = parts[1];
        const pid = parseInt(parts[4]);
        const lastColon = localAddr.lastIndexOf(':');
        const port = parseInt(localAddr.substring(lastColon + 1));
        const address = localAddr.substring(0, lastColon);
        if (!isNaN(pid) && !isNaN(port)) {
          connections.push({ pid, localPort: port, localAddress: address, state: 'LISTEN' });
        }
      }
    }
    return connections;
  } catch (e) {
    console.error('Netstat failed', e);
    return [];
  }
}

async function killProcessTree(pid) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${pid} /T /F`, (err) => {
        resolve(); 
      });
    } else {
      try {
        process.kill(-pid); // Try killing process group
      } catch (e) {
        try { process.kill(pid); } catch(e) {}
      }
      resolve();
    }
  });
}

async function loadProjects() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function saveProjects(projects) {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// Runtime State
const runtimeState = new Map(); // projectId -> { child, activeScript, logs: [], startTime }

function getProjectState(id) {
  return runtimeState.get(id) || { isRunning: false, logs: [], activeScript: null };
}

// --- Endpoints ---

// Quality Reports
app.get('/api/quality/reports', async (req, res) => {
  const reports = await readDirFiles(REPORTS_DIR, '.json');
  res.json({ success: true, data: reports });
});

app.get('/api/quality/reports/:filename', async (req, res) => {
  try {
    const filePath = path.join(REPORTS_DIR, req.params.filename);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ success: true, data: JSON.parse(content) });
  } catch (e) {
    res.status(404).json({ success: false, error: 'Report not found' });
  }
});

// System Logs
app.get('/api/system/logs', async (req, res) => {
  const logs = await readDirFiles(LOGS_DIR, '.md');
  res.json({ success: true, data: logs });
});

app.get('/api/system/logs/:filename', async (req, res) => {
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

// Get Processes
app.get('/api/processes', async (req, res) => {
  try {
    const [processes, network, netstat, projects] = await Promise.all([
      si.processes(),
      si.networkConnections(),
      getNetstatConnections(),
      loadProjects()
    ]);

    const managedPids = new Map();
    projects.forEach(p => {
      const state = getProjectState(p.id);
      if (state.isRunning && state.child) {
        managedPids.set(state.child.pid, p);
      }
    });

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
      .filter(p => connMap.has(p.pid) || p.mem > 100000000 || managedPids.has(p.pid)) 
      .map(p => {
        const conns = connMap.get(p.pid) || [];
        const interestingConn = conns.find(c => c.localPort > 1024) || conns[0];
        const port = interestingConn ? interestingConn.localPort : 0;
        const address = interestingConn ? interestingConn.localAddress : '';

        const managedProject = managedPids.get(p.pid);

        return {
          pid: p.pid,
          name: managedProject ? managedProject.name : p.name,
          port: port,
          type: managedProject ? 'Development' : detectType(p),
          address: address || 'localhost',
          user: p.user,
          status: mapState(p.state),
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

// Kill Process
app.post('/api/processes/:pid/kill', async (req, res) => {
  const pid = parseInt(req.params.pid);
  try {
    await killProcessTree(pid);
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to kill ${pid}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get Projects
app.get('/api/projects', async (req, res) => {
  const projects = await loadProjects();
  const result = projects.map(p => {
    const state = getProjectState(p.id);
    return { 
      ...p, 
      isRunning: state.isRunning,
      activeScript: state.activeScript,
      logs: state.logs 
    };
  });
  res.json(result);
});

// Get Single Project
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const projects = await loadProjects();
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  
  const state = getProjectState(id);
  res.json({
    ...project,
    isRunning: state.isRunning,
    activeScript: state.activeScript,
    logs: state.logs
  });
});

// Add Project
app.post('/api/projects', async (req, res) => {
  const { name, path: projectPath } = req.body;
  const projects = await loadProjects();
  
  const newProject = {
    id: Date.now().toString(),
    name,
    path: projectPath,
    scripts: {},
    isRunning: false,
    logs: []
  };

  try {
    const pkgPath = path.resolve(projectPath, 'package.json');
    const pkgData = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
    if (pkgData.scripts) {
      newProject.scripts = pkgData.scripts;
    }
  } catch (e) {
    console.log('No package.json found at', projectPath);
  }

  projects.push(newProject);
  await saveProjects(projects);
  res.json(newProject);
});

// Run Project
app.post('/api/projects/:id/run', async (req, res) => {
  const { id } = req.params;
  const { script } = req.body;
  const projects = await loadProjects();
  const project = projects.find(p => p.id === id);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Kill existing if running
  const currentState = runtimeState.get(id);
  if (currentState && currentState.child) {
    await killProcessTree(currentState.child.pid);
  }

  const { spawn } = await import('child_process');
  const cmd = 'npm';
  const args = ['run', script];
  
  // Initialize state
  const logs = [];
  const log = (level, message) => {
    logs.push({ timestamp: new Date().toISOString(), level, message });
    if (logs.length > 1000) logs.shift();
  };

  const child = spawn(cmd, args, { 
    cwd: project.path, 
    shell: true,
    detached: process.platform !== 'win32'
  });

  runtimeState.set(id, {
    child,
    activeScript: script,
    isRunning: true,
    logs,
    startTime: Date.now()
  });

  log('info', `Starting script: ${script}`);

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => { if(line.trim()) log('info', line.trim()); });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => { if(line.trim()) log('error', line.trim()); });
  });

  child.on('close', (code) => {
    log('info', `Process exited with code ${code}`);
    const state = runtimeState.get(id);
    if (state) {
      state.isRunning = false;
      state.child = null;
    }
  });

  res.json({ success: true, pid: child.pid });
});

// Stop Project
app.post('/api/projects/:id/stop', async (req, res) => {
  const { id } = req.params;
  const state = runtimeState.get(id);
  
  if (state && state.child) {
    await killProcessTree(state.child.pid);
    state.isRunning = false;
    state.logs.push({ timestamp: new Date().toISOString(), level: 'warn', message: 'Process stopped by user' });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Not running' });
  }
});

// Restart Project
app.post('/api/projects/:id/restart', async (req, res) => {
  const { id } = req.params;
  const state = runtimeState.get(id);
  
  if (!state || !state.activeScript) {
    return res.status(400).json({ error: 'Project not running or no active script' });
  }

  const script = state.activeScript;
  
  // Stop
  if (state.child) {
    await killProcessTree(state.child.pid);
  }
  
  const projects = await loadProjects();
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { spawn } = await import('child_process');
  const cmd = 'npm';
  const args = ['run', script];
  
  // Initialize state
  state.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: '--- Restarting ---' });
  
  const child = spawn(cmd, args, { 
    cwd: project.path, 
    shell: true,
    detached: process.platform !== 'win32'
  });

  state.child = child;
  state.isRunning = true;
  state.startTime = Date.now();

  const log = (level, message) => {
    state.logs.push({ timestamp: new Date().toISOString(), level, message });
    if (state.logs.length > 1000) state.logs.shift();
  };

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => { if(line.trim()) log('info', line.trim()); });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => { if(line.trim()) log('error', line.trim()); });
  });

  child.on('close', (code) => {
    log('info', `Process exited with code ${code}`);
    if (state.child === child) { 
       state.isRunning = false;
       state.child = null;
    }
  });

  res.json({ success: true, pid: child.pid });
});

// Remove Project
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  let projects = await loadProjects();
  projects = projects.filter(p => p.id !== id);
  await saveProjects(projects);
  res.json({ success: true });
});

// Validate Path
app.post('/api/fs/validate', async (req, res) => {
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

app.get('/', (req, res) => {
  res.send('Port Cmd API is running. Visit the frontend application to interact.');
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});

import fs from 'fs/promises';
import path from 'path';
import { spawn, exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const PROJECTS_FILE = path.resolve(process.cwd(), 'projects.json');

// Runtime State
// projectId -> { child, activeScript, logs: [], startTime, isRunning }
const runtimeState = new Map();

export function getProjectState(id) {
    return runtimeState.get(id) || { isRunning: false, logs: [], activeScript: null };
}

export async function loadProjects() {
    try {
        const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        if (e.code === 'ENOENT') {
            // Create default if missing
            await fs.writeFile(PROJECTS_FILE, '[]');
            return [];
        }
        return [];
    }
}

export async function saveProjects(projects) {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export async function addProject(projectData) {
    const projects = await loadProjects();
    const { name, path: projectPath, url, githubRepo } = projectData;

    const newProject = {
        id: Date.now().toString(),
        name,
        path: projectPath,
        url: url || '',
        githubRepo: githubRepo || '',
        scripts: {},
        isRunning: false,
        logs: [] // Persisted logs could go here, but runtime logs are in memory
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
    return newProject;
}

export async function removeProject(id) {
    let projects = await loadProjects();
    projects = projects.filter(p => p.id !== id);
    await saveProjects(projects);
}

// Execution Logic
function killProcessTree(pid) {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            exec(`taskkill /pid ${pid} /T /F`, () => resolve());
        } else {
            try { process.kill(-pid); } catch (e) {
                try { process.kill(pid); } catch (e) { }
            }
            resolve();
        }
    });
}

export async function runScript(id, script) {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');

    const currentState = runtimeState.get(id);
    if (currentState && currentState.child) {
        await killProcessTree(currentState.child.pid);
    }

    const cmd = 'npm';
    const args = ['run', script];

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
        lines.forEach(line => { if (line.trim()) log('info', line.trim()); });
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => { if (line.trim()) log('error', line.trim()); });
    });

    child.on('close', (code) => {
        log('info', `Process exited with code ${code}`);
        const state = runtimeState.get(id);
        if (state && state.child === child) {
            state.isRunning = false;
            state.child = null;
        }
    });

    return child.pid;
}

export async function stopScript(id) {
    const state = runtimeState.get(id);
    if (state && state.child) {
        await killProcessTree(state.child.pid);
        state.isRunning = false;
        state.logs.push({ timestamp: new Date().toISOString(), level: 'warn', message: 'Process stopped by user' });
        return true;
    }
    return false;
}

export function clearLogs(id) {
    const state = runtimeState.get(id);
    if (state) {
        state.logs = [];
        return true;
    }
    return false;
}

export function getAllProjectStates() {
    return Array.from(runtimeState.entries());
}

// Helper to get active PIDs for system service
export function getManagedPids() {
    const map = new Map();
    runtimeState.forEach((state, id) => {
        if (state.isRunning && state.child) {
            map.set(state.child.pid, id);
        }
    });
    return map;
}

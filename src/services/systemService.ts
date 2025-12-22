import { ProcessEntry, SavedProject, GitHubStatus, SiteStatus, ProcessType, ProcessStatus } from '../types';

const MOCK_PROCESSES: ProcessEntry[] = [
  { pid: 1001, name: 'node', type: ProcessType.DEVELOPMENT, port: 3000, cpuUsage: 2.5, memoryUsage: 150, address: 'localhost', user: 'dev', status: ProcessStatus.RUNNING, commandLine: 'npm start', managedById: 'mn_123', isFavorite: false },
  { pid: 1002, name: 'postgres', type: ProcessType.DATABASE, port: 5432, cpuUsage: 1.2, memoryUsage: 300, address: 'localhost', user: 'postgres', status: ProcessStatus.RUNNING, commandLine: 'postgres -D data', isFavorite: false },
  { pid: 1003, name: 'docker', type: ProcessType.SYSTEM, port: 8080, cpuUsage: 0.5, memoryUsage: 50, address: 'localhost', user: 'root', status: ProcessStatus.RUNNING, commandLine: 'docker-compose up', isFavorite: true },
  { pid: 1004, name: 'python', type: ProcessType.DEVELOPMENT, port: 8000, cpuUsage: 0.8, memoryUsage: 120, address: 'localhost', user: 'dev', status: ProcessStatus.RUNNING, commandLine: 'python manage.py runserver', isFavorite: false },
  { pid: 1005, name: 'redis', type: ProcessType.DATABASE, port: 6379, cpuUsage: 0.3, memoryUsage: 80, address: 'localhost', user: 'redis', status: ProcessStatus.RUNNING, commandLine: 'redis-server', isFavorite: false }
];


const MOCK_PROJECTS: SavedProject[] = [
  { id: 'p1', name: 'Port Command', path: '/home/user/port-command', scripts: { dev: 'npm run dev', build: 'npm run build' }, isRunning: true, activeScript: 'dev', logs: [], url: 'http://localhost:3000', githubRepo: 'mafhper/port-command' },
  { id: 'p2', name: 'Quality Core', path: '/home/user/quality-core', scripts: { test: 'npm test' }, isRunning: false, activeScript: undefined, logs: [] }
];

const MOCK_REPORTS = [
  { filename: 'report-2023-01-02.json', timestamp: new Date(Date.now() - 86400000).toISOString() }
];

const isStaticHost = () => {
  if (typeof window === 'undefined') return false;
  const isStatic = ['github.io', 'vercel.app', 'netlify.app'].some(h => window.location.hostname.includes(h)) ||
    (window.location.hostname === '127.0.0.1' && window.location.port === '5175');
  return isStatic;
};

export const SystemService = {
  getProcesses: async (): Promise<ProcessEntry[]> => {
    // Try to fetch from API, if it fails (e.g. static site), fallback to mock data
    try {
      // @ts-expect-error - Vite env
      if (import.meta.env.DEV || isStaticHost()) {
        console.log('[System] Using mock processes (Dev/Static)');
        return MOCK_PROCESSES;
      }

      const res = await fetch('/api/processes');
      if (!res.ok) throw new Error('API not available');
      return await res.json();
    } catch (e) {
      console.warn('API unavailable, falling back to mock data');
      return MOCK_PROCESSES;
    }
  },

  killProcess: async (pid: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/processes/${pid}/kill`, { method: 'POST' });
      return res.ok;
    } catch (e) {
      console.error(e);
      // specific logic for specific mock process to simulate success?
      if (MOCK_PROCESSES.find(p => p.pid === pid)) return true;
      return false;
    }
  },

  restartProcess: async (pid: number, managedById?: string): Promise<boolean> => {
    console.log(`[System] Restarting process ${pid}`);
    if (managedById) {
      try {
        const res = await fetch(`/api/projects/${managedById}/restart`, { method: 'POST' });
        return res.ok;
      } catch (e) {
        console.error(e);
        return true; // Simulate success in demo
      }
    }
    console.warn('Restart not implemented for generic processes');
    return false;
  },

  getProjectScripts: async (pid: number): Promise<Record<string, string>> => {
    console.log(`[System] Getting scripts for pid ${pid}`);
    // This logic was relying on MOCK_DATA having projectPath.
    // The real API tries to populate projectPath but it's hard.
    // We can try to fetch from /api/projects if we map pid to project?
    // For now return empty.
    return {};
  },

  runProjectScript: async (pid: number, scriptName: string): Promise<boolean> => {
    console.log(`[System] Running script ${scriptName} on pid ${pid}`);
    // This was for running scripts on *detected* processes.
    return false;
  },

  // Project Management
  getSavedProjects: async (): Promise<SavedProject[]> => {
    try {
      // @ts-expect-error - Vite env
      if (import.meta.env.DEV || isStaticHost()) return MOCK_PROJECTS;

      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    } catch (e) {
      console.error(e);
      return MOCK_PROJECTS;
    }
  },

  getProject: async (id: string): Promise<SavedProject | null> => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return await res.json();
    } catch (e) {
      console.error(e);
      return MOCK_PROJECTS.find(p => p.id === id) || null;
    }
  },

  addProject: async (path: string, name: string, url?: string, githubRepo?: string): Promise<SavedProject> => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, name, url, githubRepo })
      });
      if (!res.ok) throw new Error('Failed to add project');
      return await res.json();
    } catch (e) {
      // Return a mock created project for UI usage
      return {
        id: `p_${Date.now()}`,
        name,
        path,
        url,
        githubRepo,
        scripts: {},
        isRunning: false,
        logs: []
      };
    }
  },

  getGitHubStatus: async (repo: string): Promise<GitHubStatus | null> => {
    try {
      if (isStaticHost()) throw new Error('Static host - using mock');
      const res = await fetch(`/api/github/status?repo=${encodeURIComponent(repo)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      // Mock GitHub status
      return {
        repo,
        lastCommit: { sha: 'abc1234', message: 'chore: update dependencies', author: 'Demo User', date: new Date().toISOString() },
        latestWorkflow: { name: 'CI', status: 'completed', conclusion: 'success' }
      };
    }
  },

  pingSite: async (url: string): Promise<SiteStatus> => {
    try {
      const res = await fetch(`/api/ping?url=${encodeURIComponent(url)}`);
      return await res.json();
    } catch {
      return { url, status: 'unknown', latency: 0, lastCheck: Date.now() };
    }
  },

  removeProject: async (id: string): Promise<void> => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => { });
  },

  runSavedProjectScript: async (projectId: string, script: string): Promise<void> => {
    await fetch(`/api/projects/${projectId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    }).catch(() => { });
  },

  clearProjectLogs: async (projectId: string): Promise<void> => {
    await fetch(`/api/projects/${projectId}/logs`, { method: 'DELETE' }).catch(() => { });
  },

  stopSavedProject: async (projectId: string): Promise<void> => {
    await fetch(`/api/projects/${projectId}/stop`, { method: 'POST' }).catch(() => { });
  },

  validatePath: async (path: string): Promise<{ valid: boolean; name?: string; error?: string; warning?: string }> => {
    try {
      const res = await fetch('/api/fs/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      return await res.json();
    } catch (e) {
      return { valid: true, name: 'Demo Path' }; // Always validate in demo
    }
  },

  getQualityReports: async (): Promise<{ filename: string; timestamp: string }[]> => {
    try {
      if (isStaticHost()) return MOCK_REPORTS;
      const res = await fetch('/api/quality/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const json = await res.json();
      return json.data || [];
    } catch { return MOCK_REPORTS; }
  },

  getQualityReport: async (filename: string): Promise<unknown> => {
    try {
      const res = await fetch(`/api/quality/reports/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      return json.data;
    } catch { return { markdown: '# Quality Report\nDemo report content.', html: '<h1>Quality Report</h1><p>Demo report content.</p>' }; }
  },

  getSystemLogs: async (): Promise<{ filename: string; timestamp: string }[]> => {
    try {
      if (isStaticHost()) return [{ filename: 'system.log', timestamp: new Date().toISOString() }];
      const res = await fetch('/api/system/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const json = await res.json();
      return json.data || [];
    } catch { return [{ filename: 'system.log', timestamp: new Date().toISOString() }]; }
  },

  getSystemLog: async (filename: string): Promise<unknown> => {
    try {
      const res = await fetch(`/api/system/logs/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch log');
      const json = await res.json();
      return json.data;
    } catch { return { markdown: '# System Log\nDemo log content.', html: '<h1>System Log</h1><p>Demo log content.</p>' }; }
  }
};
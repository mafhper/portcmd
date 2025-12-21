import { ProcessEntry, SavedProject, GitHubStatus, SiteStatus, ProcessType, ProcessStatus } from '../types';

export const SystemService = {
  getProcesses: async (): Promise<ProcessEntry[]> => {
    try {
      // @ts-expect-error - Vite env
      if (import.meta.env.DEV) {
        // Generate mock data for development
        return [
          { pid: 1001, name: 'node', type: ProcessType.DEVELOPMENT, port: 3000, cpuUsage: 2.5, memoryUsage: 150, address: 'localhost', user: 'dev', status: ProcessStatus.RUNNING, commandLine: 'npm start', managedById: 'mn_123', isFavorite: false },
          { pid: 1002, name: 'postgres', type: ProcessType.DATABASE, port: 5432, cpuUsage: 1.2, memoryUsage: 300, address: 'localhost', user: 'postgres', status: ProcessStatus.RUNNING, commandLine: 'postgres -D data', isFavorite: false },
          { pid: 1003, name: 'docker', type: ProcessType.SYSTEM, port: 8080, cpuUsage: 0.5, memoryUsage: 50, address: 'localhost', user: 'root', status: ProcessStatus.RUNNING, commandLine: 'docker-compose up', isFavorite: true },
          { pid: 1004, name: 'python', type: ProcessType.DEVELOPMENT, port: 8000, cpuUsage: 0.8, memoryUsage: 120, address: 'localhost', user: 'dev', status: ProcessStatus.RUNNING, commandLine: 'python manage.py runserver', isFavorite: false },
          { pid: 1005, name: 'redis', type: ProcessType.DATABASE, port: 6379, cpuUsage: 0.3, memoryUsage: 80, address: 'localhost', user: 'redis', status: ProcessStatus.RUNNING, commandLine: 'redis-server', isFavorite: false }
        ];
      }
      const res = await fetch('/api/processes');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  killProcess: async (pid: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/processes/${pid}/kill`, { method: 'POST' });
      return res.ok;
    } catch (e) {
      console.error(e);
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
        return false;
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
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getProject: async (id: string): Promise<SavedProject | null> => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  addProject: async (path: string, name: string, url?: string, githubRepo?: string): Promise<SavedProject> => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, name, url, githubRepo })
    });
    if (!res.ok) throw new Error('Failed to add project');
    return await res.json();
  },

  getGitHubStatus: async (repo: string): Promise<GitHubStatus | null> => {
    try {
      const res = await fetch(`/api/github/status?repo=${encodeURIComponent(repo)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },

  pingSite: async (url: string): Promise<SiteStatus> => {
    try {
      const res = await fetch(`/api/ping?url=${encodeURIComponent(url)}`);
      return await res.json();
    } catch {
      return { url, status: 'offline', latency: 0, lastCheck: Date.now() };
    }
  },

  removeProject: async (id: string): Promise<void> => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  },

  runSavedProjectScript: async (projectId: string, script: string): Promise<void> => {
    await fetch(`/api/projects/${projectId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });
  },

  clearProjectLogs: async (projectId: string): Promise<void> => {
    await fetch(`/api/projects/${projectId}/logs`, { method: 'DELETE' });
  },

  stopSavedProject: async (projectId: string): Promise<void> => {
    await fetch(`/api/projects/${projectId}/stop`, { method: 'POST' });
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
      return { valid: false, error: 'Network error' };
    }
  },

  getQualityReports: async (): Promise<{ filename: string; timestamp: string }[]> => {
    try {
      const res = await fetch('/api/quality/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  getQualityReport: async (filename: string): Promise<unknown> => {
    try {
      const res = await fetch(`/api/quality/reports/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      return json.data;
    } catch { return null; }
  },

  getSystemLogs: async (): Promise<{ filename: string; timestamp: string }[]> => {
    try {
      const res = await fetch('/api/system/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  getSystemLog: async (filename: string): Promise<unknown> => {
    try {
      const res = await fetch(`/api/system/logs/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch log');
      const json = await res.json();
      return json.data;
    } catch { return null; }
  }
};
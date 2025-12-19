import { ProcessEntry, SavedProject, GitHubStatus, SiteStatus } from '../types';

export const SystemService = {
  getProcesses: async (): Promise<ProcessEntry[]> => {
    try {
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
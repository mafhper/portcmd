import { ProcessEntry, SavedProject } from '../types';

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

  restartProcess: async (_pid: number, managedById?: string): Promise<boolean> => {
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

  getProjectScripts: async (_pid: number): Promise<Record<string, string>> => {
    // This logic was relying on MOCK_DATA having projectPath.
    // The real API tries to populate projectPath but it's hard.
    // We can try to fetch from /api/projects if we map pid to project?
    // For now return empty.
    return {};
  },

  runProjectScript: async (_pid: number, _scriptName: string): Promise<boolean> => {
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

  addProject: async (path: string, name: string): Promise<SavedProject> => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, name })
    });
    if (!res.ok) throw new Error('Failed to add project');
    return await res.json();
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
    const res = await fetch('/api/quality/reports');
    const json = await res.json();
    return json.data || [];
  },

  getQualityReport: async (filename: string): Promise<any> => {
    const res = await fetch(`/api/quality/reports/${filename}`);
    const json = await res.json();
    return json.data;
  },

  getSystemLogs: async (): Promise<{ filename: string; timestamp: string }[]> => {
    const res = await fetch('/api/system/logs');
    const json = await res.json();
    return json.data || [];
  },

  getSystemLog: async (filename: string): Promise<any> => {
    const res = await fetch(`/api/system/logs/${filename}`);
    const json = await res.json();
    return json.data;
  }
};
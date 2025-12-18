export enum ProcessType {
  DEVELOPMENT = 'Development',
  SYSTEM = 'System',
  DATABASE = 'Database',
  OTHER = 'Other'
}

export enum ProcessStatus {
  RUNNING = 'Running',
  SUSPENDED = 'Suspended',
  ZOMBIE = 'Zombie',
  STOPPED = 'Stopped'
}

export interface ProcessEntry {
  pid: number;
  name: string;
  port: number;
  type: ProcessType;
  address: string;
  user: string;
  status: ProcessStatus;
  memoryUsage: number;
  cpuUsage: number;
  commandLine?: string;
  projectPath?: string;
  managedById?: string;
  isFavorite: boolean;
}

export interface SavedProject {
  id: string;
  name: string;
  path: string;
  scripts: Record<string, string>;
  isRunning: boolean;
  activeScript?: string;
  logs: LogEntry[];
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
}

export type Language = 'en' | 'pt-BR' | 'es';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface AppSettings {
  language: Language;
  themeMode: ThemeMode;
  refreshRate: number;
  confirmKill: boolean;
  fontScale: number;
  colorBlindMode: ColorBlindMode;
  sidebarCollapsed: boolean;
  glassOpacity: number;
  glassBlur: number;
  shadowIntensity: number;
  paletteId: string;
  bgType: BackgroundType;
  bgColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  bgGradientAngle: number;
  bgImage?: string;
}

export interface SystemLog {
  filename: string;
  markdown: string;
  html: string;
}

export interface ReportInfo {
  filename: string;
  timestamp: string;
}

export type ViewType = 'dashboard' | 'projects' | 'reports' | 'monitor';

export interface SavedProject {
  id: string;
  name: string;
  path: string;
  url?: string;         // Live URL for monitoring
  githubRepo?: string;  // owner/repo
  scripts: Record<string, string>;
  isRunning: boolean;
  activeScript?: string;
  logs: LogEntry[];
}

export interface SiteStatus {
  url: string;
  status: 'online' | 'slow' | 'offline' | 'unknown';
  latency: number;
  lastCheck: number;
}

export interface GitHubStatus {
  repo: string;
  lastCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  latestWorkflow?: {
    name: string;
    status: string;
    conclusion: string;
  };
}

export interface FilterState {
  search: string;
  type: ProcessType | 'All';
  onlyFavorites: boolean;
  onlyManaged: boolean;
}

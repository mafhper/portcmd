import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, ColorBlindMode } from '../types';
import { detectLanguage } from '../locales';

// Default Settings
const DEFAULT_SETTINGS: AppSettings = {
  language: detectLanguage(),
  themeMode: 'auto',
  refreshRate: 5000,
  confirmKill: true,
  fontScale: 1,
  colorBlindMode: 'none',
  sidebarCollapsed: false,
  glassOpacity: 0.6,
  glassBlur: 12,
  shadowIntensity: 0.5,
  paletteId: 'zinc',
  bgType: 'solid',
  bgColor: '#09090b',
  bgGradientStart: '#0f172a',
  bgGradientEnd: '#312e81',
  bgGradientAngle: 135,
};

// Palette Definitions
export const PALETTES = {
  zinc: { primary: '#6366f1', name: 'Indigo / Zinc' },
  slate: { primary: '#3b82f6', name: 'Blue / Slate' },
  neutral: { primary: '#10b981', name: 'Emerald / Neutral' },
  stone: { primary: '#f97316', name: 'Orange / Stone' },
  rose: { primary: '#f43f5e', name: 'Rose / Gray' },
};

interface PreferencesContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isDark: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// Helper to determine if a color is light or dark
const getLuminance = (hex: string) => {
  if (!hex || hex.length < 6) return 0;
  const c = hex.substring(1);
  const rgb = [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
  const [r, g, b] = rgb.map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastColor = (hex: string) => {
  return getLuminance(hex) > 0.179 ? '#000000' : '#ffffff';
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('portcommand_prefs');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [isDark, setIsDark] = useState(true);

  // Persistence
  useEffect(() => {
    localStorage.setItem('portcommand_prefs', JSON.stringify(settings));
  }, [settings]);

  // Theme Detection
  useEffect(() => {
    const checkTheme = () => {
      if (settings.themeMode === 'auto') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(settings.themeMode === 'dark');
      }
    };
    checkTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', checkTheme);
    return () => media.removeEventListener('change', checkTheme);
  }, [settings.themeMode]);

  // Apply CSS Variables for dynamic customization
  useEffect(() => {
    const root = document.documentElement;
    
    // Theme class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Font Scale
    root.style.fontSize = `${settings.fontScale * 100}%`;

    // Color Blind Filters
    const filterMap: Record<ColorBlindMode, string> = {
      none: 'none',
      protanopia: 'grayscale(0.5) sepia(0.2) hue-rotate(-50deg)',
      deuteranopia: 'grayscale(0.5) sepia(0.2) hue-rotate(50deg)',
      tritanopia: 'grayscale(0.5) sepia(0.5) hue-rotate(90deg)',
      achromatopsia: 'grayscale(1)',
    };
    document.body.style.filter = filterMap[settings.colorBlindMode];

    // Background & Derived Colors
    let currentBg = settings.bgColor;
    if (settings.bgType === 'solid') {
      document.body.style.background = settings.bgColor;
    } else if (settings.bgType === 'gradient') {
      document.body.style.background = `linear-gradient(${settings.bgGradientAngle}deg, ${settings.bgGradientStart}, ${settings.bgGradientEnd})`;
      // Use average luminance for text contrast if gradient
      const avgR = Math.floor((parseInt(settings.bgGradientStart.substring(1, 3), 16) + parseInt(settings.bgGradientEnd.substring(1, 3), 16)) / 2);
      const avgG = Math.floor((parseInt(settings.bgGradientStart.substring(3, 5), 16) + parseInt(settings.bgGradientEnd.substring(3, 5), 16)) / 2);
      const avgB = Math.floor((parseInt(settings.bgGradientStart.substring(5, 7), 16) + parseInt(settings.bgGradientEnd.substring(5, 7), 16)) / 2);
      currentBg = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
    } else if (settings.bgType === 'image' && settings.bgImage) {
      document.body.style.background = `url(${settings.bgImage}) no-repeat center center fixed`;
      document.body.style.backgroundSize = 'cover';
      // For images, we default to standard theme contrast
      currentBg = isDark ? '#000000' : '#ffffff';
    }

    // Set dynamic text colors based on background
    const foreground = getContrastColor(currentBg);
    root.style.setProperty('--foreground', foreground);
    // WCAG 2.1 requires 4.5:1 contrast ratio - use higher opacity for light theme
    root.style.setProperty('--muted-foreground', foreground === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.75)');
    
    // Shadow
    const shadowColor = isDark ? '0, 0, 0' : '100, 116, 139';
    root.style.setProperty('--shadow-color', shadowColor);
    root.style.setProperty('--shadow-intensity', settings.shadowIntensity.toString());

    // Glass Effect variables
    root.style.setProperty('--glass-opacity', settings.glassOpacity.toString());
    root.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
    // Higher opacity backgrounds for better text contrast in light theme
    root.style.setProperty('--card-bg', isDark ? 'rgba(24, 24, 27, 0.4)' : 'rgba(255, 255, 255, 0.85)');
    root.style.setProperty('--border-color', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)');

    // WCAG Contrast Adjustment for Sidebar Text
    if (settings.glassOpacity < 0.4) {
      root.style.setProperty('--sidebar-text', foreground);
    } else {
       root.style.setProperty('--sidebar-text', isDark ? '#e4e4e7' : '#1f1f23');
    }

  }, [settings, isDark]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <PreferencesContext.Provider value={{ settings, updateSettings, isDark }}>
      <div className={`contents ${isDark ? 'dark' : ''}`}>
        {children}
      </div>
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
};

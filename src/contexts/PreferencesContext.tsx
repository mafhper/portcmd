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
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkTheme);
    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkTheme);
  }, [settings.themeMode]);

  // Apply CSS Variables for dynamic customization
  useEffect(() => {
    const root = document.documentElement;
    
    // Font Scale
    root.style.fontSize = `${settings.fontScale * 100}%`;

    // Color Blind Filters
    const filterMap: Record<ColorBlindMode, string> = {
      none: 'none',
      protanopia: 'grayscale(0.5) sepia(0.2) hue-rotate(-50deg)', // Simple simulation approximation
      deuteranopia: 'grayscale(0.5) sepia(0.2) hue-rotate(50deg)',
      tritanopia: 'grayscale(0.5) sepia(0.5) hue-rotate(90deg)',
      achromatopsia: 'grayscale(1)',
    };
    document.body.style.filter = filterMap[settings.colorBlindMode];

    // Background
    if (settings.bgType === 'solid') {
      document.body.style.background = settings.bgColor;
    } else if (settings.bgType === 'gradient') {
      document.body.style.background = `linear-gradient(${settings.bgGradientAngle}deg, ${settings.bgGradientStart}, ${settings.bgGradientEnd})`;
    } else if (settings.bgType === 'image' && settings.bgImage) {
      document.body.style.background = `url(${settings.bgImage}) no-repeat center center fixed`;
      document.body.style.backgroundSize = 'cover';
    }

    // Shadow
    const shadowColor = isDark ? '0, 0, 0' : '100, 116, 139';
    root.style.setProperty('--shadow-color', shadowColor);
    root.style.setProperty('--shadow-intensity', settings.shadowIntensity.toString());

    // Glass Sidebar
    root.style.setProperty('--glass-opacity', settings.glassOpacity.toString());
    root.style.setProperty('--glass-blur', `${settings.glassBlur}px`);

    // WCAG Contrast Adjustment for Sidebar Text
    // Very simplified: High transparency on dark bg needs white text. 
    // High transparency on light bg needs dark text.
    if (settings.glassOpacity < 0.5) {
      // More transparent, rely on body background.
      root.style.setProperty('--sidebar-text', isDark ? '#ffffff' : '#000000');
    } else {
       // Less transparent, standard sidebar colors
       root.style.setProperty('--sidebar-text', isDark ? '#e4e4e7' : '#18181b');
    }

  }, [settings, isDark]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <PreferencesContext.Provider value={{ settings, updateSettings, isDark }}>
      <div className={isDark ? 'dark' : ''}>
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

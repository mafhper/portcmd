import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Monitor, Type, Palette, Eye, Image as ImageIcon } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { PALETTES } from '../constants';
import { useTranslation } from 'react-i18next';
import { ColorBlindMode, BackgroundType } from '../types';

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { settings, updateSettings } = usePreferences();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: t('general'), icon: Monitor },
    { id: 'appearance', label: t('appearance'), icon: Palette },
    { id: 'accessibility', label: t('accessibility'), icon: Eye },
    { id: 'background', label: t('background'), icon: ImageIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 overflow-hidden pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-auto"
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full border pointer-events-auto transition-all bg-surface border-border text-fg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{t('settings')}</h2>
          <button onClick={onClose} aria-label="Close settings" className="p-3 rounded-lg hover:bg-surfaceHover transition-colors -mr-2"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-16 md:w-40 border-r border-border p-4 space-y-2 bg-surface2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px]
                  ${activeTab === tab.id ? 'bg-primary text-primaryFg shadow-lg shadow-primary/20' : 'text-muted hover:bg-surfaceHover'}`}
                title={tab.label}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:block">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <section>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('language')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['en', 'pt-BR', 'es'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => updateSettings({ language: lang as 'en' | 'pt-BR' | 'es' })}
                        className={`px-3 py-2 rounded border text-sm transition-all ${settings.language === lang ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-border bg-surface hover:bg-surfaceHover'}`}
                      >
                        {lang === 'pt-BR' ? 'Português' : lang === 'es' ? 'Español' : 'English'}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('pollingInterval')}</label>
                  <input 
                    type="range" min="1000" max="10000" step="1000"
                    value={settings.refreshRate}
                    onChange={(e) => updateSettings({ refreshRate: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono opacity-50 mt-1">
                    <span>1s (Realtime)</span>
                    <span>{settings.refreshRate / 1000}s</span>
                    <span>10s (Saver)</span>
                  </div>
                </section>

                <section className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface2">
                  <div className="flex items-center space-x-3">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                    <div className="flex flex-col">
                       <span className="text-sm font-medium">{t('safety')}</span>
                       <span className="text-[10px] opacity-50">{t('confirmKill')}</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.confirmKill}
                    onChange={(e) => updateSettings({ confirmKill: e.target.checked })}
                    className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                  />
                </section>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <section>
                   <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('theme')}</label>
                   <div className="flex p-1 bg-surface2 rounded-xl border border-border">
                     {['light', 'auto', 'dark'].map((mode) => (
                       <button
                         key={mode}
                         onClick={() => updateSettings({ themeMode: mode as 'light' | 'auto' | 'dark' })}
                          className={`flex-1 flex items-center justify-center py-2 text-xs font-medium rounded-lg capitalize transition-all ${settings.themeMode === mode ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-fg'}`}
                       >
                         {mode}
                       </button>
                     ))}
                   </div>
                </section>

                <section>
                   <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('palette')}</label>
                   <div className="grid grid-cols-5 gap-3">
                      {Object.entries(PALETTES).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => updateSettings({ paletteId: key })}
                          className={`h-10 rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center ${settings.paletteId === key ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-transparent'}`}
                          style={{ backgroundColor: val.primary }}
                          title={val.name}
                        >
                           {settings.paletteId === key && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                        </button>
                      ))}
                   </div>
                </section>

                <section>
                   <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('glassEffect')} (Sidebar)</label>
                   <div className="space-y-5 bg-surface2 p-4 rounded-xl border border-border">
                     <div>
                       <div className="flex justify-between text-[10px] font-mono opacity-50 mb-2">
                         <span>{t('opacity')}</span>
                         <span>{Math.round(settings.glassOpacity * 100)}%</span>
                       </div>
                       <input 
                          type="range" min="0" max="1" step="0.05"
                          value={settings.glassOpacity}
                          onChange={(e) => updateSettings({ glassOpacity: Number(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                     </div>
                     <div>
                       <div className="flex justify-between text-[10px] font-mono opacity-50 mb-2">
                         <span>{t('blur')}</span>
                         <span>{settings.glassBlur}px</span>
                       </div>
                       <input 
                          type="range" min="0" max="40" step="1"
                          value={settings.glassBlur}
                          onChange={(e) => updateSettings({ glassBlur: Number(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                     </div>
                   </div>
                </section>

                <section>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('shadows')}</label>
                  <input 
                    type="range" min="0" max="1" step="0.1"
                    value={settings.shadowIntensity}
                    onChange={(e) => updateSettings({ shadowIntensity: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </section>
              </div>
            )}

            {/* Accessibility Tab */}
            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <section>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('fontScale')}</label>
                  <div className="flex items-center space-x-4 bg-zinc-50 dark:bg-black/10 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                    <Type className="w-4 h-4 opacity-50" />
                    <input 
                      type="range" min="0.8" max="1.5" step="0.05"
                      value={settings.fontScale}
                      onChange={(e) => updateSettings({ fontScale: Number(e.target.value) })}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="w-12 text-right text-xs font-mono">{Math.round(settings.fontScale * 100)}%</span>
                  </div>
                </section>

                <section>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('colorBlindness')}</label>
                  <select 
                    value={settings.colorBlindMode}
                    onChange={(e) => updateSettings({ colorBlindMode: e.target.value as ColorBlindMode })}
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    style={{ color: 'inherit' }}
                  >
                    <option value="none">None (Normal)</option>
                    <option value="protanopia">Protanopia (Red-Blind)</option>
                    <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                    <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                    <option value="achromatopsia">Achromatopsia (Monochrome)</option>
                  </select>
                </section>
              </div>
            )}

            {/* Background Tab */}
            {activeTab === 'background' && (
              <div className="space-y-6">
                 <section>
                   <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-50">{t('bgType')}</label>
                   <div className="grid grid-cols-3 gap-2 bg-zinc-100 dark:bg-black/20 p-1 rounded-xl border border-zinc-200 dark:border-white/5">
                     {['solid', 'gradient', 'image'].map((type) => (
                       <button
                         key={type}
                         onClick={() => updateSettings({ bgType: type as BackgroundType })}
                         className={`py-2 text-xs font-medium rounded-lg capitalize transition-all ${settings.bgType === type ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg' : 'opacity-50 hover:opacity-100'}`}
                       >
                         {type}
                       </button>
                     ))}
                   </div>
                 </section>

                 {settings.bgType === 'solid' && (
                   <div className="space-y-3 bg-zinc-50 dark:bg-black/10 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                     <label className="text-[10px] font-bold uppercase opacity-50">Color Picker</label>
                     <div className="flex space-x-2">
                        <input type="color" value={settings.bgColor} onChange={(e) => updateSettings({ bgColor: e.target.value })} className="h-10 w-20 rounded-lg cursor-pointer bg-transparent border-none" />
                        <input type="text" value={settings.bgColor} onChange={(e) => updateSettings({ bgColor: e.target.value })} className="flex-1 bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none" />
                     </div>
                   </div>
                 )}

                 {settings.bgType === 'gradient' && (
                   <div className="space-y-5 bg-zinc-50 dark:bg-black/10 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Start Color</label>
                          <input type="color" value={settings.bgGradientStart} onChange={(e) => updateSettings({ bgGradientStart: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">End Color</label>
                          <input type="color" value={settings.bgGradientEnd} onChange={(e) => updateSettings({ bgGradientEnd: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer bg-transparent border-none" />
                        </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Angle: {settings.bgGradientAngle}deg</label>
                       <input 
                          type="range" min="0" max="360" 
                          value={settings.bgGradientAngle}
                          onChange={(e) => updateSettings({ bgGradientAngle: Number(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                     </div>
                   </div>
                 )}

                 {settings.bgType === 'image' && (
                   <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-xl text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => updateSettings({ bgImage: ev.target?.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <ImageIcon className="w-10 h-10 mx-auto opacity-30 mb-3" />
                      <p className="text-sm opacity-50">Click or drag image to upload</p>
                      {settings.bgImage && <div className="mt-3 text-xs text-indigo-400 font-bold bg-indigo-500/10 py-1 px-3 rounded-full inline-block border border-indigo-500/20">Custom Image Active</div>}
                   </div>
                 )}
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;

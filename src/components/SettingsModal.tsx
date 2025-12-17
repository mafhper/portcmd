import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Monitor, Type, Palette, Eye, Image as ImageIcon } from 'lucide-react';
import { usePreferences, PALETTES } from '../contexts/PreferencesContext';
import { translations } from '../locales';
import { ColorBlindMode, BackgroundType } from '../types';

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { settings, updateSettings } = usePreferences();
  const t = translations[settings.language];
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: t.general, icon: Monitor },
    { id: 'appearance', label: t.appearance, icon: Palette },
    { id: 'accessibility', label: t.accessibility, icon: Eye },
    { id: 'background', label: t.background, icon: ImageIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-zinc-200">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[#18181b] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-white">{t.settings}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-zinc-700 bg-zinc-900/30 p-4 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <section>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.language}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['en', 'pt-BR', 'es'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => updateSettings({ language: lang as any })}
                        className={`px-3 py-2 rounded border text-sm ${settings.language === lang ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-zinc-700 bg-zinc-800'}`}
                      >
                        {lang === 'pt-BR' ? 'Português' : lang === 'es' ? 'Español' : 'English'}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.pollingInterval}</label>
                  <input 
                    type="range" min="1000" max="10000" step="1000"
                    value={settings.refreshRate}
                    onChange={(e) => updateSettings({ refreshRate: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>1s (Realtime)</span>
                    <span>{settings.refreshRate / 1000}s</span>
                    <span>10s (Battery Saver)</span>
                  </div>
                </section>

                <section className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 bg-zinc-800/30">
                  <div className="flex items-center space-x-3">
                    <ShieldAlert className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium">{t.safety}: {t.confirmKill}</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.confirmKill}
                    onChange={(e) => updateSettings({ confirmKill: e.target.checked })}
                    className="w-5 h-5 accent-indigo-500 rounded"
                  />
                </section>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <section>
                   <label className="block text-sm font-medium text-zinc-400 mb-2">{t.theme}</label>
                   <div className="flex p-1 bg-zinc-800 rounded-lg">
                     {['light', 'auto', 'dark'].map((mode) => (
                       <button
                         key={mode}
                         onClick={() => updateSettings({ themeMode: mode as any })}
                         className={`flex-1 flex items-center justify-center py-2 text-xs font-medium rounded-md capitalize transition-all ${settings.themeMode === mode ? 'bg-zinc-600 text-white shadow' : 'text-zinc-400'}`}
                       >
                         {mode}
                       </button>
                     ))}
                   </div>
                </section>

                <section>
                   <label className="block text-sm font-medium text-zinc-400 mb-2">{t.palette}</label>
                   <div className="grid grid-cols-5 gap-2">
                      {Object.entries(PALETTES).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => updateSettings({ paletteId: key })}
                          className={`h-8 rounded-full border-2 transition-transform hover:scale-110 ${settings.paletteId === key ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: val.primary }}
                          title={val.name}
                        />
                      ))}
                   </div>
                </section>

                <section>
                   <label className="block text-sm font-medium text-zinc-400 mb-2">{t.glassEffect} (Sidebar)</label>
                   <div className="space-y-4">
                     <div>
                       <div className="flex justify-between text-xs text-zinc-500 mb-1">
                         <span>{t.opacity}</span>
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
                       <div className="flex justify-between text-xs text-zinc-500 mb-1">
                         <span>{t.blur}</span>
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
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.shadows}</label>
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
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.fontScale}</label>
                  <div className="flex items-center space-x-4">
                    <Type className="w-4 h-4" />
                    <input 
                      type="range" min="0.8" max="1.5" step="0.05"
                      value={settings.fontScale}
                      onChange={(e) => updateSettings({ fontScale: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                    <span className="w-12 text-right text-xs">{Math.round(settings.fontScale * 100)}%</span>
                  </div>
                </section>

                <section>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t.colorBlindness}</label>
                  <select 
                    value={settings.colorBlindMode}
                    onChange={(e) => updateSettings({ colorBlindMode: e.target.value as ColorBlindMode })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
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
                   <label className="block text-sm font-medium text-zinc-400 mb-2">{t.bgType}</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['solid', 'gradient', 'image'].map((type) => (
                       <button
                         key={type}
                         onClick={() => updateSettings({ bgType: type as BackgroundType })}
                         className={`py-2 text-xs font-medium rounded border capitalize ${settings.bgType === type ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700'}`}
                       >
                         {type}
                       </button>
                     ))}
                   </div>
                 </section>

                 {settings.bgType === 'solid' && (
                   <div className="space-y-2">
                     <label className="text-xs text-zinc-500">Color Picker</label>
                     <div className="flex space-x-2">
                        <input type="color" value={settings.bgColor} onChange={(e) => updateSettings({ bgColor: e.target.value })} className="h-10 w-20 rounded cursor-pointer" />
                        <input type="text" value={settings.bgColor} onChange={(e) => updateSettings({ bgColor: e.target.value })} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 text-sm" />
                     </div>
                   </div>
                 )}

                 {settings.bgType === 'gradient' && (
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">Start Color</label>
                          <input type="color" value={settings.bgGradientStart} onChange={(e) => updateSettings({ bgGradientStart: e.target.value })} className="w-full h-8 rounded" />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">End Color</label>
                          <input type="color" value={settings.bgGradientEnd} onChange={(e) => updateSettings({ bgGradientEnd: e.target.value })} className="w-full h-8 rounded" />
                        </div>
                     </div>
                     <div>
                       <label className="text-xs text-zinc-500 block mb-1">Angle: {settings.bgGradientAngle}deg</label>
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
                   <div className="p-4 border-2 border-dashed border-zinc-700 rounded-lg text-center cursor-pointer hover:border-indigo-500 transition-colors relative">
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
                      <ImageIcon className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
                      <p className="text-sm text-zinc-400">Click to upload image</p>
                      {settings.bgImage && <div className="mt-2 text-xs text-emerald-400">Image Loaded</div>}
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

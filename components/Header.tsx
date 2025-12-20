import React from 'react';
import { AppMode, Settings, AiModel } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, settings, onSettingsChange }) => {
  const handleModeChange = (mode: AppMode) => {
    onSettingsChange({ ...settings, mode });
  };

  const handleModelChange = (aiModel: AiModel) => {
    onSettingsChange({ ...settings, aiModel });
  };

  return (
    <header className="glass-header sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-200 ring-2 ring-cyan-100 ring-offset-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-800 leading-none">Medical Professor</span>
            <span className="text-xs font-medium text-cyan-600 tracking-wider uppercase">Clinical AI Core</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>

        {/* Model Selector */}
        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleModelChange('gemini-3-flash-preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              settings.aiModel === 'gemini-3-flash-preview'
                ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Flash
          </button>
          <button
            onClick={() => handleModelChange('gemini-3-pro-preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              settings.aiModel === 'gemini-3-pro-preview'
                ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.346a6 6 0 01-3.86.517l-2.388-.477a2 2 0 00-1.022.547l-1.162 1.163a2 2 0 00.597 3.301l1.565.521a2 2 0 001.216 0l1.565-.521a2 2 0 011.216 0l1.565.521a2 2 0 001.216 0l1.565-.521a2 2 0 00.597-3.301l-1.162-1.163z" /></svg>
            Pro
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
        {(['ED', 'Study', 'Exam'] as AppMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
              settings.mode === mode 
                ? 'bg-white text-cyan-700 shadow-md ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="hidden lg:flex items-center gap-4 text-slate-400">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">System Reliable</span>
        </div>
      </div>
    </header>
  );
};
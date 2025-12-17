import React from 'react';
import { AppMode, Settings } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, settings, onSettingsChange }) => {
  
  const handleModeChange = (mode: AppMode) => {
    onSettingsChange({ ...settings, mode });
  };

  return (
    <header className="bg-white shadow-md px-4 py-3 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center space-x-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Open chat history"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden sm:flex p-2 bg-blue-500 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
            </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 hidden xs:block">Medical Professor</h1>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {(['ED', 'Study', 'Exam'] as AppMode[]).map((mode) => (
            <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    settings.mode === mode 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                {mode}
            </button>
        ))}
      </div>
    </header>
  );
};
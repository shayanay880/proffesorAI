
import React, { useState, useEffect } from 'react';
import { getLogs, clearLogs } from '../utils/logger';

interface LogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogViewerModal: React.FC<LogViewerModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLogs(getLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the logs?')) {
        clearLogs();
        setLogs(getLogs());
    }
  };

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temp_del_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🐞</span>
            <div>
                <h2 className="text-lg font-bold text-gray-900">Live Session Logs</h2>
                <p className="text-xs text-gray-500 font-mono">Simulating file: temp_del.md (Auto-saving)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative bg-slate-900 text-slate-300 font-mono text-xs">
            <textarea 
                className="w-full h-full p-4 bg-transparent resize-none focus:outline-none"
                value={logs}
                readOnly
            />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center rounded-b-xl">
          <button 
             onClick={handleClear}
             className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-2 rounded hover:bg-red-50"
          >
             Clear Logs
          </button>
          
          <div className="flex gap-2">
            <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium text-sm transition-all"
            >
                {copied ? 'Copied!' : 'Copy All'}
            </button>
            <button
                onClick={handleDownload}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-sm transition-all flex items-center gap-2"
            >
                <span>📥</span>
                Download .md
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

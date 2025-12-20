import React, { KeyboardEvent, forwardRef } from 'react';
import { getTextDir, getLangFromDir } from '../utils/bidi';

interface ChatInputProps {
  onSendMessage: (input: string) => void;
  isLoading: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSendMessage, isLoading, value, onChange }, ref) => {
    
    const handleSend = () => {
      if (value.trim() && !isLoading) {
        onSendMessage(value);
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const isGlobalSend = (event.ctrlKey || event.metaKey) && event.key === 'Enter';
      if (isGlobalSend) {
        event.preventDefault();
        event.stopPropagation();
        handleSend();
      }
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        handleSend();
      }
    };

    const textDir = getTextDir(value);

    return (
      <div className="relative group p-1 bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-200 ring-4 ring-slate-50 transition-all focus-within:ring-cyan-100 focus-within:border-cyan-300">
        <textarea
          ref={ref}
          aria-label="Chat input"
          className="w-full bg-transparent px-5 py-4 pr-16 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-2xl bidi-text text-slate-700 font-medium placeholder:text-slate-400"
          dir={textDir}
          lang={getLangFromDir(textDir)}
          rows={1}
          placeholder="Enter symptoms, drugs, or medical concepts..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          style={{ maxHeight: '200px', minHeight: '56px' }}
        />
        <div className="absolute left-2 bottom-2 flex gap-1">
            <button 
              aria-label="Insert attachment"
              className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              type="button"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
        </div>
        <button
          aria-label="Send message"
          aria-keyshortcuts="Enter Ctrl+Enter Meta+Enter"
          type="button"
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          className="absolute right-2 bottom-2 bg-cyan-600 text-white rounded-2xl p-3 shadow-lg shadow-cyan-200 hover:bg-cyan-700 hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:scale-100 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);
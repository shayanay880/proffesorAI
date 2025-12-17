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
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    };

    const textDir = getTextDir(value);
    const textLang = getLangFromDir(textDir);

    return (
      <div className="relative">
        <textarea
          ref={ref}
          className="w-full border border-gray-300 rounded-lg p-3 pr-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition bidi-text"
          dir={textDir}
          lang={textLang}
          rows={1}
          placeholder="Ask a medical question..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          style={{ maxHeight: '150px' }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    );
  }
);
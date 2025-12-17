import React from 'react';
import { QUICK_ACTIONS } from '../prompts/actions';

interface ActionToolbarProps {
    onAction: (prompt: string) => void;
    onFlashcards: () => void;
    isLoading: boolean;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ onAction, onFlashcards, isLoading }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
                onClick={onFlashcards}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-800 rounded-full border border-yellow-200 shadow-sm hover:bg-yellow-100 hover:text-yellow-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95 flex items-center"
            >
                ⚡ Flashcards
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1 self-center"></div>
            {QUICK_ACTIONS.map((action) => (
                <button
                    key={action.label}
                    onClick={() => onAction(action.prompt)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-full border border-gray-200 shadow-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95"
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};
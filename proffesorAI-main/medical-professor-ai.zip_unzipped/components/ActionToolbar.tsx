import React from 'react';
import { QUICK_ACTIONS } from '../prompts/actions';

interface ActionToolbarProps {
    onAction: (prompt: string) => void;
    onFlashcards: () => void;
    isLoading: boolean;
    onOpenCaseGenerator: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ onAction, onFlashcards, isLoading, onOpenCaseGenerator }) => {
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <button
                onClick={onFlashcards}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-black bg-cyan-600 text-white rounded-2xl shadow-lg shadow-cyan-200 hover:bg-cyan-700 transition-all disabled:opacity-50 whitespace-nowrap active:scale-95 flex items-center gap-2"
            >
                <span className="text-sm">⚡</span>
                GENERATE CARDS
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            {QUICK_ACTIONS.map((action) => (
                <button
                    key={action.label}
                    onClick={() => action.type === 'case-generator' ? onOpenCaseGenerator() : action.prompt ? onAction(action.prompt) : null}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 hover:bg-white hover:text-cyan-700 hover:border-cyan-300 hover:shadow-sm transition-all disabled:opacity-50 whitespace-nowrap active:scale-95"
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};
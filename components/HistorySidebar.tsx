import React from 'react';
import { Conversation } from '../types';

interface HistorySidebarProps {
  conversations: Conversation[];
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  currentConversationId: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenCaseBuilder: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  conversations,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  currentConversationId,
  isOpen,
  setIsOpen,
  onOpenCaseBuilder
}) => {
  const handleSelect = (id: string) => {
    onSelectConversation(id);
    setIsOpen(false);
  };
  
  return (
    <>
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside className={`w-80 glass-sidebar text-slate-100 flex flex-col fixed inset-y-0 right-0 z-50
        transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-slate-700/50 shadow-2xl shadow-black`}>
        
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white">Clinical Archive</h2>
            <span className="text-[10px] uppercase font-bold text-cyan-500 tracking-widest">Encrypted Local Storage</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={() => { onNewConversation(); setIsOpen(false); }}
            className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-2xl hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Initiate Consultation</span>
          </button>
          
          <button
            onClick={() => { onOpenCaseBuilder(); setIsOpen(false); }}
            className="w-full bg-slate-800 text-slate-200 font-bold py-3 px-4 rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-600 shadow-md"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span>Case Builder</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {conversations.length === 0 && (
            <div className="text-center py-10 px-6 opacity-30">
              <div className="text-4xl mb-4">🗄️</div>
              <p className="text-sm font-medium">Archive is empty.</p>
            </div>
          )}
          {conversations.map(convo => (
            <div
              key={convo.id}
              onClick={() => handleSelect(convo.id)}
              className={`group flex items-center gap-3 p-4 mx-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                currentConversationId === convo.id 
                  ? 'bg-cyan-600/10 border border-cyan-500/30' 
                  : 'hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${currentConversationId === convo.id ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${currentConversationId === convo.id ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {convo.title}
                </p>
                <p className="text-[10px] font-medium text-slate-500 uppercase mt-0.5">
                    {new Date(convo.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConversation(convo.id); }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
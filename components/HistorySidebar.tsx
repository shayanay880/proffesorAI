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
  
  const handleNew = () => {
    onNewConversation();
    setIsOpen(false);
  }

  const handleCaseBuilder = () => {
      onOpenCaseBuilder();
      setIsOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white" aria-label="Close history">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>
      <div className="p-4 border-b border-gray-700 space-y-2">
        <button
          onClick={handleNew}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>New Chat</span>
        </button>
        
        <button
          onClick={handleCaseBuilder}
          className="w-full bg-gray-700 text-gray-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 border border-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Case Builder</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {conversations.map(convo => (
          <div
            key={convo.id}
            role="button"
            tabIndex={0}
            className={`flex items-center justify-between p-3 m-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${
              currentConversationId === convo.id ? 'bg-gray-900' : ''
            }`}
            onClick={() => handleSelect(convo.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(convo.id)}
          >
            <span className="truncate flex-1 mr-2">{convo.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(convo.id);
              }}
              className="text-gray-400 hover:text-white p-1 rounded-full opacity-50 hover:opacity-100 focus:outline-none flex-shrink-0"
              aria-label={`Delete conversation: ${convo.title}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      <aside className={`w-64 bg-gray-800 text-white flex flex-col fixed inset-y-0 left-0 z-30
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
};
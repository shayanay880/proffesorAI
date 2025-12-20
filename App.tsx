import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HistorySidebar } from './components/HistorySidebar';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { PromptStarters } from './components/PromptStarters';
import { CaseBuilderModal } from './components/CaseBuilderModal';
import { CaseGeneratorModal } from './components/CaseGeneratorModal';
import { ActionToolbar } from './components/ActionToolbar';
import { FlashcardModal } from './components/FlashcardModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { Conversation, Message, Settings, Flashcard, Reference, GeneratedCase } from './types';
import { generateResponse } from './services/geminiService';

const generateId = () => crypto.randomUUID();

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const stored = localStorage.getItem('medref.conversations.v2');
    return stored ? JSON.parse(stored) : [];
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    return localStorage.getItem('medref.activeId.v2');
  });

  const [settings, setSettings] = useState<Settings>({ 
    mode: 'Study', 
    studyLoad: 'standard', 
    strictMode: false,
    aiModel: 'gemini-3-pro-preview' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCaseBuilderOpen, setIsCaseBuilderOpen] = useState(false);
  const [isCaseGeneratorOpen, setIsCaseGeneratorOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean>(() => localStorage.getItem('medref.disclaimer') === 'true');
  const [flashcardSource, setFlashcardSource] = useState<string | null>(null);
  const [caseLibrary, setCaseLibrary] = useState<Record<string, GeneratedCase>>({});
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('medref.conversations.v2', JSON.stringify(conversations));
    if (currentConversationId) localStorage.setItem('medref.activeId.v2', currentConversationId);
  }, [conversations, currentConversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading]);

  const handleSendMessage = async (input: string) => {
    if (isLoading || !input.trim()) return;

    const userMessage: Message = { id: generateId(), role: 'user', text: input };
    let convo = conversations.find(c => c.id === currentConversationId);
    
    // Auto-rename logic: 
    // If it's a new conversation OR an existing one that was empty (like "New Chat"), update title based on first message.
    const needsTitleUpdate = !convo || convo.messages.length === 0;
    const computedTitle = input.length > 30 ? input.slice(0, 27) + '...' : input;

    if (!convo) {
      convo = { 
        id: generateId(), 
        title: computedTitle, 
        messages: [userMessage], 
        createdAt: Date.now(), 
        updatedAt: Date.now() 
      };
      setConversations(prev => [convo!, ...prev]);
      setCurrentConversationId(convo.id);
    } else {
      const updatedConvo = { 
        ...convo, 
        title: needsTitleUpdate ? computedTitle : convo.title,
        messages: [...convo.messages, userMessage], 
        updatedAt: Date.now() 
      };
      setConversations(prev => prev.map(c => c.id === updatedConvo.id ? updatedConvo : c));
      convo = updatedConvo;
    }

    setInputValue('');
    setIsLoading(true);

    try {
      const result = await generateResponse(convo.messages, settings);
      const modelMessage: Message = { 
        id: generateId(), 
        role: 'assistant', 
        text: result.responseText, 
        references: result.references
      };
      setConversations(prev => prev.map(c => c.id === convo!.id ? { ...convo!, messages: [...convo!.messages, modelMessage] } : c));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const lastMessage = currentConversation?.messages[currentConversation.messages.length - 1];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <DisclaimerModal isOpen={!hasAcceptedDisclaimer} onAccept={() => { setHasAcceptedDisclaimer(true); localStorage.setItem('medref.disclaimer', 'true'); }} />
      
      <HistorySidebar
        conversations={conversations}
        onNewConversation={() => { const id = generateId(); setConversations([{ id, title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...conversations]); setCurrentConversationId(id); }}
        onSelectConversation={setCurrentConversationId}
        onDeleteConversation={id => { setConversations(prev => prev.filter(c => c.id !== id)); if(currentConversationId === id) setCurrentConversationId(null); }}
        currentConversationId={currentConversationId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenCaseBuilder={() => setIsCaseBuilderOpen(true)}
      />

      <div className="flex flex-col flex-1 relative min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} settings={settings} onSettingsChange={setSettings} />
        
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
          <div className="max-w-4xl mx-auto">
            {currentConversation && currentConversation.messages.length > 0 ? (
                currentConversation.messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
            ) : (
                <PromptStarters onSelectPrompt={setInputValue} />
            )}
            {isLoading && <LoadingIndicator />}
            <div ref={chatEndRef} />
          </div>
        </main>

        <div className="bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent p-6 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {lastMessage?.role === 'assistant' && !isLoading && (
                <ActionToolbar 
                  onAction={handleSendMessage} 
                  onFlashcards={() => setIsFlashcardModalOpen(true)} 
                  isLoading={isLoading} 
                  onOpenCaseGenerator={() => setIsCaseGeneratorOpen(true)} 
                />
            )}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} value={inputValue} onChange={setInputValue} />
          </div>
        </div>
      </div>

      <CaseBuilderModal isOpen={isCaseBuilderOpen} onClose={() => setIsCaseBuilderOpen(false)} onInsert={setInputValue} />
      <CaseGeneratorModal 
        isOpen={isCaseGeneratorOpen} 
        onClose={() => setIsCaseGeneratorOpen(false)} 
        conversationId={currentConversationId}
        onInsert={setInputValue}
        onMakeFlashcards={setFlashcardSource}
        onSaveCase={(id, data) => setCaseLibrary(prev => ({ ...prev, [id]: data }))}
        defaultTopic={currentConversation?.messages[0]?.text}
      />
      <FlashcardModal isOpen={isFlashcardModalOpen} onClose={() => setIsFlashcardModalOpen(false)} sourceText={flashcardSource || lastMessage?.text || ''} onSave={() => {}} />
    </div>
  );
};

export default App;
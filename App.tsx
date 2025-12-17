import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HistorySidebar } from './components/HistorySidebar';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { DisclaimerModal } from './components/DisclaimerModal';
import { PromptStarters } from './components/PromptStarters';
import { CaseBuilderModal } from './components/CaseBuilderModal';
import { ActionToolbar } from './components/ActionToolbar';
import { FlashcardModal } from './components/FlashcardModal';
import { Conversation, Message, Settings, Flashcard, Reference } from './types';
import { generateResponse } from './services/geminiService';

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

const STORAGE_KEY = 'medref.conversations.v1';
const STORAGE_ACTIVE_ID_KEY = 'medref.activeConversationId.v1';
const STORAGE_SETTINGS_KEY = 'medref.settings.v1';

const normalizeReference = (ref: Partial<Reference> & { uri?: string }): Reference => {
  const url = ref.url || ref.uri || '';
  let title = ref.title || '';
  if (!title && url) {
    try {
      title = new URL(url).hostname;
    } catch {
      title = 'Unknown source';
    }
  }

  return {
    uri: ref.uri,
    title: title || 'Unknown source',
    url: url || '#',
    snippet: ref.snippet ?? '',
  };
};

const normalizeMessage = (message: any): Message => {
  let role: Message['role'] = 'user';
  if (message.role === 'assistant' || message.role === 'model') {
    role = 'assistant';
  }
  const references = Array.isArray(message.references)
    ? message.references.map(normalizeReference)
    : undefined;

  return {
    ...message,
    role,
    references,
  };
};

const normalizeConversation = (conversation: any): Conversation => ({
  ...conversation,
  messages: Array.isArray(conversation.messages)
    ? conversation.messages.map(normalizeMessage)
    : [],
});

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map(normalizeConversation) : [];
    } catch (e) {
      console.warn('Failed to load conversations:', e);
      return [];
    }
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (stored) {
          const parsed = JSON.parse(stored);
          return { mode: 'Study', studyLoad: 'standard', strictMode: false, ...parsed };
      }
      return { mode: 'Study', studyLoad: 'standard', strictMode: false };
    } catch {
      return { mode: 'Study', studyLoad: 'standard', strictMode: false };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCaseBuilderOpen, setIsCaseBuilderOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, currentConversationId, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      if (currentConversationId) {
        localStorage.setItem(STORAGE_ACTIVE_ID_KEY, currentConversationId);
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
      }
    } catch (e) {
      console.warn('Failed to save conversations to localStorage:', e);
    }
  }, [conversations, currentConversationId]);

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
  }, [settings]);


  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    return newConversation;
  };

  const handleSendMessage = async (input: string) => {
    if (isLoading || !input.trim()) return;

    let conversationToUpdate: Conversation | undefined;
    if (currentConversationId) {
        conversationToUpdate = conversations.find(c => c.id === currentConversationId);
    }
    
    if (!conversationToUpdate) {
        conversationToUpdate = createNewConversation();
    }
    
    const userMessage: Message = { id: generateId(), role: 'user', text: input };
    setInputValue('');
    
    const isFirstMessage = conversationToUpdate.messages.length === 0;
    
    const newTitle = isFirstMessage 
      ? (input.length <= 30 ? input : input.substring(0, 27) + '...') 
      : conversationToUpdate.title;

    const updatedConversationWithUserMessage = {
        ...conversationToUpdate,
        title: newTitle,
        messages: [...conversationToUpdate.messages, userMessage],
        updatedAt: Date.now(),
    };

    setConversations(prev => prev.map(c => c.id === updatedConversationWithUserMessage.id ? updatedConversationWithUserMessage : c));
    setCurrentConversationId(updatedConversationWithUserMessage.id);
    setIsLoading(true);

    try {
      const geminiResult = await generateResponse(updatedConversationWithUserMessage.messages, settings);

      const modelMessage: Message = {
        id: generateId(),
        role: 'assistant',
        text: geminiResult.responseText,
        references: geminiResult.references
      };

      const finalConversation = {
        ...updatedConversationWithUserMessage,
        messages: [...updatedConversationWithUserMessage.messages, modelMessage],
        updatedAt: Date.now(),
      };

      setConversations(prev => prev.map(c => (c.id === finalConversation.id ? finalConversation : c)));
    } catch (err: any) {
      console.error('Gemini request failed:', err);
      const msg = (err?.message || String(err) || 'Unknown error').trim();
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        text: `<span class="hl-red">⚠️ خطا در ارتباط با Gemini:</span> ${msg}

` +
          `اگر ایران/شبکه دانشگاه هستی و Grounding خطا می‌دهد، اپ خودش بدون سرچ تلاش می‌کند.
` +
          `اگر ادامه داشت: API Key را چک کن، یا VPN/region را عوض کن.`,
      };
      const finalConversation = {
        ...updatedConversationWithUserMessage,
        messages: [...updatedConversationWithUserMessage.messages, errorMessage],
        updatedAt: Date.now(),
      };
      setConversations(prev => prev.map(c => (c.id === finalConversation.id ? finalConversation : c)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };
  
  const handleDeleteConversation = (id: string) => {
    const remainingConversations = conversations.filter(c => c.id !== id);
    setConversations(remainingConversations);
    if (currentConversationId === id) {
        setCurrentConversationId(remainingConversations.length > 0 ? remainingConversations[0].id : null);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleSaveFlashcards = (newCards: Flashcard[]) => {
      if (!currentConversationId) return;
      setConversations(prev => prev.map(c => {
          if (c.id === currentConversationId) {
              const existingCards = c.flashcards || [];
              return { ...c, flashcards: [...existingCards, ...newCards] };
          }
          return c;
      }));
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const lastMessage = currentConversation && currentConversation.messages.length > 0
                      ? currentConversation.messages[currentConversation.messages.length - 1]
                      : null;
  const lastMessageIsAssistant = lastMessage?.role === 'assistant';
  const lastAssistantText = lastMessageIsAssistant ? lastMessage.text : '';

  return (
    <>
      <DisclaimerModal isOpen={showDisclaimer} onAccept={handleAcceptDisclaimer} />
      <CaseBuilderModal 
        isOpen={isCaseBuilderOpen} 
        onClose={() => setIsCaseBuilderOpen(false)} 
        onInsert={handlePromptSelect} 
      />
      <FlashcardModal 
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        sourceText={lastAssistantText}
        onSave={handleSaveFlashcards}
      />
      <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
        <HistorySidebar
          conversations={conversations}
          onNewConversation={createNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          currentConversationId={currentConversationId}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onOpenCaseBuilder={() => setIsCaseBuilderOpen(true)}
        />
        <div className="flex flex-col flex-1">
          <Header 
            onMenuClick={() => setIsSidebarOpen(true)} 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
                <div className="flex-1">
                    {currentConversation && currentConversation.messages.length > 0 ? (
                        currentConversation.messages.map(msg => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))
                    ) : (
                        <PromptStarters onSelectPrompt={handlePromptSelect} />
                    )}
                    {isLoading && <LoadingIndicator />}
                    <div ref={chatEndRef} />
                </div>
            </div>
          </main>
          <footer className="bg-white border-t border-gray-200 p-4">
             <div className="max-w-4xl mx-auto">
                {lastMessageIsAssistant && (
                    <ActionToolbar
                        onAction={handleSendMessage}
                        onFlashcards={() => setIsFlashcardModalOpen(true)}
                        isLoading={isLoading} 
                    />
                )}
                <ChatInput
                    ref={inputRef}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    value={inputValue}
                    onChange={setInputValue}
                />
             </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default App;
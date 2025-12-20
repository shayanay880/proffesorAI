import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { LearningObjectivesSelector } from './components/LearningObjectivesSelector';
import { Conversation, Message, Settings, Flashcard, Reference, GeneratedCase, CaseSession } from './types';
import { generateResponse } from './services/geminiService';
import { CaseSessionPanel } from './components/CaseSessionPanel';

const generateId = () => crypto.randomUUID();

const hydrateCaseSession = (session?: Partial<CaseSession> | null): CaseSession | undefined => {
  if (!session) return undefined;
  return {
    activeCase: session.activeCase || null,
    stageIndex: typeof session.stageIndex === 'number' ? session.stageIndex : 0,
    userChoices: session.userChoices || {},
    feedback: session.feedback || {},
    revealed: session.revealed || {},
  };
};

const hydrateConversations = (raw: any[]): Conversation[] =>
  raw.map((convo) => ({
    ...convo,
    caseSession: hydrateCaseSession(convo.caseSession),
  }));

const createCaseSession = (data: GeneratedCase): CaseSession => ({
  activeCase: data,
  stageIndex: 0,
  userChoices: {},
  feedback: {},
  revealed: {},
});

const buildCaseSessionContext = (session?: CaseSession): string => {
  if (!session?.activeCase || !session.activeCase.storyline?.length) return '';
  const { activeCase } = session;
  const totalStages = activeCase.storyline.length;
  const safeIndex = Math.min(session.stageIndex, totalStages - 1);
  const stage = activeCase.storyline[safeIndex] || activeCase.storyline[0];

  const choice = session.userChoices?.[safeIndex] || 'Pending learner answer';
  const feedback = session.feedback?.[safeIndex] || 'Feedback not revealed yet';
  const optionsText = stage.options?.length ? stage.options.join(' | ') : 'Open response (no pre-set options).';
  const checkpoint = stage.question || 'What would you do next?';

  return [
    `CASE SESSION CONTEXT`,
    `Case: ${activeCase.meta.topic} (${activeCase.meta.setting}) | Mode: ${activeCase.meta.mode || 'Study'}`,
    `Stage ${safeIndex + 1}/${totalStages}: ${stage.title}`,
    `Narrative: ${stage.narrative}`,
    `Checkpoint question: ${checkpoint}`,
    `Options: ${optionsText}`,
    `Learner choice: ${choice}`,
    `Model feedback so far: ${feedback}`,
    `Respond with stage-by-stage coaching: keep the learner on this stage, ask for commitment, and give hints before revealing answers or rationale.`,
  ].join('\n');
};

const loadConversations = (): Conversation[] => {
  const stored = localStorage.getItem('medref.conversations.v2');
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return hydrateConversations(parsed);
    
    console.error('Saved conversations were not in the expected format. Clearing invalid data.');
  } catch (error) {
    console.error('Failed to parse saved conversations. Clearing invalid data.', error);
  }

  // If we reach here, data was corrupted or invalid format
  localStorage.removeItem('medref.conversations.v2');
  return [];
};

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return loadConversations();
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    return localStorage.getItem('medref.activeId.v2');
  });

  const [settings, setSettings] = useState<Settings>({ 
    mode: 'Study', 
    studyLoad: 'standard', 
    strictMode: false,
    aiModel: 'gemini-3-pro-preview',
    learnerLevel: 'Resident'
  });
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCaseBuilderOpen, setIsCaseBuilderOpen] = useState(false);
  const [isCaseGeneratorOpen, setIsCaseGeneratorOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean>(() => localStorage.getItem('medref.disclaimer') === 'true');
  const [flashcardSource, setFlashcardSource] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const updateCaseSession = (updater: (session: CaseSession) => CaseSession) => {
    if (!currentConversationId) return;
    setConversations(prev => prev.map(convo => {
      if (convo.id !== currentConversationId || !convo.caseSession) return convo;
      return { ...convo, caseSession: updater(convo.caseSession), updatedAt: Date.now() };
    }));
  };

  const handleSaveCaseToConversation = (conversationId: string, data: GeneratedCase) => {
    setConversations(prev => {
      let found = false;
      const mapped = prev.map(convo => {
        if (convo.id !== conversationId) return convo;
        found = true;
        return { ...convo, caseSession: createCaseSession(data), updatedAt: Date.now() };
      });
      return found ? mapped : prev;
    });
  };

  const handleStageChange = (nextIndex: number) => {
    updateCaseSession(session => {
      const totalStages = session.activeCase?.storyline?.length || 1;
      const cappedIndex = Math.min(Math.max(nextIndex, 0), totalStages - 1);
      return { ...session, stageIndex: cappedIndex };
    });
  };

  const handleStageOption = (stageIndex: number, option: string) => {
    updateCaseSession(session => ({
      ...session,
      stageIndex,
      userChoices: { ...session.userChoices, [stageIndex]: option }
    }));
  };

  const handleRevealStage = (stageIndex: number) => {
    updateCaseSession(session => {
      const stage = session.activeCase?.storyline?.[stageIndex];
      const feedback = stage ? [stage.reveal || stage.expectedAnswer, stage.teaching].filter(Boolean).join(' — ') : '';
      const nextFeedback = feedback ? { ...session.feedback, [stageIndex]: feedback } : session.feedback;
      return {
        ...session,
        stageIndex,
        revealed: { ...session.revealed, [stageIndex]: true },
        feedback: nextFeedback
      };
    });
  };

  const handleRestartCase = () => {
    updateCaseSession(session => ({
      ...session,
      stageIndex: 0,
      userChoices: {},
      feedback: {},
      revealed: {}
    }));
  };

  const handleInsertStagePrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSendMessage = useCallback(async (input: string) => {
    if (isLoading || !input.trim()) return;

    const userMessage: Message = { id: generateId(), role: 'user', text: input };
    let convo = conversations.find(c => c.id === currentConversationId);
    const objectives = learningObjectives.map(o => o.trim()).filter(Boolean);
    
    // Auto-rename logic: 
    // If it's a new conversation OR an existing one that was empty (like "New Chat"), update title based on first message.
    const needsTitleUpdate = !convo || convo.messages.length === 0;
    const computedTitle = input.length > 30 ? input.slice(0, 27) + '...' : input;

    if (!convo) {
      convo = { 
        id: generateId(), 
        title: computedTitle, 
        messages: [userMessage], 
        meta: { learningObjectives: objectives },
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
        updatedAt: Date.now(),
        meta: { ...convo.meta, learningObjectives: objectives }
      };
      setConversations(prev => prev.map(c => c.id === updatedConvo.id ? updatedConvo : c));
      convo = updatedConvo;
    }

    setInputValue('');
    setIsLoading(true);

    try {
      const contextPrompt = buildCaseSessionContext(convo.caseSession);
      // We do NOT modify the visible messages array with the hidden context,
      // but we send it to the model.
      const messagesForModel = contextPrompt 
        ? [...convo.messages, userMessage, { id: generateId(), role: 'user', text: contextPrompt } as Message]
        : [...convo.messages, userMessage];

      // Note: generateResponse expects the FULL history including the new user message.
      // Since we updated 'convo' above but state update is async, we reconstruct the array.
      // However, we want to hide the context prompt from the UI but send it to API.
      // generateResponse takes Message[]
      
      // Let's pass the tailored list to generateResponse
      // But we must ensure the `convo.messages` in state reflects the UI (no context prompt)
      
      const result = await generateResponse(messagesForModel, settings, objectives);
      
      const modelMessage: Message = { 
        id: generateId(), 
        role: 'assistant', 
        text: result.responseText, 
        references: result.references
      };
      
      setConversations(prev => prev.map(c => c.id === convo!.id ? { ...convo!, messages: [...convo!.messages, modelMessage], meta: { ...convo!.meta, learningObjectives: objectives } } : c));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [conversations, currentConversationId, isLoading, settings, learningObjectives]);

  useEffect(() => {
    localStorage.setItem('medref.conversations.v2', JSON.stringify(conversations));
    if (currentConversationId) localStorage.setItem('medref.activeId.v2', currentConversationId);
  }, [conversations, currentConversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading]);

  useEffect(() => {
    const activeConversation = conversations.find(c => c.id === currentConversationId);
    setLearningObjectives(activeConversation?.meta?.learningObjectives || []);
  }, [conversations, currentConversationId]);

  const handleObjectivesChange = (objectives: string[]) => {
    setLearningObjectives(objectives);
    if (!currentConversationId) return;
    setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, meta: { ...c.meta, learningObjectives: objectives } } : c));
  };

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      const isSendShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'enter';
      const isSidebarShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o';

      if (isSendShortcut) {
        event.preventDefault();
        handleSendMessage(inputValue);
        chatInputRef.current?.focus();
      }

      if (isSidebarShortcut) {
        event.preventDefault();
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [handleSendMessage, inputValue]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const lastMessage = currentConversation?.messages[currentConversation.messages.length - 1];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <DisclaimerModal isOpen={!hasAcceptedDisclaimer} onAccept={() => { setHasAcceptedDisclaimer(true); localStorage.setItem('medref.disclaimer', 'true'); }} />
      
      <HistorySidebar
        conversations={conversations}
        onNewConversation={() => { 
          const id = generateId(); 
          setConversations([{ id, title: 'New Chat', messages: [], meta: { learningObjectives: [] }, createdAt: Date.now(), updatedAt: Date.now() }, ...conversations]); 
          setCurrentConversationId(id); 
        }}
        onSelectConversation={setCurrentConversationId}
        onDeleteConversation={id => { setConversations(prev => prev.filter(c => c.id !== id)); if(currentConversationId === id) setCurrentConversationId(null); }}
        currentConversationId={currentConversationId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenCaseBuilder={() => setIsCaseBuilderOpen(true)}
      />

      <div className="flex flex-col flex-1 relative min-w-0">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          settings={settings} 
          onSettingsChange={setSettings}
          isSidebarOpen={isSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
          <div className="max-w-4xl mx-auto space-y-6">
            {(!currentConversation || currentConversation.messages.length === 0) && (
              <div className="mb-6">
                <LearningObjectivesSelector selected={learningObjectives} onChange={handleObjectivesChange} />
              </div>
            )}
            
            {currentConversation?.caseSession?.activeCase && (
              <CaseSessionPanel
                session={currentConversation.caseSession}
                onSelectOption={handleStageOption}
                onReveal={handleRevealStage}
                onStageChange={handleStageChange}
                onInsertPrompt={handleInsertStagePrompt}
                onRestart={handleRestartCase}
              />
            )}

            {currentConversation && currentConversation.messages.length > 0 ? (
                currentConversation.messages.map(msg => <ChatMessage key={msg.id} message={msg} learnerLevel={settings.learnerLevel} />)
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
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
              value={inputValue} 
              onChange={setInputValue} 
              ref={chatInputRef}
            />
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
        onSaveCase={handleSaveCaseToConversation}
        savedCase={currentConversation?.caseSession?.activeCase || null}
        defaultTopic={currentConversation?.caseSession?.activeCase?.meta.topic || currentConversation?.messages[0]?.text}
        aiModel={settings.aiModel}
        defaultMode={settings.mode}
      />
      <FlashcardModal isOpen={isFlashcardModalOpen} onClose={() => setIsFlashcardModalOpen(false)} sourceText={flashcardSource || lastMessage?.text || ''} onSave={() => {}} />
    </div>
  );
};

export default App;
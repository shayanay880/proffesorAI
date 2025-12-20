export interface Reference {
  /**
   * Canonical URL for the cited source.
   * @deprecated `uri` is kept for backward compatibility and normalized to `url` in code.
   */
  uri?: string;
  /** Human-friendly title for the source. */
  title: string;
  /** Fully-qualified URL for the source. */
  url: string;
  /** Optional snippet or description of the source content. */
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  references?: Reference[];
}

export interface Flashcard {
  type: 'basic' | 'cloze';
  question: string;
  answer: string;
  tags: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  flashcards?: Flashcard[];
  createdAt: number;
  updatedAt: number;
}

export type AppMode = 'ED' | 'Study' | 'Exam';

export type AiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface Settings {
  mode: AppMode;
  studyLoad: 'light' | 'standard' | 'deep';
  strictMode: boolean;
  aiModel: AiModel;
}

export interface CaseStage {
  title: string;
  narrative: string;
  question?: string;
  options?: string[];
  expectedAnswer?: string;
  reveal?: string;
  teaching?: string;
  trap?: string;
  surprise?: string;
}

export interface CaseMemoryAids {
  vividCue: string;
  stakes: string;
  analogy: string;
  mnemonics: string[];
  activeRecall: string[];
  trapsToAvoid: string[];
  hookQuestion: string;
}

export interface GeneratedCase {
  meta: {
    topic: string;
    setting: string;
    level: string;
    length: string;
    language: string;
    interactive: boolean;
    traps: boolean;
    mode?: AppMode | string;
  };
  hook: string;
  stakes: string;
  patient: {
    demographics: string;
    setting: string;
    chiefComplaint: string;
    background: string;
    vitals?: string;
  };
  storyline: CaseStage[];
  twist: string;
  memoryAids: CaseMemoryAids;
  keyTakeaways: string[];
  flashcardSeeds: { question: string; answer: string }[];
  closingReflection: string;
  warnings?: string[];
}